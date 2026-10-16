/**
 * Чтение .xlsx в браузере без сторонних библиотек: файл — zip-архив с XML.
 * Разбираем центральный каталог zip, распаковываем нужные части через
 * DecompressionStream("deflate-raw") и читаем значения ячеек (числа, общие и
 * встроенные строки). Форматирование, формулы и объединения не нужны.
 */

export type CellValue = string | number;
export type Sheet = Map<string, CellValue>;

interface Entry {
  name: string;
  method: number;
  size: number;
  offset: number;
}

function entries(buf: Uint8Array): Entry[] {
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) {
    if (dv.getUint32(i, true) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error("Це не файл Excel (.xlsx): не знайдено каталог zip-архіву.");
  const count = dv.getUint16(eocd + 10, true);
  let p = dv.getUint32(eocd + 16, true);
  const out: Entry[] = [];
  const dec = new TextDecoder();
  for (let k = 0; k < count; k++) {
    if (dv.getUint32(p, true) !== 0x02014b50) break;
    const method = dv.getUint16(p + 10, true);
    const size = dv.getUint32(p + 20, true);
    const nameLen = dv.getUint16(p + 28, true);
    const extraLen = dv.getUint16(p + 30, true);
    const commentLen = dv.getUint16(p + 32, true);
    const offset = dv.getUint32(p + 42, true);
    out.push({ name: dec.decode(buf.subarray(p + 46, p + 46 + nameLen)), method, size, offset });
    p += 46 + nameLen + extraLen + commentLen;
  }
  return out;
}

async function inflate(data: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([data as BlobPart]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function read(buf: Uint8Array, e: Entry): Promise<string> {
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const nameLen = dv.getUint16(e.offset + 26, true);
  const extraLen = dv.getUint16(e.offset + 28, true);
  const start = e.offset + 30 + nameLen + extraLen;
  const raw = buf.subarray(start, start + e.size);
  const data = e.method === 8 ? await inflate(raw) : raw;
  return new TextDecoder().decode(data);
}

const xml = (s: string) => new DOMParser().parseFromString(s, "application/xml");

/** Текст элемента <si> или <is>: простой <t> или набор фрагментов <r><t>. */
function richText(el: Element): string {
  return Array.from(el.getElementsByTagName("t"))
    .map((t) => t.textContent ?? "")
    .join("");
}

/** Все листы книги: имя листа → (адрес ячейки «B3» → значение). */
export async function readXlsx(file: ArrayBuffer): Promise<Record<string, Sheet>> {
  const buf = new Uint8Array(file);
  const list = entries(buf);
  const get = async (name: string) => {
    const e = list.find((x) => x.name === name);
    return e ? read(buf, e) : null;
  };
  const wb = await get("xl/workbook.xml");
  const rels = await get("xl/_rels/workbook.xml.rels");
  if (!wb || !rels) throw new Error("У файлі немає книги Excel (xl/workbook.xml).");
  const shared: string[] = [];
  const ss = await get("xl/sharedStrings.xml");
  if (ss) for (const si of Array.from(xml(ss).getElementsByTagName("si"))) shared.push(richText(si));

  const target = new Map<string, string>();
  for (const r of Array.from(xml(rels).getElementsByTagName("Relationship"))) {
    const t = r.getAttribute("Target") ?? "";
    target.set(r.getAttribute("Id") ?? "", t.startsWith("/") ? t.slice(1) : `xl/${t}`);
  }
  const out: Record<string, Sheet> = {};
  for (const s of Array.from(xml(wb).getElementsByTagName("sheet"))) {
    const name = s.getAttribute("name") ?? "";
    const rid = s.getAttribute("r:id") ?? s.getAttributeNS("http://schemas.openxmlformats.org/officeDocument/2006/relationships", "id") ?? "";
    const path = target.get(rid);
    const text = path ? await get(path) : null;
    if (!text) continue;
    const sheet: Sheet = new Map();
    for (const c of Array.from(xml(text).getElementsByTagName("c"))) {
      const ref = c.getAttribute("r");
      if (!ref) continue;
      const t = c.getAttribute("t");
      const v = c.getElementsByTagName("v")[0]?.textContent;
      if (t === "s" && v != null) sheet.set(ref, shared[Number(v)] ?? "");
      else if (t === "inlineStr") sheet.set(ref, richText(c.getElementsByTagName("is")[0] ?? c));
      else if (t === "str" || t === "e") {
        if (v != null) sheet.set(ref, v);
      } else if (v != null && v !== "") sheet.set(ref, Number(v));
    }
    out[name] = sheet;
  }
  return out;
}

/** «C5» из номера столбца (1 = A) и строки. */
export function addr(col: number, row: number): string {
  let s = "";
  for (let c = col; c > 0; c = Math.floor((c - 1) / 26)) s = String.fromCharCode(65 + ((c - 1) % 26)) + s;
  return `${s}${row}`;
}
