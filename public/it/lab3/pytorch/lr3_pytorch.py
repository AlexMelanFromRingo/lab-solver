"""ЛР3 на PyTorch: ті самі кроки, що в Lobe, але кодом.

Запуск:  python3 lr3_pytorch.py [тека_з_набором]   (за замовчуванням ../data)

Lobe донавчає попередньо навчену мережу: у режимі швидкодії – MobileNetV2, у
режимі точності – ResNet50V2. У torchvision є MobileNetV2 і ResNet50 (версії
V2 немає), тож для режиму точності взято ResNet50. Основа з вагами ImageNet
заморожена, навчається лише новий вихідний шар на чотири класи. Етапи:
  1. швидкодія – MobileNetV2 на теці «навчання»;
  2. точність – ResNet50 на теці «навчання» (і перевірка на «доповненні»,
     поки модель його не бачила);
  3. поліпшення – ResNet50 на «навчанні» разом з «доповненням»;
  4. донавчання верхніх шарів – останній блок ResNet50 (layer4) розморожено,
     малий крок навчання (аналог Optimize Model у Lobe).
Після кожного етапу модель перевіряється на теці «перевірка». Результати
пишуться в results.json поруч зі скриптом; модель етапу 4 зберігається як
TorchScript (export/model.pt).
"""

import json
import sys
import time
from pathlib import Path

import numpy as np
import torch
import torchvision
from PIL import Image
from torch import nn
from torchvision.transforms import v2

HERE = Path(__file__).resolve().parent
DATA = Path(sys.argv[1]) if len(sys.argv) > 1 else HERE.parent / "data"
CLASSES = ["собака", "церква", "сміттєвоз", "парашут"]
SIZE = 224
EPOCHS = 15
SEED = 7
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

torch.manual_seed(SEED)
np.random.seed(SEED)

NORMALIZE = v2.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
# випадкові віддзеркалення й наближення – щоб 40 зображень на клас не
# заучувалися напам'ять
AUGMENT = v2.Compose([v2.RandomHorizontalFlip(),
                      v2.RandomResizedCrop(SIZE, scale=(0.64, 1.0), ratio=(1.0, 1.0))])


def load(split: str) -> tuple[torch.Tensor, torch.Tensor]:
    """Зображення теки: квадратна вирізка по центру, 224 × 224, значення 0…1."""
    xs, ys = [], []
    for label, cls in enumerate(CLASSES):
        for f in sorted((DATA / split / cls).iterdir()):
            im = Image.open(f).convert("RGB")
            w, h = im.size
            s = min(w, h)
            im = im.crop(((w - s) // 2, (h - s) // 2, (w + s) // 2, (h + s) // 2))
            arr = np.asarray(im.resize((SIZE, SIZE)), dtype=np.float32) / 255.0
            xs.append(torch.from_numpy(arr).permute(2, 0, 1))
            ys.append(label)
    return torch.stack(xs), torch.tensor(ys)


def build(name: str) -> tuple[nn.Module, nn.Module]:
    """Модель і її основа (backbone), яку заморожено."""
    if name == "MobileNetV2":
        m = torchvision.models.mobilenet_v2(
            weights=torchvision.models.MobileNet_V2_Weights.IMAGENET1K_V2)
        base = m.features
        m.classifier = nn.Sequential(nn.Dropout(0.2), nn.Linear(1280, len(CLASSES)))
    else:
        m = torchvision.models.resnet50(
            weights=torchvision.models.ResNet50_Weights.IMAGENET1K_V2)
        base = nn.Sequential(*[c for n, c in m.named_children() if n != "fc"])
        m.fc = nn.Sequential(nn.Dropout(0.2), nn.Linear(2048, len(CLASSES)))
    for p in base.parameters():
        p.requires_grad = False
    return m.to(DEVICE), base


def train(model: nn.Module, base: nn.Module, x, y, epochs: int, lr: float) -> float:
    params = [p for p in model.parameters() if p.requires_grad]
    opt = torch.optim.Adam(params, lr=lr)
    loss_fn = nn.CrossEntropyLoss()
    t0 = time.perf_counter()
    for _ in range(epochs):
        model.train()
        base.eval()        # нормалізація пакетів основи лишається з ImageNet
        order = torch.randperm(len(x))
        for i in range(0, len(x), 32):
            idx = order[i:i + 32]
            xb = NORMALIZE(torch.stack([AUGMENT(im) for im in x[idx]])).to(DEVICE)
            loss = loss_fn(model(xb), y[idx].to(DEVICE))
            opt.zero_grad()
            loss.backward()
            opt.step()
    if DEVICE == "cuda":
        torch.cuda.synchronize()
    return time.perf_counter() - t0


@torch.no_grad()
def evaluate(model: nn.Module, x, y) -> dict:
    model.eval()
    pred = torch.cat([model(NORMALIZE(x[i:i + 64]).to(DEVICE)).argmax(1).cpu()
                      for i in range(0, len(x), 64)])
    per_class = {c: f"{int(((pred == i) & (y == i)).sum())}/{int((y == i).sum())}"
                 for i, c in enumerate(CLASSES)}
    errors = [f"{CLASSES[t]} → {CLASSES[p]}" for t, p in zip(y.tolist(), pred.tolist())
              if t != p]
    return {"correct": int((pred == y).sum()), "total": int(len(y)),
            "per_class": per_class, "errors": errors}


def main() -> None:
    x_tr, y_tr = load("навчання")
    x_ex, y_ex = load("доповнення")
    x_val, y_val = load("перевірка")
    stages = []

    def record(stage, model, x_fit, y_fit, seconds, extra=None):
        r = {"stage": stage, "train_images": int(len(x_fit)), "seconds": round(seconds, 1),
             "train": evaluate(model, x_fit, y_fit),
             "validation": evaluate(model, x_val, y_val)}
        if extra is not None:
            r["extra_before_adding"] = extra
        stages.append(r)
        v = r["validation"]
        print(f"{stage}: навчальних {r['train']['correct']}/{r['train']['total']}, "
              f"перевірка {v['correct']}/{v['total']} {v['per_class']}, {r['seconds']} с")

    m, base = build("MobileNetV2")
    record("1. MobileNetV2, навчання", m, x_tr, y_tr, train(m, base, x_tr, y_tr, EPOCHS, 1e-3))

    m, base = build("ResNet50")
    t = train(m, base, x_tr, y_tr, EPOCHS, 1e-3)
    record("2. ResNet50, навчання", m, x_tr, y_tr, t, extra=evaluate(m, x_ex, y_ex))

    x_all, y_all = torch.cat([x_tr, x_ex]), torch.cat([y_tr, y_ex])
    t = train(m, base, x_all, y_all, EPOCHS, 1e-3)
    record("3. ResNet50, навчання + доповнення", m, x_all, y_all, t)

    # останній блок ResNet50 (layer4) донавчається разом з вихідним шаром
    for p in m.layer4.parameters():
        p.requires_grad = True
    t = train(m, base, x_all, y_all, 5, 1e-5)
    record("4. ResNet50, донавчання layer4", m, x_all, y_all, t)

    device = torch.cuda.get_device_name(0) if DEVICE == "cuda" else "CPU"
    out = {"framework": f"PyTorch {torch.__version__}, torchvision {torchvision.__version__}",
           "device": device, "epochs": EPOCHS, "seed": SEED, "stages": stages}
    (HERE / "results.json").write_text(json.dumps(out, ensure_ascii=False, indent=2),
                                       encoding="utf-8")

    # експорт: TorchScript, що запускається без цього скрипту
    export = HERE / "export"
    export.mkdir(exist_ok=True)
    m.eval()
    traced = torch.jit.trace(m, NORMALIZE(x_val[:1]).to(DEVICE))
    traced.save(str(export / "model.pt"))
    (export / "labels.txt").write_text("\n".join(CLASSES) + "\n", encoding="utf-8")
    print(f"експорт: {export / 'model.pt'}")


if __name__ == "__main__":
    main()
