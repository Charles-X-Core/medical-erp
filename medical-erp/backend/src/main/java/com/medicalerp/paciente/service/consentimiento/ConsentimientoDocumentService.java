package com.medicalerp.paciente.service.consentimiento;

import com.itextpdf.io.image.ImageDataFactory;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Image;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.properties.TextAlignment;
import com.medicalerp.common.exception.BusinessRuleException;
import com.medicalerp.common.util.BusinessTime;
import com.medicalerp.paciente.entity.PacienteConsentimiento;
import com.medicalerp.paciente.entity.consentimiento.ConsentTemplate;
import com.medicalerp.paciente.repository.consentimiento.ConsentTemplateRepository;
import com.medicalerp.storage.StoragePathBuilder;
import com.medicalerp.storage.StorageStrategy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Base64;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ConsentimientoDocumentService {

    private final ConsentTemplateRepository templateRepository;
    private final StorageStrategy storageStrategy;
    private final StoragePathBuilder pathBuilder;

    @Value("${app.upload.dir:./uploads}")
    private String uploadDir;

    @Transactional
    public DocumentGenerationResult generatePdf(
            PacienteConsentimiento consentimiento,
            ConsentTemplate template,
            String pacienteHtmlContent,
            String firmaImagenBase64) {

        try {
            String storageBasePath = pathBuilder.buildConsentimientoPath(
                    consentimiento.getClinicaId(),
                    consentimiento.getPaciente().getId());

            String filename = "consentimiento_" + consentimiento.getId() + ".pdf";
            String fullStoragePath = storageBasePath + "/" + filename;

            Path directoryPath = Paths.get(uploadDir, storageBasePath);
            if (!Files.exists(directoryPath)) {
                Files.createDirectories(directoryPath);
            }
            Path filePath = directoryPath.resolve(filename);

            byte[] pdfBytes = buildPdfBytes(
                    pacienteHtmlContent,
                    firmaImagenBase64,
                    consentimiento,
                    template);

            Files.write(filePath, pdfBytes);

            String relativePath = fullStoragePath;
            Path fullPath = Paths.get(uploadDir, relativePath);
            String hash = calculateSha256(fullPath);
            int tamano = pdfBytes.length;

            return DocumentGenerationResult.builder()
                    .storagePath(relativePath)
                    .nombreArchivo(filename)
                    .hashDocumento(hash)
                    .tamanoArchivo(tamano)
                    .build();

        } catch (IOException e) {
            log.error("Error generando PDF de consentimiento {}: {}", consentimiento.getId(), e.getMessage());
            throw new BusinessRuleException("PDF_GENERATION_ERROR",
                    "Error al generar el PDF del consentimiento: " + e.getMessage());
        }
    }

    private byte[] buildPdfBytes(
            String htmlContent,
            String firmaImagenBase64,
            PacienteConsentimiento consentimiento,
            ConsentTemplate template) throws IOException {

        ByteArrayOutputStream baos = new ByteArrayOutputStream();

        try (PdfWriter writer = new PdfWriter(baos)) {
            PdfDocument pdfDoc = new PdfDocument(writer);
            Document document = new Document(pdfDoc);

            document.add(new Paragraph(template.getTitulo())
                    .setTextAlignment(TextAlignment.CENTER)
                    .setBold()
                    .setFontSize(18));
            document.add(new Paragraph(" "));

            String[] paragraphs = htmlContent.split("\\n\\n+");
            for (String paragraph : paragraphs) {
                String trimmed = paragraph.trim();
                if (!trimmed.isEmpty()) {
                    document.add(new Paragraph(trimmed).setFontSize(11));
                }
            }

            document.add(new Paragraph(" "));

            if (firmaImagenBase64 != null && !firmaImagenBase64.isBlank()) {
                document.add(new Paragraph("FIRMA DIGITAL")
                        .setBold()
                        .setFontSize(14));

                try {
                    String base64 = firmaImagenBase64;
                    if (base64.contains(",")) {
                        base64 = base64.split(",")[1];
                    }
                    byte[] imageBytes = Base64.getDecoder().decode(base64);
                    Image signatureImage = new Image(
                            ImageDataFactory.create(imageBytes));
                    signatureImage.setWidth(200);
                    signatureImage.setHeight(80);
                    document.add(signatureImage);
                } catch (Exception e) {
                    log.error("Error al insertar firma en PDF", e);
                    document.add(new Paragraph("[Firma no disponible]").setFontSize(10));
                }

                document.add(new Paragraph("Fecha firma: " +
                        BusinessTime.currentDateTime().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")))
                        .setFontSize(10));
            }

            document.add(new Paragraph(" "));
            document.add(new Paragraph(
                    "Este documento ha sido generado electronicamente y es valido sin firma manuscrita.")
                    .setTextAlignment(TextAlignment.CENTER)
                    .setFontSize(9)
                    .setItalic());

            document.close();
        }

        return baos.toByteArray();
    }

    public String calculateSha256(Path filePath) throws IOException {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] fileBytes = Files.readAllBytes(filePath);
            byte[] hashBytes = digest.digest(fileBytes);

            StringBuilder sb = new StringBuilder();
            for (byte b : hashBytes) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            throw new IOException("Error calculando SHA-256", e);
        }
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class DocumentGenerationResult {
        private String storagePath;
        private String nombreArchivo;
        private String hashDocumento;
        private Integer tamanoArchivo;
    }
}
