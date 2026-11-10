/**
 * Generador de PDF sencillo y sin dependencias: texto con las fuentes estándar Helvetica,
 * saltos de línea automáticos, varias páginas y numeración. Suficiente para menús, listas y recetas.
 */
export interface PdfBlock {
  text?: string;
  size?: number;
  bold?: boolean;
  color?: [number, number, number]; // 0-1
  indent?: number;
  gapBefore?: number;
  /** Línea horizontal en vez de texto */
  rule?: boolean;
}

const W = 595.28;
const H = 841.89;
const MARGIN = 50;
const FOOT = 30;

// Unicode -> WinAnsi (cp1252) para lo que está fuera de Latin-1
const WIN: Record<number, number> = {
  0x20ac: 0x80, 0x201a: 0x82, 0x2026: 0x85, 0x2018: 0x91, 0x2019: 0x92,
  0x201c: 0x93, 0x201d: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97,
};

/** Bytes WinAnsi de un texto; lo que no existe en la fuente (emojis...) se omite. */
function toBytes(text: string): number[] {
  const out: number[] = [];
  for (const ch of Array.from(text)) {
    const c = ch.codePointAt(0) ?? 0;
    if ((c >= 0x20 && c < 0x7f) || (c >= 0xa0 && c <= 0xff)) out.push(c);
    else if (WIN[c]) out.push(WIN[c]);
    else if (c === 0x09) out.push(0x20);
  }
  return out;
}

/** push(...arr) revienta con arrays muy grandes; este bucle no. */
function addAll(target: number[], source: number[]): void {
  for (let i = 0; i < source.length; i++) target.push(source[i]);
}

const ascii = (s: string): number[] => Array.from(s, (c) => c.charCodeAt(0) & 0x7f);

function literal(bytes: number[]): number[] {
  const out = ascii("(");
  for (const b of bytes) {
    if (b === 0x28 || b === 0x29 || b === 0x5c) out.push(0x5c);
    out.push(b);
  }
  out.push(0x29);
  return out;
}

/** Ancho aproximado en puntos de Helvetica (no hay métricas reales sin librería). */
function width(text: string, size: number, bold: boolean): number {
  let w = 0;
  for (const ch of Array.from(text)) {
    if ("ijltf.,;:'|!()[] ".includes(ch)) w += 0.28;
    else if ("mwMW".includes(ch)) w += 0.82;
    else if (ch >= "A" && ch <= "Z") w += 0.67;
    else if (ch >= "0" && ch <= "9") w += 0.556;
    else w += 0.52;
  }
  return w * size * (bold ? 1.06 : 1);
}

function wrap(text: string, size: number, bold: boolean, max: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const next = line ? `${line} ${word}` : word;
    if (line && width(next, size, bold) > max) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

interface Op { x: number; y: number; text: string; size: number; bold: boolean; color: [number, number, number] }
interface Line { x1: number; x2: number; y: number }

export function buildPdf(blocks: PdfBlock[]): Uint8Array {
  const pages: { ops: Op[]; lines: Line[] }[] = [{ ops: [], lines: [] }];
  let y = H - MARGIN;
  const page = () => pages[pages.length - 1];

  for (const b of blocks) {
    y -= b.gapBefore ?? 0;
    if (b.rule) {
      y -= 6;
      page().lines.push({ x1: MARGIN, x2: W - MARGIN, y });
      y -= 6;
      continue;
    }
    const size = b.size ?? 11;
    const bold = b.bold ?? false;
    const indent = b.indent ?? 0;
    const lead = size * 1.4;
    for (const text of wrap(b.text ?? "", size, bold, W - 2 * MARGIN - indent)) {
      if (y - lead < MARGIN + FOOT) {
        pages.push({ ops: [], lines: [] });
        y = H - MARGIN;
      }
      y -= lead;
      page().ops.push({ x: MARGIN + indent, y, text, size, bold, color: b.color ?? [0.23, 0.16, 0.11] });
    }
  }

  // Numeración al pie
  pages.forEach((p, i) => {
    const label = `MealToUs · Página ${i + 1} de ${pages.length}`;
    p.ops.push({ x: W / 2 - width(label, 8, false) / 2, y: MARGIN - 8, text: label, size: 8, bold: false, color: [0.5, 0.45, 0.4] });
  });

  const num = (n: number) => n.toFixed(2);
  const objs: number[][] = [];
  const kids = pages.map((_, i) => `${5 + 2 * i} 0 R`).join(" ");
  objs.push(ascii("<< /Type /Catalog /Pages 2 0 R >>"));
  objs.push(ascii(`<< /Type /Pages /Kids [${kids}] /Count ${pages.length} >>`));
  objs.push(ascii("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>"));
  objs.push(ascii("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>"));

  pages.forEach((p, i) => {
    const stream: number[] = [];
    for (const l of p.lines) {
      addAll(stream, ascii(`0.86 0.75 0.54 RG 0.8 w ${num(l.x1)} ${num(l.y)} m ${num(l.x2)} ${num(l.y)} l S\n`));
    }
    for (const o of p.ops) {
      const [r, g, bl] = o.color;
      addAll(stream, ascii(`BT /${o.bold ? "F2" : "F1"} ${num(o.size)} Tf ${num(r)} ${num(g)} ${num(bl)} rg ${num(o.x)} ${num(o.y)} Td `));
      addAll(stream, literal(toBytes(o.text)));
      addAll(stream, ascii(" Tj ET\n"));
    }
    objs.push(ascii(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] ` +
      `/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${6 + 2 * i} 0 R >>`,
    ));
    const body = ascii(`<< /Length ${stream.length} >>\nstream\n`);
    addAll(body, stream);
    addAll(body, ascii("\nendstream"));
    objs.push(body);
  });

  const out: number[] = ascii("%PDF-1.4\n");
  const offsets: number[] = [];
  objs.forEach((body, i) => {
    offsets.push(out.length);
    addAll(out, ascii(`${i + 1} 0 obj\n`));
    addAll(out, body);
    addAll(out, ascii("\nendobj\n"));
  });
  const xref = out.length;
  addAll(out, ascii(`xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`));
  for (const off of offsets) addAll(out, ascii(`${String(off).padStart(10, "0")} 00000 n \n`));
  addAll(out, ascii(`trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`));
  return Uint8Array.from(out);
}

export function downloadPdf(filename: string, blocks: PdfBlock[]): void {
  const blob = new Blob([buildPdf(blocks) as BlobPart], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
