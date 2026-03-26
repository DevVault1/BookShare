const wrapText = (text, maxWidth = 92) => {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  if (words.length === 0) return [''];
  const lines = [];
  let current = words[0];

  for (let index = 1; index < words.length; index += 1) {
    const candidate = `${current} ${words[index]}`;
    if (candidate.length <= maxWidth) {
      current = candidate;
    } else {
      lines.push(current);
      current = words[index];
    }
  }

  lines.push(current);
  return lines;
};

const escapePdfText = (value) => String(value || '')
  .replace(/[^\x20-\x7E]/g, '?')
  .replace(/\\/g, '\\\\')
  .replace(/\(/g, '\\(')
  .replace(/\)/g, '\\)');

function createSimplePdf(title, sections = []) {
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const marginLeft = 52;
  const marginTop = 56;
  const lineHeight = 16;
  const titleFontSize = 20;
  const bodyFontSize = 11;
  const bottomMargin = 56;

  const lines = [];
  lines.push({ text: title, size: titleFontSize });
  lines.push({ text: '', size: bodyFontSize });

  for (const section of sections) {
    if (section.heading) {
      lines.push({ text: section.heading, size: 14 });
    }
    for (const entry of section.lines || []) {
      const wrapped = wrapText(entry, 96);
      wrapped.forEach((line) => lines.push({ text: line, size: bodyFontSize }));
    }
    lines.push({ text: '', size: bodyFontSize });
  }

  const pages = [];
  let currentPage = [];
  let y = pageHeight - marginTop;

  for (const line of lines) {
    const consumedHeight = line.size === titleFontSize ? 28 : lineHeight;
    if (y - consumedHeight < bottomMargin) {
      pages.push(currentPage);
      currentPage = [];
      y = pageHeight - marginTop;
    }
    currentPage.push({ ...line, y });
    y -= consumedHeight;
  }
  if (currentPage.length > 0) pages.push(currentPage);

  const objects = {};
  let nextId = 1;
  const fontRegularId = nextId++;
  const fontBoldId = nextId++;
  const pageIds = pages.map(() => nextId++);
  const contentIds = pages.map(() => nextId++);
  const pagesId = nextId++;
  const catalogId = nextId++;

  objects[fontRegularId] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
  objects[fontBoldId] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>';

  pages.forEach((pageLines, index) => {
    const content = pageLines.map((line) => {
      const fontKey = line.size >= 14 ? 'F2' : 'F1';
      return `BT\n/${fontKey} ${line.size} Tf\n1 0 0 1 ${marginLeft} ${line.y.toFixed(2)} Tm\n(${escapePdfText(line.text)}) Tj\nET`;
    }).join('\n');

    objects[contentIds[index]] = `<< /Length ${Buffer.byteLength(content, 'utf8')} >>\nstream\n${content}\nendstream`;
    objects[pageIds[index]] = `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${fontRegularId} 0 R /F2 ${fontBoldId} 0 R >> >> /Contents ${contentIds[index]} 0 R >>`;
  });

  objects[pagesId] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`;
  objects[catalogId] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;

  let pdf = '%PDF-1.4\n';
  const offsets = [0];

  for (let id = 1; id < nextId; id += 1) {
    offsets[id] = Buffer.byteLength(pdf, 'utf8');
    pdf += `${id} 0 obj\n${objects[id]}\nendobj\n`;
  }

  const xrefOffset = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${nextId}\n`;
  pdf += '0000000000 65535 f \n';
  for (let id = 1; id < nextId; id += 1) {
    pdf += `${String(offsets[id]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${nextId} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, 'utf8');
}

module.exports = { createSimplePdf };
