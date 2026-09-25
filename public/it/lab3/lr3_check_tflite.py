"""Перевірка моделі, експортованої з Lobe у TensorFlow Lite, без самої програми Lobe.

Запуск: python lr3_check_tflite.py <тека експорту TFLite> <тека з підтеками класів>
Потрібні ai-edge-litert (або tflite-runtime), numpy, pillow.
Підготовка зображення та сама, що в прикладі Lobe (example/tflite_example.py):
квадратна вирізка по центру, масштаб до 224×224, значення 0…1.
"""

import json
import sys
from collections import Counter
from pathlib import Path

import numpy as np
from PIL import Image

try:
    from ai_edge_litert.interpreter import Interpreter
except ImportError:
    from tflite_runtime.interpreter import Interpreter


def prepare(path: Path, size: tuple[int, int]) -> np.ndarray:
    im = Image.open(path).convert("RGB")
    w, h = im.size
    s = min(w, h)
    im = im.crop(((w - s) // 2, (h - s) // 2, (w + s) // 2, (h + s) // 2)).resize(size)
    return (np.asarray(im, dtype=np.float32) / 255.0)[None, ...]


def main() -> None:
    model_dir, data_dir = Path(sys.argv[1]), Path(sys.argv[2])
    sig = json.loads((model_dir / "signature.json").read_text(encoding="utf-8"))
    labels = sig["classes"]["Label"]
    it = Interpreter(model_path=str(model_dir / sig["filename"]))
    it.allocate_tensors()
    inp = {d["name"]: d for d in it.get_input_details()}[sig["inputs"]["Image"]["name"]]
    out = {d["name"]: d for d in it.get_output_details()}[sig["outputs"]["Confidences"]["name"]]
    size = tuple(inp["shape"][1:3][::-1])

    right, total = Counter(), Counter()
    for f in sorted(data_dir.glob("*/*")):
        it.set_tensor(inp["index"], prepare(f, size))
        it.invoke()
        conf = it.get_tensor(out["index"])[0]
        cls = f.parent.name
        total[cls] += 1
        right[cls] += labels[int(conf.argmax())] == cls
        if labels[int(conf.argmax())] != cls:
            print(f"  помилка: {cls}/{f.name} -> {labels[int(conf.argmax())]} ({conf.max():.2f})")
    for cls in labels:
        print(f"{cls}: {right[cls]}/{total[cls]}")
    print(f"усього: {sum(right.values())}/{sum(total.values())}")


if __name__ == "__main__":
    main()
