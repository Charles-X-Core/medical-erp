package com.medicalerp.contratopwa.service;

import com.itextpdf.io.font.PdfEncodings;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.events.Event;
import com.itextpdf.kernel.events.IEventHandler;
import com.itextpdf.kernel.events.PdfDocumentEvent;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.geom.Rectangle;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfPage;
import com.itextpdf.kernel.pdf.canvas.PdfCanvas;

public class ContratoFooterEvent implements IEventHandler {

    private static final float MARGIN_LEFT = 50f;
    private static final float MARGIN_RIGHT = 50f;
    private static final float FONT_SIZE = 9f;

    @Override
    public void handleEvent(Event event) {
        PdfDocumentEvent docEvent = (PdfDocumentEvent) event;
        PdfDocument pdfDoc = docEvent.getDocument();
        PdfPage page = docEvent.getPage();
        int pageNumber = pdfDoc.getPageNumber(page);
        int totalPages = pdfDoc.getNumberOfPages();
        Rectangle pageSize = page.getPageSize();

        PdfCanvas canvas = new PdfCanvas(page.newContentStreamBefore(), page.getResources(), pdfDoc);
        float y = pageSize.getBottom() + 20f;

        try {
            PdfFont font = PdfFontFactory.createFont();

            // Left side: company name + document title
            canvas.beginText()
                    .setFontAndSize(font, FONT_SIZE)
                    .setColor(ColorConstants.DARK_GRAY, true)
                    .moveText(MARGIN_LEFT, y + 8f)
                    .showText("Optimal Health NOW")
                    .moveText(0, -12f)
                    .showText("Membership Contract")
                    .endText();

            // Right side: page number
            String pageText = "Page " + pageNumber + " of " + totalPages;
            canvas.beginText()
                    .setFontAndSize(font, FONT_SIZE)
                    .setColor(ColorConstants.DARK_GRAY, true)
                    .moveText(pageSize.getWidth() - MARGIN_RIGHT - font.getWidth(pageText, FONT_SIZE), y + 8f)
                    .showText(pageText)
                    .endText();
        } catch (Exception e) {
            // Font fallback
        }

        canvas.release();
    }
}
