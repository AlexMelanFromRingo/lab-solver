/**
 * Пропускная способность непрерывного канала с шумом — Лаба 6 "Теории информации".
 *
 * Формула подтверждена численно по реальному отчёту (Универ/Теория информации/Лаба 6/
 * Інструменти/Сливець КБ2211 926 Лабораторна 6.DOCX и Пропускна спроможність
 * безперервного каналу.xls — таблица "Аналіз пропускної спроможності", сверено на двух
 * независимых строках с совпадением до 3-4 значащих цифр):
 *
 *   S/N = Px / (pe · Δf)          Px — мощность сигнала (мВт), pe — плотность шума
 *                                  (мкВт/Гц), Δf — полоса (МГц); числа берутся как есть,
 *                                  без перевода в СИ — именно так считает методичка курса.
 *   Ic = log2(1 + S/N)             информационная нагрузка сигнала, бит/сигнал
 *   C  = Δf · Ic                   пропускная способность, Мбит/с
 *
 * pe1/pe2 — два варианта плотности шума из таблицы вариантов, считаются параллельно
 * для сравнения (в отчёте — колонки X1/X2, Iс(pe1)/Iс(pe2), C(pe1)/C(pe2)).
 */

export interface ChannelPoint {
  snrPlusOne: number; // X = 1 + S/N
  bitsPerSignal: number; // Ic = log2(X)
  capacityMbitPerSec: number; // C = Δf · Ic
}

export function analyzeContinuousChannel(px: number, pe: number, bandwidthMHz: number): ChannelPoint {
  const snrPlusOne = 1 + px / (pe * bandwidthMHz);
  const bitsPerSignal = Math.log2(snrPlusOne);
  return {
    snrPlusOne,
    bitsPerSignal,
    capacityMbitPerSec: bandwidthMHz * bitsPerSignal,
  };
}

export interface ChannelReport {
  bandwidthMHz: number;
  pe1: ChannelPoint;
  pe2: ChannelPoint;
}

export function buildChannelReport(px: number, pe1: number, pe2: number, bandwidthMHz: number): ChannelReport {
  return {
    bandwidthMHz,
    pe1: analyzeContinuousChannel(px, pe1, bandwidthMHz),
    pe2: analyzeContinuousChannel(px, pe2, bandwidthMHz),
  };
}
