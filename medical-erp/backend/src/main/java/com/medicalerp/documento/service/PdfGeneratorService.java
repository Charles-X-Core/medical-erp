package com.medicalerp.documento.service;

import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Image;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.properties.TextAlignment;
import com.medicalerp.documento.entity.Documento;
import com.medicalerp.paciente.entity.Paciente;
import com.medicalerp.seguridad.entity.Usuario;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.MessageDigest;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Base64;

/**
 * PDF Generator Service using iText 7 (DOM-DOC-001)
 * Generates medical documents with embedded digital signature image
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PdfGeneratorService {

    @Value("${app.upload.dir:./uploads}")
    private String uploadDir;

    /**
     * Generate PDF for a document with embedded signature
     * @return Path to generated PDF file
     */
    public String generatePdf(Documento documento) throws IOException {
        // Build directory path: uploads/pdfs/YYYY/MM/
        String yearMonth = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy/MM"));
        String relativePath = "pdfs/" + yearMonth;
        Path directoryPath = Paths.get(uploadDir, relativePath);

        // Create directories if not exist
        if (!Files.exists(directoryPath)) {
            Files.createDirectories(directoryPath);
        }

        // Build filename: tipo_id.pdf
        String filename = documento.getTipo() + "_" + documento.getId() + ".pdf";
        Path filePath = directoryPath.resolve(filename);

        // Generate PDF
        try (PdfWriter writer = new PdfWriter(filePath.toString())) {
            PdfDocument pdfDoc = new PdfDocument(writer);
            Document document = new Document(pdfDoc);

            // Header
            document.add(new Paragraph("CLINICA DE MEDICINA ALTERNATIVA")
                    .setTextAlignment(TextAlignment.CENTER)
                    .setBold()
                    .setFontSize(18));
            document.add(new Paragraph("Documento Oficial")
                    .setTextAlignment(TextAlignment.CENTER)
                    .setFontSize(12));
            document.add(new Paragraph(" "));

            // Document info
            document.add(new Paragraph("Tipo: " + capitalize(documento.getTipo()))
                    .setFontSize(12));
            document.add(new Paragraph("Titulo: " + documento.getTitulo())
                    .setFontSize(12));
            document.add(new Paragraph("Fecha: " + LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")))
                    .setFontSize(12));
            document.add(new Paragraph(" "));

            // Patient info
            Paciente paciente = documento.getPaciente();
            if (paciente != null) {
                document.add(new Paragraph("PACIENTE")
                        .setBold()
                        .setFontSize(14));
                document.add(new Paragraph("Nombre: " + paciente.getApellidoPaterno() + " " + paciente.getNombres())
                        .setFontSize(11));
                document.add(new Paragraph("ID: " + (paciente.getLicenciaConducir() != null ? paciente.getLicenciaConducir() : "N/A"))
                        .setFontSize(11));
                document.add(new Paragraph(" "));
            }

            // Document content based on type
            addDocumentContent(document, documento);

            document.add(new Paragraph(" "));
            document.add(new Paragraph(" "));

            // Signature section
            if (documento.getFirmaImagen() != null && !documento.getFirmaImagen().isBlank()) {
                document.add(new Paragraph("FIRMA DIGITAL")
                        .setBold()
                        .setFontSize(14));

                // Add signature image from base64
                try {
                    String base64Image = documento.getFirmaImagen();
                    // Remove data:image/png;base64, prefix if present
                    if (base64Image.contains(",")) {
                        base64Image = base64Image.split(",")[1];
                    }
                    byte[] imageBytes = Base64.getDecoder().decode(base64Image);
                    Image signatureImage = new Image(
                            com.itextpdf.io.image.ImageDataFactory.create(imageBytes));
                    signatureImage.setWidth(200);
                    signatureImage.setHeight(80);
                    document.add(signatureImage);
                } catch (Exception e) {
                    log.error("Error adding signature image to PDF", e);
                    document.add(new Paragraph("[Firma no disponible]")
                            .setFontSize(10));
                }

                // Doctor info below signature
                Usuario usuario = documento.getUsuario();
                if (usuario != null) {
                    document.add(new Paragraph("Dr. " + usuario.getNombre())
                            .setFontSize(11));
                }
                document.add(new Paragraph("Fecha firma: " +
                        (documento.getFirmadoAt() != null
                                ? documento.getFirmadoAt().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"))
                                : "N/A"))
                        .setFontSize(10));
            }

            // Footer
            document.add(new Paragraph(" "));
            document.add(new Paragraph("Este documento ha sido generado electronicamente y es valido sin firma manuscrita.")
                    .setTextAlignment(TextAlignment.CENTER)
                    .setFontSize(9)
                    .setItalic());

            document.close();
        }

        return relativePath + "/" + filename;
    }

    /**
     * Calculate SHA256 hash of a file
     */
    public String calculateSha256(Path filePath) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] fileBytes = Files.readAllBytes(filePath);
        byte[] hashBytes = digest.digest(fileBytes);

        StringBuilder sb = new StringBuilder();
        for (byte b : hashBytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }

    private void addDocumentContent(Document document, Documento documento) {
        switch (documento.getTipo().toLowerCase()) {
            case "consentimiento":
                document.add(new Paragraph("CONSENTIMIENTO INFORMADO")
                        .setBold()
                        .setFontSize(14));
                document.add(new Paragraph("Yo, " + getPacienteNombre(documento) + ", identificado(a) con ID " +
                        (documento.getPaciente() != null && documento.getPaciente().getLicenciaConducir() != null
                                ? documento.getPaciente().getLicenciaConducir()
                                : "N/A") +
                        ", declaro que he sido informado(a) sobre los procedimientos medicos que se realizaran, " +
                        "sus riesgos, beneficios y alternativas. Doy mi consentimiento voluntario para recibir el tratamiento.")
                        .setFontSize(11));
                break;
            case "receta":
                document.add(new Paragraph("RECETA MEDICA")
                        .setBold()
                        .setFontSize(14));
                document.add(new Paragraph("Receta generada por el sistema medico.")
                        .setFontSize(11));
                break;
            case "informe":
                document.add(new Paragraph("INFORME MEDICO")
                        .setBold()
                        .setFontSize(14));
                document.add(new Paragraph("Informe generado por el sistema medico.")
                        .setFontSize(11));
                break;
            default:
                document.add(new Paragraph("DOCUMENTO MEDICO")
                        .setBold()
                        .setFontSize(14));
                document.add(new Paragraph("Documento generado por el sistema medico.")
                        .setFontSize(11));
        }
    }

    private String getPacienteNombre(Documento documento) {
        if (documento.getPaciente() == null) return "Paciente";
        return documento.getPaciente().getApellidoPaterno() + " " + documento.getPaciente().getNombres();
    }

    private String capitalize(String str) {
        if (str == null || str.isEmpty()) return str;
        return str.substring(0, 1).toUpperCase() + str.substring(1);
    }

    /**
     * Get full path to a PDF file
     */
    public Path getPdfFullPath(String relativePath) {
        return Paths.get(uploadDir, relativePath);
    }

}
