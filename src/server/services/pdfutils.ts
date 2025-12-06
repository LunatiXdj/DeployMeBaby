import { PDFDocument, PDFPage, PDFFont, rgb, StandardFonts } from "pdf-lib";
import fs from "fs";
import path from "path";

const X_MARGIN = 50;
const Y_START = 750;
const Y_FOOTER = 50;
const TABLE_ROW_HEIGHT = 17;
const LINE_HEIGHT = 11;
const DEFAULT_FONT_SIZE = 10; // Set default font size

export async function createOfferPdf({
  headers,
  rows,
  recipientAddress,
  offerInfo,
  outputFilePath,
  logoPath,
  fontPath,
  totalAmountText
}: {
  headers: string[];
  rows: string[][];
  recipientAddress: string[];
  offerInfo: string[];
  outputFilePath: string;
  logoPath: string;
  fontPath: string;
  totalAmountText: string;
}) {
  const pdfDoc = await PDFDocument.create();
  //const fontBytes = fs.readFileSync(fontPath);
  const logoBytes = fs.readFileSync(logoPath);
  //const font = await pdfDoc.embedFont(fontBytes);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const logoImage = await pdfDoc.embedPng(logoBytes);
  let page = pdfDoc.addPage();
  const { width, height } = page.getSize();


  // Header: Logo left, company info right, both vertically centered
  const logoDims = logoImage.scale(0.05);
  const headerTop = height - 60;
  // Lower the logo even further (increase offset more)
  const logoY = headerTop - logoDims.height / 2 - 70;
  page.drawImage(logoImage, {
    x: X_MARGIN,
    y: logoY,
    width: logoDims.width,
    height: logoDims.height,
  });
  let infoY = headerTop + 20;
  offerInfo.forEach((line) => {
    page.drawText(line, {
      x: width - 260,
      y: infoY,
      size: DEFAULT_FONT_SIZE,
      font,
    });
    infoY -= 12;
  });

  // Recipient address block
  let addrY = headerTop - 60;
  recipientAddress.forEach((line) => {
    page.drawText(line, {
      x: X_MARGIN,
      y: addrY,
      size: DEFAULT_FONT_SIZE,
      font,
    });
    addrY -= 14;
  });

  // Offer meta info (Nr, Datum, Projekt) right-aligned, aligned with address
  let metaY = headerTop - 60;
  [
    `Angebots-Nr.: ${rows[0][0]}`,
    `Datum: ${rows[0][1]}`,
    `Projekt: ${rows[0][2]}`
  ].forEach((line) => {
    page.drawText(line, {
      x: width - 260,
      y: metaY,
      size: DEFAULT_FONT_SIZE,
      font,
    });
    metaY -= 14;
  });

  // Offer title with more space before table
  const angebotY = addrY - 20;
  page.drawText("ANGEBOT / KOSTENVORANSCHLAG", {
    x: X_MARGIN,
    y: angebotY,
    size: 16,
    font,
  });

  // Table
  let tableY = angebotY - 30;
  tableY = await drawTable(tableY, headers, rows, pdfDoc, { page }, font, width, height);

  // Draw total below table
  let totalY = tableY - 20; // Add some space
  const totalLineHeight = 17;
  const totalFontSize = 9

  // Helper to format currency, assuming 'de-DE' locale for comma decimal separator
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('de-DE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value) + ' €';
  };

  // Parse net amount from input string (e.g., "1.234,56 €")
  const netAmountValue = parseFloat(totalAmountText.replace(/\./g, '').replace(',', '.').replace(/[^0-9.]/g, ''));

  const vatValue = netAmountValue * 0.19;
  const grossValue = netAmountValue + vatValue;

  const netAmountFormatted = formatCurrency(netAmountValue);
  const vatFormatted = formatCurrency(vatValue);
  const grossFormatted = formatCurrency(grossValue);

  const labels = [
    "Gesamtbetrag netto",
    "zzgl. 19% MwSt.",
    "Gesamt brutto Rechnungsbetrag"
  ];
  const values = [
    netAmountFormatted,
    vatFormatted,
    grossFormatted
  ];

  const labelX = width - X_MARGIN - 220; // Adjust X position for labels
  const valueX = width - X_MARGIN;      // X position for right-aligned values

  // Check for page break before drawing the totals block
  if (totalY < Y_FOOTER + (labels.length * totalLineHeight)) {
    page = pdfDoc.addPage([width, height]);
    totalY = Y_START;
  }

  // Draw the total lines
  for (let i = 0; i < labels.length; i++) {
    const label = labels[i];
    const value = values[i];
    const valueWidth = font.widthOfTextAtSize(value, totalFontSize);

    page.drawText(label, {
      x: labelX,
      y: totalY,
      size: totalFontSize,
      font,
    });

    page.drawText(value, {
      x: valueX - valueWidth, // Right-align value
      y: totalY,
      size: totalFontSize,
      font,
    });

    totalY -= totalLineHeight;
  }

  // Save
  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(outputFilePath, pdfBytes);
}

async function drawTable(
  startY: number,
  headers: string[],
  rows: string[][],
  pdfDoc: PDFDocument,
  pageRef: { page: PDFPage },
  font: PDFFont,
  width: number,
  height: number
): Promise<number> {
  let y = startY;
  const colWidths = [40, 210, 60, 60, 80, 80];
  const minY = Y_FOOTER + 60;

  const drawHeaderRow = () => {
    let x = X_MARGIN;
    headers.forEach((header, i) => {
      pageRef.page.drawText(header, {
        x,
        y,
        font,
        size: DEFAULT_FONT_SIZE,
      });
      x += colWidths[i] + 10;
    });
    y -= TABLE_ROW_HEIGHT;
    pageRef.page.drawLine({
      start: { x: X_MARGIN, y: y + 8 },
      end: { x: width - X_MARGIN, y: y + 8 },
      thickness: 1.5,
    });
    y -= 5;
  };

  drawHeaderRow();

  for (const row of rows) {
    let x = X_MARGIN;
    let rowHeight = TABLE_ROW_HEIGHT;
    const descriptionColIndex = 1;
    const cellPadding = 5;

    if (y - rowHeight < minY) {
      const newPage = pdfDoc.addPage([width, height]);
      pageRef.page = newPage;
      y = Y_START;
      drawHeaderRow();
    }

    for (let i = 0; i < row.length; i++) {
      const cellText = row[i];
      const colWidth = colWidths[i];
      if (i === descriptionColIndex) {
        const descriptionLines = wrapText(cellText, colWidth - 2 * cellPadding, font, DEFAULT_FONT_SIZE);
        let currentY = y - cellPadding;
        descriptionLines.forEach((line) => {
          pageRef.page.drawText(line, {
            x: x + cellPadding,
            y: currentY,
            size: DEFAULT_FONT_SIZE,
            font,
          });
          currentY -= LINE_HEIGHT;
        });
        const actualHeight = descriptionLines.length * LINE_HEIGHT + 2 * cellPadding;
        if (actualHeight > rowHeight) {
          rowHeight = actualHeight;
        }
      } else {
        const textWidth = font.widthOfTextAtSize(cellText, DEFAULT_FONT_SIZE);
        pageRef.page.drawText(cellText, {
          x: x + (colWidth - textWidth) / 2,
          y: y - 11,
          size: DEFAULT_FONT_SIZE,
          font,
        });
      }
      x += colWidth + 10;
    }
    y -= rowHeight;
    pageRef.page.drawLine({
      start: { x: X_MARGIN, y },
      end: { x: width - X_MARGIN, y },
      thickness: 0.5,
      color: rgb(0.9, 0.9, 0.9),
    });
  }
  return y;
}

function wrapText(text: string, maxWidth: number, font: PDFFont, fontSize: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";
  words.forEach((word) => {
    const testLine = currentLine ? currentLine + " " + word : word;
    const width = font.widthOfTextAtSize(testLine, fontSize);
    if (width < maxWidth) {
      currentLine = testLine;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  });
  if (currentLine) lines.push(currentLine);
  return lines;
}
