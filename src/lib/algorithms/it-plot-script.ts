/**
 * Готовые тексты второй лабораторной: запись в SMath/Mathcad и программа на
 * Python для тех, у кого Mathcad нет.
 *
 * Mathcad 15 снят с поддержки, Mathcad Prime — коммерческий, а бесплатный
 * Mathcad Express урезан и ставит на документы водяной знак. SMath бесплатен
 * и повторяет запись Mathcad почти дословно, поэтому оба варианта ниже
 * приводятся рядом.
 */

export interface AnalyticFunction {
  id: string;
  label: string;
  mathcad: string;
  python: string;
}

/** Первый в списке — функция из примера 1 методички. */
export const FUNCTIONS: AnalyticFunction[] = [
  { id: "sin", label: "sin x", mathcad: "sin(x)", python: "np.sin(x)" },
  { id: "cos", label: "cos x", mathcad: "cos(x)", python: "np.cos(x)" },
  {
    id: "damped",
    label: "e^(−x/5) · sin x",
    mathcad: "exp(-x/5)*sin(x)",
    python: "np.exp(-x / 5) * np.sin(x)",
  },
  { id: "square", label: "x² / 10", mathcad: "x^2/10", python: "x**2 / 10" },
  { id: "sinc", label: "sin x / x", mathcad: "sin(x)/x", python: "np.sinc(x / np.pi)" },
];

/** Массив из примера 2 методички. */
export const EXAMPLE_ARRAY = [2, 5, 8, 14, 20, 16, 12];

export interface PlotConfig {
  func: AnalyticFunction;
  from: number;
  to: number;
  step: number;
  data: number[];
  /** Путь к книге для третьего задания. */
  workbook: string;
  rows: string;
  columns: string;
}

const num = (v: number) => String(Number(v.toFixed(6)));

/** Запись всех трёх заданий так, как она набирается в SMath или Mathcad. */
export function mathcadListing(c: PlotConfig): string {
  return `Завдання 1. Графік аналітично заданої функції

    f(x) := ${c.func.mathcad}
    x := ${num(c.from)}, ${num(c.from + c.step)} .. ${num(c.to)}

    Вставити область «Графік X-Y», у полі біля осі ординат записати f(x),
    біля осі абсцис — x.

Завдання 2. Графік функції, заданої масивом даних

    ORIGIN := 1
    Data := (${c.data.map(num).join("  ")})ᵀ
    i := 1 .. last(Data)

    Вставити область «Графік X-Y», біля осі ординат записати Data[i,
    біля осі абсцис — i. У властивостях ряду вимкнути лінію й обрати
    маркер «хрестик»: функція задана дискретно, і лінія означала б
    інтерполяцію, якої у вихідних даних немає.

Завдання 3. Імпорт даних з Excel (за бажанням)

    A := READFILE("${c.workbook}", "Excel", ${c.rows}, ${c.columns})

    t := A^<1>     перший стовпець імпортованої матриці
    y := A^<2>     другий стовпець

    Вставити область «Графік X-Y», біля осі ординат записати y,
    біля осі абсцис — t.`;
}

/** Та сама робота засобами Python — для випадку, коли Mathcad недоступний. */
export function pythonListing(c: PlotConfig): string {
  return `# -*- coding: utf-8 -*-
"""Лабораторна робота 2. Побудова графіків.

Три завдання: за аналітично заданою функцією, за масивом дискретних даних
і за даними, імпортованими з книги Excel.

Запуск:  python3 plots.py
Потрібні: numpy, matplotlib, pandas (для третього завдання).
"""

from pathlib import Path

import numpy as np
import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt

IMG = Path(__file__).resolve().parent / "img"

plt.rcParams.update({
    "font.family": "Times New Roman",
    "font.size": 12,
    "axes.linewidth": 1.0,
    "figure.dpi": 200,
    "savefig.bbox": "tight",
})

# кома як десятковий розділювач і справжній знак мінус на осях
COMMA = matplotlib.ticker.FuncFormatter(
    lambda v, _: f"{v:g}".replace(".", ",").replace("-", "\\N{MINUS SIGN}")
)


def axes(ax, xlabel, ylabel):
    """Область побудови у стилі Mathcad: рамка та сітка."""
    ax.grid(True, color="#B0B0B0", linewidth=0.6)
    ax.set_xlabel(xlabel, labelpad=4)
    ax.set_ylabel(ylabel, rotation=0, labelpad=18, ha="right")
    ax.xaxis.set_major_formatter(COMMA)
    ax.yaxis.set_major_formatter(COMMA)
    for spine in ax.spines.values():
        spine.set_color("black")


# --------------------------------------------------------------- Завдання 1
def task1(path=IMG / "plot_function.png"):
    x = np.linspace(${num(c.from)}, ${num(c.to)}, 1000)
    f = ${c.func.python}

    fig, ax = plt.subplots(figsize=(6.2, 3.6))
    ax.plot(x, f, color="#C00000", linewidth=1.6)
    ax.set_xlim(${num(c.from)}, ${num(c.to)})
    axes(ax, "x", "f(x)")
    fig.savefig(path)
    plt.close(fig)


# --------------------------------------------------------------- Завдання 2
# Аналог ORIGIN := 1 та i := 1 .. last(Data)
def task2(path=IMG / "plot_array.png"):
    Data = np.array([${c.data.map(num).join(", ")}], dtype=float)
    i = np.arange(1, len(Data) + 1)

    fig, ax = plt.subplots(figsize=(6.2, 3.6))
    # лінія між вузлами не проводиться: функція задана дискретно
    ax.plot(i, Data, linestyle="none", marker="x", markersize=9,
            markeredgewidth=1.8, color="#C00000")
    ax.set_xlim(0, len(Data) + 1)
    ax.set_ylim(0, float(Data.max()) * 1.1)
    ax.set_xticks(range(0, len(Data) + 2))
    axes(ax, "i", "Data$_i$")
    fig.savefig(path)
    plt.close(fig)


# --------------------------------------------------------------- Завдання 3
# Аналог READFILE: імпорт таблиці із книги Excel
def task3(path=IMG / "plot_readfile.png", workbook="${c.workbook}"):
    import pandas as pd

    A = pd.read_excel(workbook, usecols="${c.columns.replace(/[()]/g, "")}", nrows=10)
    t = A.iloc[:, 0].to_numpy(dtype=float)
    y = A.iloc[:, 1].to_numpy(dtype=float)

    fig, ax = plt.subplots(figsize=(6.4, 3.8))
    ax.plot(t, y, linestyle="none", marker="o", markersize=6, color="#C00000")
    axes(ax, A.columns[0], A.columns[1])
    fig.savefig(path)
    plt.close(fig)


if __name__ == "__main__":
    IMG.mkdir(exist_ok=True)
    task1()
    task2()
    try:
        task3()
    except FileNotFoundError:
        print("Третє завдання пропущено: книги Excel немає поруч.")
`;
}
