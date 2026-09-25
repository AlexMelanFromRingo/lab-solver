"""Збирає набір зображень ЛР3 з Imagenette за переліком lr3_dataset.csv.

Запуск:  python3 make_dataset.py [тека_призначення]      (за замовчуванням ./data)

Завантажує imagenette2-160.tgz (близько 94 МБ, fast.ai) у тимчасову теку й
розкладає потрібні 360 файлів так само, як для Lobe:
data/<навчання|доповнення|перевірка>/<клас>/<файл>. Наявний архів можна
підкласти змінною IMAGENETTE_TGZ, щоб не завантажувати вдруге.
"""

import csv
import os
import sys
import tarfile
import tempfile
import urllib.request
from pathlib import Path

URL = "https://s3.amazonaws.com/fast-ai-imageclas/imagenette2-160.tgz"
HERE = Path(__file__).resolve().parent


def main() -> None:
    dest = Path(sys.argv[1]) if len(sys.argv) > 1 else HERE / "data"
    rows = list(csv.DictReader(open(HERE / "lr3_dataset.csv", encoding="utf-8")))
    # у архіві файл лежить у train/<wnid>/ або val/<wnid>/ – шукаємо за назвою
    wanted = {(r["wnid"], r["file"]): r for r in rows}

    with tempfile.TemporaryDirectory() as tmp:
        tgz = Path(os.environ.get("IMAGENETTE_TGZ", Path(tmp) / "imagenette2-160.tgz"))
        if not tgz.exists():
            print(f"завантаження {URL}")
            urllib.request.urlretrieve(URL, tgz)
        found = 0
        with tarfile.open(tgz) as tar:
            for member in tar:
                parts = Path(member.name).parts   # imagenette2-160/train/n0…/файл
                if len(parts) != 4 or not member.isfile():
                    continue
                r = wanted.get((parts[2], parts[3]))
                if r is None:
                    continue
                out = dest / r["split"] / r["class"] / r["file"]
                out.parent.mkdir(parents=True, exist_ok=True)
                out.write_bytes(tar.extractfile(member).read())
                found += 1
    print(f"розкладено {found} з {len(rows)} файлів у {dest}")
    if found != len(rows):
        sys.exit("частини файлів в архіві не знайдено")


if __name__ == "__main__":
    main()
