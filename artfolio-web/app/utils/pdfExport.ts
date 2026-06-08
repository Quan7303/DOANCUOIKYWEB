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

async function imageUrlToDataUrl(url?: string) {
  if (!url || url.includes("/next.svg")) return null;

  try {
    const response = await fetch(url, {
      mode: "cors",
      cache: "force-cache",
    });

    if (!response.ok) return null;

    const blob = await response.blob();

    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();

      reader.onloadend = () => {
        resolve(String(reader.result));
      };

      reader.onerror = () => {
        reject(new Error("Không thể đọc ảnh."));
      };

      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function getImageFormat(dataUrl: string) {
  if (dataUrl.startsWith("data:image/png")) return "PNG";
  if (dataUrl.startsWith("data:image/webp")) return "WEBP";
  return "JPEG";
}

export async function exportPortfolioPdf(profile: PortfolioPdfProfile) {
  const { jsPDF } = await import("jspdf");

  const doc = new jsPDF({ unit: "pt", format: "a4" });

  const fontName = "ArialUnicode";
  const margin = 42;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - margin * 2;

  let y = margin;

  const registerUnicodeFont = async () => {
    try {
      const response = await fetch("/fonts/Arial.ttf");

      if (!response.ok) return "helvetica";

      const fontBase64 = arrayBufferToBase64(await response.arrayBuffer());

      doc.addFileToVFS("Arial.ttf", fontBase64);
      doc.addFont("Arial.ttf", fontName, "normal");
      doc.addFont("Arial.ttf", fontName, "bold");

      return fontName;
    } catch {
      return "helvetica";
    }
  };

  const activeFont = await registerUnicodeFont();

  function ensureSpace(height: number) {
    if (y + height <= pageHeight - margin) return;

    doc.addPage();
    y = margin;
  }

  function setText(
    size = 11,
    color: [number, number, number] = [15, 23, 42],
    bold = false,
  ) {
    doc.setFont(activeFont, bold ? "bold" : "normal");
    doc.setFontSize(size);
    doc.setTextColor(color[0], color[1], color[2]);
  }

  function writeText(
    text: string,
    x: number,
    currentY: number,
    options: {
      size?: number;
      bold?: boolean;
      color?: [number, number, number];
      maxWidth?: number;
      lineHeight?: number;
    } = {},
  ) {
    const size = options.size ?? 11;
    const lineHeight = options.lineHeight ?? size + 4;

    setText(size, options.color, options.bold);

    const lines = doc.splitTextToSize(
      text || "",
      options.maxWidth ?? contentWidth,
    ) as string[];

    doc.text(lines, x, currentY);

    return lines.length * lineHeight;
  }

  function drawHeader() {
    doc.setFillColor(79, 70, 229);
    doc.rect(0, 0, pageWidth, 128, "F");

    doc.setFillColor(99, 102, 241);
    doc.circle(pageWidth - 64, 30, 78, "F");

    setText(24, [255, 255, 255], true);
    doc.text(profile.name || "Creative Portfolio", margin, 54);

    setText(12, [224, 231, 255]);
    doc.text(profile.title || "Artfolio Creator", margin, 76);

    setText(10, [238, 242, 255]);
    doc.text(profile.email || "", margin, 96);

    y = 158;
  }

  function drawStats() {
    const cardGap = 12;
    const cardWidth = (contentWidth - cardGap * 2) / 3;
    const cardHeight = 62;

    const stats = [
      {
        label: "Tác phẩm",
        value: String(profile.works.length),
      },
      {
        label: "Lượt thích",
        value: String(profile.totalLikes ?? 0),
      },
      {
        label: "Lượt xem",
        value: String(profile.totalViews ?? 0),
      },
    ];

    ensureSpace(cardHeight + 24);

    stats.forEach((item, index) => {
      const x = margin + index * (cardWidth + cardGap);

      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(x, y, cardWidth, cardHeight, 10, 10, "FD");

      setText(18, [15, 23, 42], true);
      doc.text(item.value, x + 16, y + 28);

      setText(9, [100, 116, 139], true);
      doc.text(item.label.toUpperCase(), x + 16, y + 46);
    });

    y += cardHeight + 28;
  }

  function sectionTitle(title: string) {
    ensureSpace(34);

    setText(14, [15, 23, 42], true);
    doc.text(title, margin, y);

    doc.setDrawColor(79, 70, 229);
    doc.setLineWidth(1.2);
    doc.line(margin, y + 10, margin + 90, y + 10);

    y += 30;
  }

  function writeList(items: string[]) {
    if (items.length === 0) {
      setText(10, [100, 116, 139]);
      doc.text("Chưa cập nhật.", margin, y);
      y += 20;
      return;
    }

    items.forEach((item) => {
      ensureSpace(20);
      setText(10, [51, 65, 85]);
      const height = writeText(`• ${item}`, margin, y, {
        size: 10,
        color: [51, 65, 85],
        maxWidth: contentWidth,
      });
      y += height + 4;
    });

    y += 8;
  }

  async function drawWorkCard(
    work: PortfolioPdfProfile["works"][number],
    index: number,
  ) {
    const cardHeight = 132;

    ensureSpace(cardHeight + 18);

    const cardX = margin;
    const cardY = y;
    const imageWidth = 120;
    const imageHeight = 88;
    const imageX = cardX + 14;
    const imageY = cardY + 22;
    const textX = imageX + imageWidth + 18;
    const textWidth = contentWidth - imageWidth - 46;

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(cardX, cardY, contentWidth, cardHeight, 12, 12, "FD");

    const imageDataUrl = await imageUrlToDataUrl(work.image);

    if (imageDataUrl) {
      try {
        doc.addImage(
          imageDataUrl,
          getImageFormat(imageDataUrl),
          imageX,
          imageY,
          imageWidth,
          imageHeight,
          undefined,
          "FAST",
        );
      } catch {
        doc.setFillColor(241, 245, 249);
        doc.roundedRect(imageX, imageY, imageWidth, imageHeight, 8, 8, "F");
        setText(9, [100, 116, 139], true);
        doc.text("Không tải được ảnh", imageX + 18, imageY + 48);
      }
    } else {
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(imageX, imageY, imageWidth, imageHeight, 8, 8, "F");
      setText(9, [100, 116, 139], true);
      doc.text("Chưa có ảnh", imageX + 34, imageY + 48);
    }

    setText(9, [79, 70, 229], true);
    doc.text(`${index + 1}. ${work.category}`, textX, cardY + 26);

    const titleHeight = writeText(work.title, textX, cardY + 48, {
      size: 13,
      bold: true,
      color: [15, 23, 42],
      maxWidth: textWidth,
      lineHeight: 16,
    });

    const description = work.description || "Tác phẩm chưa có mô tả.";
    writeText(description, textX, cardY + 52 + titleHeight, {
      size: 9,
      color: [71, 85, 105],
      maxWidth: textWidth,
      lineHeight: 12,
    });

    setText(9, [100, 116, 139], true);
    doc.text(
      `♥ ${work.likesCount ?? 0} lượt thích    👁 ${work.views ?? 0} lượt xem`,
      textX,
      cardY + cardHeight - 18,
    );

    y += cardHeight + 14;
  }

  drawHeader();
  drawStats();

  sectionTitle("Thông tin hồ sơ");

  if (profile.skills.length > 0) {
    setText(11, [15, 23, 42], true);
    doc.text("Kỹ năng", margin, y);
    y += 18;
    writeList(profile.skills);
  }

  if (profile.experience.length > 0) {
    setText(11, [15, 23, 42], true);
    doc.text("Kinh nghiệm", margin, y);
    y += 18;
    writeList(profile.experience);
  }

  if (profile.socialLinks.length > 0) {
    setText(11, [15, 23, 42], true);
    doc.text("Liên kết cá nhân", margin, y);
    y += 18;
    writeList(profile.socialLinks);
  }

  sectionTitle("Tác phẩm nổi bật");

  if (profile.works.length === 0) {
    setText(10, [100, 116, 139]);
    doc.text("Chưa có tác phẩm nào trong hồ sơ.", margin, y);
  } else {
    for (const [index, work] of profile.works.entries()) {
      await drawWorkCard(work, index);
    }
  }

  const pageCount = doc.getNumberOfPages();

  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    setText(9, [148, 163, 184]);
    doc.text(
      `Artfolio Portfolio · Trang ${page}/${pageCount}`,
      margin,
      pageHeight - 22,
    );
  }

  const fileName = `Creative_Portfolio_${fileSafe(
    profile.name || "profile",
  )}.pdf`;

  doc.save(fileName);
}