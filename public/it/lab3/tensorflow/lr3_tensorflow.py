"""ЛР3 на TensorFlow/Keras: ті самі кроки, що в Lobe, але кодом.

Запуск:  python3 lr3_tensorflow.py [тека_з_набором]   (за замовчуванням ../data)

Lobe донавчає попередньо навчену мережу: у режимі швидкодії – MobileNetV2, у
режимі точності – ResNet50V2. Тут так само: основа з вагами ImageNet
заморожена, навчається лише новий вихідний шар на чотири класи. Етапи:
  1. швидкодія – MobileNetV2 на теці «навчання»;
  2. точність – ResNet50V2 на теці «навчання» (і перевірка на «доповненні»,
     поки модель його не бачила);
  3. поліпшення – ResNet50V2 на «навчанні» разом з «доповненням»;
  4. донавчання верхніх шарів – останній блок ResNet50V2 розморожено, малий
     крок навчання (аналог Optimize Model у Lobe).
Після кожного етапу модель перевіряється на теці «перевірка». Результати
пишуться в results.json поруч зі скриптом; наприкінці модель етапу 4
зберігається у форматах SavedModel і TensorFlow Lite (тека export/).
"""

import ctypes
import json
import sys
import time
from pathlib import Path

import numpy as np
from PIL import Image

# Якщо в системі є пакети CUDA з Ubuntu, їхня libnvJitLink старіша за ту, з
# якою зібрано libcusparse з pip, і TensorFlow мовчки лишається на процесорі
# («Cannot dlopen some GPU libraries»). Потрібна бібліотека з pip
# завантажується заздалегідь, до імпорту TensorFlow.
try:
    import nvidia.nvjitlink
    ctypes.CDLL(str(Path(nvidia.nvjitlink.__path__[0]) / "lib" / "libnvJitLink.so.12"),
                mode=ctypes.RTLD_GLOBAL)
except (ImportError, OSError):
    pass

import tensorflow as tf  # noqa: E402 – після завантаження libnvJitLink

HERE = Path(__file__).resolve().parent
DATA = Path(sys.argv[1]) if len(sys.argv) > 1 else HERE.parent / "data"
CLASSES = ["собака", "церква", "сміттєвоз", "парашут"]
SIZE = 224
EPOCHS = 15
SEED = 7

tf.keras.utils.set_random_seed(SEED)


def load(split: str) -> tuple[np.ndarray, np.ndarray]:
    """Зображення теки: квадратна вирізка по центру, 224 × 224, значення 0…255."""
    xs, ys = [], []
    for label, cls in enumerate(CLASSES):
        for f in sorted((DATA / split / cls).iterdir()):
            im = Image.open(f).convert("RGB")
            w, h = im.size
            s = min(w, h)
            im = im.crop(((w - s) // 2, (h - s) // 2, (w + s) // 2, (h + s) // 2))
            xs.append(np.asarray(im.resize((SIZE, SIZE)), dtype=np.float32))
            ys.append(label)
    return np.stack(xs), np.array(ys)


BACKBONES = {
    "MobileNetV2": (tf.keras.applications.MobileNetV2,
                    tf.keras.applications.mobilenet_v2.preprocess_input),
    "ResNet50V2": (tf.keras.applications.ResNet50V2,
                   tf.keras.applications.resnet_v2.preprocess_input),
}


def build(name: str) -> tuple[tf.keras.Model, tf.keras.Model, tf.keras.Model]:
    """Модель для навчання, її основа і модель для виведення з тими самими вагами."""
    ctor, prep = BACKBONES[name]
    base = ctor(include_top=False, weights="imagenet", input_shape=(SIZE, SIZE, 3),
                pooling="avg")
    base.trainable = False
    normalize = tf.keras.layers.Lambda(prep)
    head = tf.keras.layers.Dense(len(CLASSES), activation="softmax")

    inputs = tf.keras.Input((SIZE, SIZE, 3))
    # випадкові віддзеркалення й наближення – щоб 40 зображень на клас
    # не заучувалися напам'ять
    x = tf.keras.layers.RandomFlip("horizontal")(inputs)
    x = tf.keras.layers.RandomZoom((-0.2, 0.0))(x)
    x = base(normalize(x), training=False)
    x = tf.keras.layers.Dropout(0.2)(x)
    model = tf.keras.Model(inputs, head(x))

    # для виведення й експорту – без випадкових шарів: конвертер TFLite не має
    # їхніх операцій (StatelessRandomUniformV2, ImageProjectiveTransformV3)
    inputs = tf.keras.Input((SIZE, SIZE, 3))
    infer = tf.keras.Model(inputs, head(base(normalize(inputs), training=False)))
    return model, base, infer


def train(model: tf.keras.Model, x, y, epochs: int, lr: float) -> float:
    model.compile(optimizer=tf.keras.optimizers.Adam(lr),
                  loss="sparse_categorical_crossentropy", metrics=["accuracy"])
    t0 = time.perf_counter()
    model.fit(x, y, epochs=epochs, batch_size=32, shuffle=True, verbose=0)
    return time.perf_counter() - t0


def evaluate(model: tf.keras.Model, x, y) -> dict:
    pred = model.predict(x, batch_size=64, verbose=0).argmax(1)
    per_class = {c: f"{int(((pred == i) & (y == i)).sum())}/{int((y == i).sum())}"
                 for i, c in enumerate(CLASSES)}
    errors = [f"{CLASSES[t]} → {CLASSES[p]}" for t, p in zip(y, pred) if t != p]
    return {"correct": int((pred == y).sum()), "total": int(len(y)),
            "per_class": per_class, "errors": errors}


def main() -> None:
    gpus = tf.config.list_physical_devices("GPU")
    device = tf.config.experimental.get_device_details(gpus[0]).get("device_name") \
        if gpus else "CPU"
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

    m, _, _ = build("MobileNetV2")
    record("1. MobileNetV2, навчання", m, x_tr, y_tr, train(m, x_tr, y_tr, EPOCHS, 1e-3))

    m, base, infer = build("ResNet50V2")
    t = train(m, x_tr, y_tr, EPOCHS, 1e-3)
    record("2. ResNet50V2, навчання", m, x_tr, y_tr, t, extra=evaluate(m, x_ex, y_ex))

    x_all, y_all = np.concatenate([x_tr, x_ex]), np.concatenate([y_tr, y_ex])
    t = train(m, x_all, y_all, EPOCHS, 1e-3)
    record("3. ResNet50V2, навчання + доповнення", m, x_all, y_all, t)

    # останній блок ResNet50V2 (conv5) донавчається разом з вихідним шаром
    base.trainable = True
    for layer in base.layers:
        layer.trainable = layer.name.startswith("conv5") or layer.name.startswith("post")
    t = train(m, x_all, y_all, 5, 1e-5)
    record("4. ResNet50V2, донавчання conv5", m, x_all, y_all, t)

    out = {"framework": f"TensorFlow {tf.__version__}", "device": device,
           "epochs": EPOCHS, "seed": SEED, "stages": stages}
    (HERE / "results.json").write_text(json.dumps(out, ensure_ascii=False, indent=2),
                                       encoding="utf-8")

    # експорт, як у Lobe: SavedModel і TensorFlow Lite
    export = HERE / "export"
    export.mkdir(exist_ok=True)
    infer.export(str(export / "saved_model"))
    tflite = tf.lite.TFLiteConverter.from_saved_model(str(export / "saved_model")).convert()
    (export / "model.tflite").write_bytes(tflite)
    (export / "labels.txt").write_text("\n".join(CLASSES) + "\n", encoding="utf-8")
    print(f"експорт: {export} (TFLite {len(tflite) / 2**20:.0f} МБ)")


if __name__ == "__main__":
    main()
