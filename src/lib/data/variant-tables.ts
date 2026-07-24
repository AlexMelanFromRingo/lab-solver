/**
 * Таблицы вариантов "Теория информации", лабы 2/4/5/6/7 — извлечены из оригинальных
 * .xlsx/.xls файлов методичек (Универ/Теория информации/Лаба N/...) через
 * `soffice --headless --convert-to csv`, транскрибированы 1:1, ничего не выдумано.
 */

export interface Lab2Variant {
  variant: number;
  probs: [number, number, number, number, number]; // z1..z5
  sequence: string[]; // например ["z2","z1","z3",...]
}

export const LAB2_VARIANTS: Lab2Variant[] = [
  { variant: 1, probs: [0.36, 0.24, 0.18, 0.13, 0.09], sequence: "z2 z1 z3 z5 z2 z1 z2 z3 z4 z1".split(" ") },
  { variant: 2, probs: [0.46, 0.24, 0.13, 0.1, 0.07], sequence: "z1 z1 z3 z5 z2 z1 z2 z1 z4 z1".split(" ") },
  { variant: 3, probs: [0.35, 0.24, 0.2, 0.13, 0.08], sequence: "z3 z1 z2 z5 z2 z1 z2 z3 z1 z4".split(" ") },
  { variant: 4, probs: [0.53, 0.22, 0.14, 0.07, 0.04], sequence: "z4 z1 z3 z5 z1 z1 z2 z1 z2 z1".split(" ") },
  { variant: 5, probs: [0.33, 0.26, 0.21, 0.14, 0.06], sequence: "z5 z1 z2 z3 z2 z1 z2 z3 z1 z4".split(" ") },
  { variant: 6, probs: [0.51, 0.21, 0.13, 0.09, 0.06], sequence: "z1 z4 z3 z5 z1 z1 z2 z1 z2 z1".split(" ") },
  { variant: 7, probs: [0.35, 0.27, 0.2, 0.13, 0.05], sequence: "z2 z1 z3 z5 z2 z1 z2 z3 z4 z1".split(" ") },
  { variant: 8, probs: [0.62, 0.18, 0.1, 0.06, 0.04], sequence: "z1 z1 z3 z5 z2 z1 z2 z1 z4 z1".split(" ") },
  { variant: 9, probs: [0.32, 0.26, 0.18, 0.15, 0.09], sequence: "z3 z1 z2 z5 z2 z1 z2 z3 z1 z4".split(" ") },
  { variant: 10, probs: [0.48, 0.27, 0.13, 0.08, 0.04], sequence: "z4 z1 z3 z5 z1 z1 z2 z1 z2 z1".split(" ") },
  { variant: 11, probs: [0.38, 0.26, 0.19, 0.11, 0.06], sequence: "z5 z1 z2 z3 z2 z1 z2 z3 z1 z4".split(" ") },
  { variant: 12, probs: [0.55, 0.22, 0.12, 0.08, 0.03], sequence: "z1 z4 z3 z5 z1 z1 z2 z1 z2 z1".split(" ") },
];

export interface Lab4Variant {
  variant: number;
  lengthMB: number;
  speedSymPerSec: number;
  p1: number;
  p2: number;
  p3: number;
  message1: string;
  message2: string;
}

export const LAB4_VARIANTS: Lab4Variant[] = [
  { variant: 1, lengthMB: 128, speedSymPerSec: 100, p1: 0.005, p2: 0.03, p3: 0.1, message1: "0110", message2: "1011" },
  { variant: 2, lengthMB: 256, speedSymPerSec: 50, p1: 0.008, p2: 0.025, p3: 0.12, message1: "0100", message2: "1101" },
  { variant: 3, lengthMB: 312, speedSymPerSec: 200, p1: 0.01, p2: 0.04, p3: 0.11, message1: "0101", message2: "1000" },
  { variant: 4, lengthMB: 172, speedSymPerSec: 150, p1: 0.006, p2: 0.03, p3: 0.08, message1: "1010", message2: "0001" },
  { variant: 5, lengthMB: 224, speedSymPerSec: 100, p1: 0.007, p2: 0.035, p3: 0.1, message1: "0100", message2: "1101" },
  { variant: 6, lengthMB: 256, speedSymPerSec: 50, p1: 0.004, p2: 0.02, p3: 0.09, message1: "0101", message2: "1000" },
  { variant: 7, lengthMB: 312, speedSymPerSec: 200, p1: 0.005, p2: 0.04, p3: 0.08, message1: "0110", message2: "1011" },
  { variant: 8, lengthMB: 172, speedSymPerSec: 150, p1: 0.008, p2: 0.03, p3: 0.1, message1: "1010", message2: "0001" },
  { variant: 9, lengthMB: 312, speedSymPerSec: 100, p1: 0.01, p2: 0.025, p3: 0.09, message1: "0100", message2: "1101" },
  { variant: 10, lengthMB: 172, speedSymPerSec: 50, p1: 0.006, p2: 0.03, p3: 0.1, message1: "0101", message2: "1000" },
  { variant: 11, lengthMB: 224, speedSymPerSec: 200, p1: 0.007, p2: 0.035, p3: 0.12, message1: "1010", message2: "0001" },
  { variant: 12, lengthMB: 256, speedSymPerSec: 150, p1: 0.004, p2: 0.02, p3: 0.11, message1: "0100", message2: "1101" },
];

export interface Lab5Variant {
  variant: number;
  nibbleHex: string;
  byteHex: string;
  generatorPoly: "x3+x+1" | "x3+x2+1";
}

export const LAB5_VARIANTS: Lab5Variant[] = [
  { variant: 1, nibbleHex: "1", byteHex: "B2", generatorPoly: "x3+x+1" },
  { variant: 2, nibbleHex: "A", byteHex: "1C", generatorPoly: "x3+x2+1" },
  { variant: 3, nibbleHex: "2", byteHex: "D4", generatorPoly: "x3+x+1" },
  { variant: 4, nibbleHex: "B", byteHex: "5E", generatorPoly: "x3+x2+1" },
  { variant: 5, nibbleHex: "3", byteHex: "A7", generatorPoly: "x3+x+1" },
  { variant: 6, nibbleHex: "C", byteHex: "93", generatorPoly: "x3+x2+1" },
  { variant: 7, nibbleHex: "4", byteHex: "F6", generatorPoly: "x3+x+1" },
  { variant: 8, nibbleHex: "D", byteHex: "4C", generatorPoly: "x3+x2+1" },
  { variant: 9, nibbleHex: "5", byteHex: "D8", generatorPoly: "x3+x+1" },
  { variant: 10, nibbleHex: "E", byteHex: "5B", generatorPoly: "x3+x2+1" },
  { variant: 11, nibbleHex: "6", byteHex: "AE", generatorPoly: "x3+x+1" },
  { variant: 12, nibbleHex: "F", byteHex: "24", generatorPoly: "x3+x2+1" },
];

export interface Lab6Variant {
  variant: number;
  bandwidthMin: number;
  bandwidthMax: number;
  powerMw: number;
  noisePe1: number;
  noisePe2: number;
  imin: number;
  cmin: number;
  pulseDurationUs: number;
  carrierMHz: number;
  modulation1: string;
  modulation2: string;
  targetErrorProb: string;
}

export const LAB6_VARIANTS: Lab6Variant[] = [
  { variant: 1, bandwidthMin: 300, bandwidthMax: 200, powerMw: 25, noisePe1: 0.01, noisePe2: 0.04, imin: 3, cmin: 1200, pulseDurationUs: 0.1, carrierMHz: 100, modulation1: "8PSK", modulation2: "QAM64", targetErrorProb: "10^-6" },
  { variant: 2, bandwidthMin: 400, bandwidthMax: 150, powerMw: 20, noisePe1: 0.015, noisePe2: 0.06, imin: 2, cmin: 1000, pulseDurationUs: 0.05, carrierMHz: 200, modulation1: "BPSK", modulation2: "QAM32", targetErrorProb: "10^-5" },
  { variant: 3, bandwidthMin: 200, bandwidthMax: 200, powerMw: 30, noisePe1: 0.012, noisePe2: 0.08, imin: 3, cmin: 1600, pulseDurationUs: 0.1, carrierMHz: 150, modulation1: "16PSK", modulation2: "QAM16", targetErrorProb: "10^-6" },
  { variant: 4, bandwidthMin: 250, bandwidthMax: 150, powerMw: 20, noisePe1: 0.01, noisePe2: 0.05, imin: 2, cmin: 1300, pulseDurationUs: 0.08, carrierMHz: 125, modulation1: "8PSK", modulation2: "QAM64", targetErrorProb: "10^-5" },
  { variant: 5, bandwidthMin: 300, bandwidthMax: 200, powerMw: 25, noisePe1: 0.015, noisePe2: 0.075, imin: 3, cmin: 1200, pulseDurationUs: 0.2, carrierMHz: 100, modulation1: "16PSK", modulation2: "QAM32", targetErrorProb: "10^-6" },
  { variant: 6, bandwidthMin: 400, bandwidthMax: 150, powerMw: 30, noisePe1: 0.01, noisePe2: 0.05, imin: 2, cmin: 1000, pulseDurationUs: 0.05, carrierMHz: 200, modulation1: "8PSK", modulation2: "QAM64", targetErrorProb: "10^-5" },
  { variant: 7, bandwidthMin: 200, bandwidthMax: 200, powerMw: 30, noisePe1: 0.02, noisePe2: 0.1, imin: 3, cmin: 1600, pulseDurationUs: 0.1, carrierMHz: 150, modulation1: "8PSK", modulation2: "QAM64", targetErrorProb: "10^-6" },
  { variant: 8, bandwidthMin: 250, bandwidthMax: 150, powerMw: 20, noisePe1: 0.01, noisePe2: 0.05, imin: 2, cmin: 1300, pulseDurationUs: 0.08, carrierMHz: 125, modulation1: "BPSK", modulation2: "QAM32", targetErrorProb: "10^-5" },
  { variant: 9, bandwidthMin: 300, bandwidthMax: 200, powerMw: 25, noisePe1: 0.015, noisePe2: 0.075, imin: 3, cmin: 1200, pulseDurationUs: 0.2, carrierMHz: 100, modulation1: "16PSK", modulation2: "QAM16", targetErrorProb: "10^-6" },
  { variant: 10, bandwidthMin: 400, bandwidthMax: 150, powerMw: 30, noisePe1: 0.01, noisePe2: 0.05, imin: 2, cmin: 1000, pulseDurationUs: 0.1, carrierMHz: 100, modulation1: "8PSK", modulation2: "QAM64", targetErrorProb: "10^-5" },
  { variant: 11, bandwidthMin: 200, bandwidthMax: 200, powerMw: 25, noisePe1: 0.01, noisePe2: 0.04, imin: 3, cmin: 1600, pulseDurationUs: 0.05, carrierMHz: 200, modulation1: "16PSK", modulation2: "QAM32", targetErrorProb: "10^-6" },
  { variant: 12, bandwidthMin: 250, bandwidthMax: 150, powerMw: 20, noisePe1: 0.015, noisePe2: 0.06, imin: 2, cmin: 1300, pulseDurationUs: 0.1, carrierMHz: 150, modulation1: "8PSK", modulation2: "QAM64", targetErrorProb: "10^-5" },
];

export interface Lab7Variant {
  variant: number;
  wiredCodes: string;
  dataBits: string;
  ethernetStandard: string;
  hops: number;
  wifiStandard: string;
}

export const LAB7_VARIANTS: Lab7Variant[] = [
  { variant: 1, wiredCodes: "NRZ, MLT3", dataBits: "1000011000001000", ethernetStandard: "100Base-T", hops: 3, wifiStandard: "802.11b" },
  { variant: 2, wiredCodes: "B2Q1, NRZI", dataBits: "0100001000000110", ethernetStandard: "1000Base-TX", hops: 2, wifiStandard: "802.11g" },
  { variant: 3, wiredCodes: "Манчестер, MLT3", dataBits: "0100000110000111", ethernetStandard: "10GBase-T", hops: 1, wifiStandard: "802.11ac" },
  { variant: 4, wiredCodes: "NRZI, PAM5", dataBits: "1000010000000101", ethernetStandard: "100Base-TX", hops: 4, wifiStandard: "802.11a" },
  { variant: 5, wiredCodes: "NRZ, Манчестер", dataBits: "0000101000000110", ethernetStandard: "1000Base-T", hops: 2, wifiStandard: "802.11n" },
  { variant: 6, wiredCodes: "RZ, MLT3", dataBits: "1000010000001100", ethernetStandard: "100Base-T", hops: 5, wifiStandard: "802.11ax" },
  { variant: 7, wiredCodes: "B2Q1, NRZI", dataBits: "1100011000001001", ethernetStandard: "1000Base-TX", hops: 3, wifiStandard: "802.11b" },
  { variant: 8, wiredCodes: "Манчестер, MLT3", dataBits: "0100001000000110", ethernetStandard: "10GBase-T", hops: 1, wifiStandard: "802.11g" },
  { variant: 9, wiredCodes: "NRZ, MLT3", dataBits: "0100000110000111", ethernetStandard: "100Base-TX", hops: 4, wifiStandard: "802.11ac" },
  { variant: 10, wiredCodes: "B2Q1, NRZI", dataBits: "1000010000000101", ethernetStandard: "1000Base-T", hops: 2, wifiStandard: "802.11n" },
  { variant: 11, wiredCodes: "NRZ, Манчестер", dataBits: "0000101000000110", ethernetStandard: "100Base-TX", hops: 3, wifiStandard: "802.11a" },
  { variant: 12, wiredCodes: "RZ, MLT3", dataBits: "1000010000001100", ethernetStandard: "10GBase-T", hops: 1, wifiStandard: "802.11g" },
];
