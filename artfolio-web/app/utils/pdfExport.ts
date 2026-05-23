import type { PortfolioPdfProfile } from "../types/api";

function fileSafe(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = "";

  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}

export async function exportPortfolioPdf(profile: PortfolioPdfProfile) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const fontName = "ArialUnicode";
  const margin = 48;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const registerUnicodeFont = async () => {
    const response = await fetch("/fonts/Arial.ttf");
    if (!response.ok) return "helvetica";

    const fontBase64 = arrayBufferToBase64(await response.arrayBuffer());
    doc.addFileToVFS("Arial.ttf", fontBase64);
    doc.addFont("Arial.ttf", fontName, "normal");
    doc.addFont("Arial.ttf", fontName, "bold");
    return fontName;
  };

  const activeFont = await registerUnicodeFont();

  const ensureSpace = (height: number) => {
    if (y + height <= pageHeight - margin) return;
    doc.addPage();
    y = margin;
  };

  const write = (
    text: string,
    options: { size?: number; bold?: boolean; gap?: number } = {},
  ) => {
    const size = options.size ?? 11;
    const gap = options.gap ?? 8;
    doc.setFont(activeFont, options.bold ? "bold" : "normal");
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(text, contentWidth) as string[];
    ensureSpace(lines.length * (size + 4) + gap);
    doc.text(lines, margin, y);
    y += lines.length * (size + 4) + gap;
  };

  const section = (title: string) => {
    ensureSpace(30);
    y += 8;
    doc.setDrawColor(37, 99, 235);
    doc.setLineWidth(1.2);
    doc.line(margin, y, pageWidth - margin, y);
    y += 20;
    write(title, { size: 14, bold: true, gap: 8 });
  };

  write(profile.name, { size: 22, bold: true, gap: 6 });
  write(profile.title, { size: 13, gap: 6 });
  write(profile.email, { size: 11, gap: 12 });

  section("Skills");
  profile.skills.forEach((skill) => write(`- ${skill}`));

  section("Experience");
  profile.experience.forEach((item) => write(`- ${item}`));

  section("Social links");
  profile.socialLinks.forEach((link) => write(`- ${link}`));

  section("Selected works");
  profile.works.forEach((work, index) => {
    write(`${index + 1}. ${work.title} (${work.category})`, {
      bold: true,
      gap: 4,
    });
    if (work.description) write(work.description, { gap: 10 });
  });

  const fileName = `Creative_Portfolio_${fileSafe(profile.name || "profile")}.pdf`;
  doc.save(fileName);
}
