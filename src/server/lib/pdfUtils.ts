
import { PDFDocument, PDFFont, PDFPage, rgb, StandardFonts, PageSizes, PDFImage } from 'pdf-lib';
import { promises as fs } from 'fs';
import * as fontkit from 'fontkit';
import { getCompanySettings } from '@/server/services/settingsService';
import type { CompanySettings, Customer, Project } from '@/shared/types';

const X_MARGIN = 50;
const Y_START = 780;
const Y_FOOTER = 50;
const FONT_SIZE_NORMAL = 10;
const FONT_SIZE_SMALL = 9;
const TABLE_ROW_HEIGHT = 18;
const LINE_HEIGHT = 12;

export function wrapText(text: string, maxWidth: number, font: PDFFont, fontSize: number): string[] {
    if (!text) return [''];
    const allLines: string[] = [];
    const textLines = text.replace(/\t/g, '    ').split('\n');

    for (const textLine of textLines) {
        const words = textLine.split(' ');
        let currentLine = '';
        for (const word of words) {
            const wordWidth = font.widthOfTextAtSize(word, fontSize);
            if (wordWidth > maxWidth) {
                if (currentLine !== '') {
                    allLines.push(currentLine);
                    currentLine = '';
                }
                let wordPart = word;
                while (font.widthOfTextAtSize(wordPart, fontSize) > maxWidth) {
                    let cutIndex = Math.floor((wordPart.length * maxWidth) / font.widthOfTextAtSize(wordPart, fontSize)) - 1;
                    if (cutIndex <= 0) cutIndex = 1; 
                    
                    let splitPoint = wordPart.substring(0, cutIndex).lastIndexOf('-');
                    if (splitPoint === -1) {
                       splitPoint = cutIndex;
                    } else {
                       splitPoint += 1; 
                    }

                    allLines.push(wordPart.substring(0, splitPoint));
                    wordPart = wordPart.substring(splitPoint);
                }
                currentLine = wordPart;
                continue; 
            }

            const testLine = currentLine === '' ? word : `${currentLine} ${word}`;
            if (font.widthOfTextAtSize(testLine, fontSize) > maxWidth) {
                allLines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }
        allLines.push(currentLine);
    }
    return allLines;
}

export async function drawFooter(pdfDoc: PDFDocument, settings: CompanySettings, logoImage: PDFImage | null = null) {
    const pages = pdfDoc.getPages();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const white = rgb(1, 1, 1);
    const black = rgb(0, 0, 0);
    const footerHeight = 60; 

    for (const page of pages) {
        const { width } = page.getSize();
        page.drawRectangle({
            x: 0, y: 0, width, height: footerHeight, color: black,
        });

        const footerY = footerHeight / 2 + 10;
        const FONT_SIZE_FOOTER = 8;
        const colWidth = width / 3;

        let currentXLeft = X_MARGIN - 20;
        if (logoImage) {
            const maxLogoHeight = footerHeight - 20;
            const scaleFactor = maxLogoHeight / logoImage.height;
            const logoDims = logoImage.scale(scaleFactor);
            
            page.drawImage(logoImage, {
                x: currentXLeft, 
                y: (footerHeight / 2) - (logoDims.height / 2),
                width: logoDims.width, 
                height: logoDims.height,
            });
            currentXLeft += logoDims.width + 15;
        }

        drawTextOnPage(page, `${settings.companyName} | Inh. ${settings.ownerName}`, { font, color: white, size: FONT_SIZE_FOOTER, x: currentXLeft, y: footerY });
        drawTextOnPage(page, settings.address, { font, color: white, size: FONT_SIZE_FOOTER, x: currentXLeft, y: footerY - 12 });
        drawTextOnPage(page, `${settings.zip} ${settings.city}`, { font, color: white, size: FONT_SIZE_FOOTER, x: currentXLeft, y: footerY - 24 });
        
        drawTextOnPage(page, `Tel: ${settings.phone}`, { font, color: white, size: FONT_SIZE_FOOTER, x: colWidth + X_MARGIN, y: footerY });
        drawTextOnPage(page, `E-Mail: ${settings.email}`, { font, color: white, size: FONT_SIZE_FOOTER, x: colWidth + X_MARGIN, y: footerY - 12 });
        drawTextOnPage(page, `Steuernr.: ${settings.taxNumber || 'N/A'}`, { font, color: white, size: FONT_SIZE_FOOTER, x: colWidth + X_MARGIN, y: footerY - 24 });

        drawTextOnPage(page, `Bank: ${settings.bankName}`, { font, color: white, size: FONT_SIZE_FOOTER, x: (colWidth * 2), y: footerY });
        drawTextOnPage(page, `IBAN: ${settings.iban}`, { font, color: white, size: FONT_SIZE_FOOTER, x: (colWidth * 2), y: footerY - 12 });
        drawTextOnPage(page, `USt-ID: ${settings.vatId || 'N/A'}`, { font, color: white, size: FONT_SIZE_FOOTER, x: (colWidth * 2), y: footerY - 24 });
    }
}

function drawTextOnPage(page: PDFPage, text: string, options: any) {
    page.drawText(text, options);
}

export async function generatePdfBase(pdfDoc: PDFDocument, initialPage: PDFPage) {
    const { width, height } = initialPage.getSize();
    
    pdfDoc.registerFontkit(fontkit as any);
    let fontRegular: PDFFont;
    let fontBold: PDFFont;
    
    try {
        const fontResponse = await fetch('https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;700&display=swap');
        const fontRegularResponse = await fetch('https://github.com/google/fonts/raw/main/ofl/googlesans/GoogleSans-Regular.ttf');
        const fontBoldResponse = await fetch('https://github.com/google/fonts/raw/main/ofl/googlesans/GoogleSans-Bold.ttf');
        
        const fontRegularBytes = await fontRegularResponse.arrayBuffer();
        const fontBoldBytes = await fontBoldResponse.arrayBuffer();
        
        fontRegular = await pdfDoc.embedFont(new Uint8Array(fontRegularBytes));
        fontBold = await pdfDoc.embedFont(new Uint8Array(fontBoldBytes));
    } catch (e) {
        console.warn('Failed to load Google Sans from Google Fonts, falling back to Helvetica:', e);
        fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
        fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    }

    let logoImage: PDFImage | null = null;
    try {
        const logoBytes = await fs.readFile("public/logo.png");
        logoImage = await pdfDoc.embedPng(logoBytes);
    } catch(e) {
        console.warn("Logo image not found");
    }
    
    const settings = await getCompanySettings();

    const drawHeader = (page: PDFPage, title: string) => {
        if (logoImage) {
            const logoDims = logoImage.scale(0.10);
            page.drawImage(logoImage, {
                x: 50, y: height - 99, width: logoDims.width, height: logoDims.height,
            });
        }

        if (settings) {
            const companyInfo = [
                `${settings.companyName} | Inh. ${settings.ownerName}`,
                settings.address,
                `Tel: ${settings.phone}`,
                `E-Mail: ${settings.email}`,
            ];
            let infoY = height - 55;
            companyInfo.forEach((line) => {
                page.drawText(line, { x: width - X_MARGIN - 200, y: infoY, size: FONT_SIZE_SMALL, font: fontRegular });
                infoY -= 11;
            });
        }

        page.drawLine({
            start: { x: X_MARGIN, y: height - 110 }, end: { x: width - X_MARGIN, y: height - 110 }, thickness: 1,
        });

        page.drawText(title, { x: X_MARGIN, y: height - 135, size: 16, font: fontBold });
    };

    const drawAddressBlock = (page: PDFPage, customer: Customer, project: Project | undefined, startY: number) => {
        let y = startY;
        const x = X_MARGIN;
    
        const customerNameLines = wrapText(customer.name, 200, fontBold, 12);
        customerNameLines.forEach(line => {
            page.drawText(line, { x, y, size: 12, font: fontBold });
            y -= LINE_HEIGHT;
        });
        
        const customerSubLines = wrapText(customer.address, 200, fontRegular, 12);
        customerSubLines.forEach(line => {
             page.drawText(line, { x, y, size: 12, font: fontRegular });
            y -= LINE_HEIGHT;
        });

        if (project?.projectName) {
            y -= LINE_HEIGHT * 0.5;
            page.drawText(`Projekt: ${project.projectName}`, { x, y, size: 12, font: fontRegular });
            y -= LINE_HEIGHT;
        }
        return y;
    };

    const drawTable = (pdfDoc: PDFDocument, initialPage: PDFPage, startY: number, headers: string[], rows: string[][], colWidths: number[], options: { wrappableColumnIndex?: number, rightAlignColumns?: number[] } = {}): { finalPage: PDFPage, yAfterTable: number } => {
        const { wrappableColumnIndex = 0, rightAlignColumns = [] } = options;
        let y = startY;
        let currentPage = initialPage;
        const minY = Y_FOOTER + 70;

        const drawHeaderRow = (page: PDFPage) => {
            let x = X_MARGIN;
            headers.forEach((header, i) => {
                const isRightAlign = rightAlignColumns.includes(i);
                const headerX = isRightAlign ? x + colWidths[i] - fontBold.widthOfTextAtSize(header, FONT_SIZE_NORMAL) - 5 : x + 2;
                page.drawText(header, { x: headerX, y, font: fontBold, size: FONT_SIZE_NORMAL });
                x += colWidths[i];
            });
            y -= TABLE_ROW_HEIGHT;
            page.drawLine({ start: { x: X_MARGIN, y: y + 8 }, end: { x: width - X_MARGIN, y: y + 8 }, thickness: 1.5 });
            y -= 5;
        };
        drawHeaderRow(currentPage);

        for (const row of rows) {
            if (!row) continue;

            const descriptionText = row[wrappableColumnIndex] || '';
            const [name, ...descLines] = descriptionText.split('\n');
            const wrappableColumnWidth = colWidths[wrappableColumnIndex] - 10;
            
            const nameLines = wrapText(name, wrappableColumnWidth, fontRegular, FONT_SIZE_NORMAL);
            const fullDescriptionLines = [...nameLines, ...descLines.flatMap(d => wrapText(d, wrappableColumnWidth, fontRegular, FONT_SIZE_SMALL))];
            
            const rowHeight = Math.max(TABLE_ROW_HEIGHT, fullDescriptionLines.length * LINE_HEIGHT + 10);

            if (y - rowHeight < minY) {
                currentPage = pdfDoc.addPage(PageSizes.A4);
                y = Y_START;
                drawHeader(currentPage, "Fortsetzung");
                y -= 150;
                drawHeaderRow(currentPage);
            }
            
            let currentX = X_MARGIN;
            row.forEach((cell, i) => {
                if (i === wrappableColumnIndex) {
                    const rowTextY = y - 15;
                    let lineY = rowTextY;
                    fullDescriptionLines.forEach((line, lineIdx) => {
                        const isName = lineIdx < nameLines.length;
                        currentPage.drawText(line, { 
                            x: currentX + 5, 
                            y: lineY, 
                            size: isName ? FONT_SIZE_NORMAL : FONT_SIZE_SMALL, 
                            font: isName ? fontBold : fontRegular 
                        });
                        lineY -= LINE_HEIGHT;
                    });
                } else {
                    const rowTextY = y - 15;
                    const isRightAlign = rightAlignColumns.includes(i);
                    const cellX = isRightAlign ? currentX + colWidths[i] - fontRegular.widthOfTextAtSize(cell, FONT_SIZE_NORMAL) - 5 : currentX + 5;
                    currentPage.drawText(cell, { x: cellX, y: rowTextY, size: FONT_SIZE_NORMAL, font: fontRegular });
                }
                currentX += colWidths[i];
            });

            y -= rowHeight;
            currentPage.drawLine({ start: { x: X_MARGIN, y }, end: { x: width - X_MARGIN, y }, thickness: 0.5, color: rgb(0.9, 0.9, 0.9) });
        }
        return { yAfterTable: y, finalPage: currentPage };
    };
    
    const drawText = (text: string, options: any) => {
        const { page, x, y, size = FONT_SIZE_NORMAL, font = fontRegular, color = rgb(0, 0, 0), align = 'left', maxWidth } = options;
        const sanitizedText = (text || '').toString();
        
        const lines = maxWidth ? wrapText(sanitizedText, maxWidth, font, size) : [sanitizedText];
        let currentY = y;
        lines.forEach((line: string) => {
            let xPos = x;
            if (align === 'right') {
                xPos = x - font.widthOfTextAtSize(line, size);
            } else if (align === 'center') {
                xPos = x - (font.widthOfTextAtSize(line, size) / 2);
            }
            page.drawText(line, { x: xPos, y: currentY, size, font, color });
            currentY -= LINE_HEIGHT;
        });
        return currentY;
    };

    return {
        drawHeader, drawTable, drawText, drawAddressBlock, fontRegular, fontBold, width, height, X_MARGIN, Y_START, LINE_HEIGHT, settings, logoImage
    };
}
