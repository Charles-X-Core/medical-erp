package com.medicalerp.contratopwa.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.itextpdf.html2pdf.HtmlConverter;
import com.medicalerp.common.exception.BusinessRuleException;
import com.medicalerp.contratopwa.entity.ContratoSigningSession;
import com.medicalerp.paciente.entity.Paciente;
import com.medicalerp.storage.StoragePathBuilder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class ContratoStorageService {

    private final StoragePathBuilder pathBuilder;
    private final ObjectMapper objectMapper;

    /**
     * Guarda los 3 archivos del contrato firmado:
     * 1. contrato_{sessionId}.pdf — HTML convertido via html2pdf
     * 2. firma.png — imagen de firma decodificada del base64
     * 3. metadata.json — datos de la sesion y paciente
     *
     * @return ruta relativa del storage (ej: "1/contratos/42")
     */
    public String saveContrato(ContratoSigningSession session,
                               Paciente paciente,
                               String firmaBase64,
                               String renderedHtml) {

        String contratoPath = pathBuilder.buildContratoPath(
                session.getClinicaId(), session.getPacienteId());
        Path dirPath = pathBuilder.getFullStoragePath(contratoPath);

        try {
            Files.createDirectories(dirPath);
        } catch (IOException e) {
            throw new BusinessRuleException("STORAGE_DIR_ERROR",
                    "No se pudo crear directorio de contrato: " + e.getMessage());
        }

        // 1. Convertir HTML a PDF y guardar
        String pdfSha256 = savePdfFromHtml(dirPath, session.getId(), renderedHtml);

        // 2. Guardar firma como imagen separada
        saveFirma(dirPath, firmaBase64);

        // 3. Guardar metadata (incluye SHA-256 del PDF)
        saveMetadata(dirPath, session, paciente, pdfSha256);

        log.info("Contrato guardado en: {}/", contratoPath);
        return contratoPath;
    }

    public ContratoStorageResult getContratoInfo(Long clinicaId, Long pacienteId, Long sessionId) {
        String contratoPath = pathBuilder.buildContratoPath(clinicaId, pacienteId);
        Path dirPath = pathBuilder.getFullStoragePath(contratoPath);
        Path pdfPath = dirPath.resolve("contrato_" + sessionId + ".pdf");
        Path firmaPath = dirPath.resolve("firma.png");
        Path metadataPath = dirPath.resolve("metadata.json");

        return ContratoStorageResult.builder()
                .storagePath(contratoPath)
                .pdfExists(Files.exists(pdfPath))
                .firmaExists(Files.exists(firmaPath))
                .metadataExists(Files.exists(metadataPath))
                .pdfPath(pdfPath.toString())
                .firmaPath(firmaPath.toString())
                .build();
    }

    public byte[] loadContratoPdf(Long clinicaId, Long pacienteId, Long sessionId) {
        String contratoPath = pathBuilder.buildContratoPath(clinicaId, pacienteId);
        Path pdfPath = pathBuilder.getFullStoragePath(contratoPath)
                .resolve("contrato_" + sessionId + ".pdf");
        try {
            return Files.readAllBytes(pdfPath);
        } catch (IOException e) {
            throw new BusinessRuleException("CONTRATO_PDF_NOT_FOUND",
                    "PDF del contrato no encontrado: " + e.getMessage());
        }
    }

    private String savePdfFromHtml(Path dirPath, Long sessionId, String renderedHtml) {
        String filename = "contrato_" + sessionId + ".pdf";
        Path pdfPath = dirPath.resolve(filename);
        try {
            // Ensure we have a complete HTML document for proper PDF rendering
            String fullHtml = ensureCompleteHtml(renderedHtml);

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            HtmlConverter.convertToPdf(fullHtml, baos);
            byte[] pdfBytes = baos.toByteArray();
            Files.write(pdfPath, pdfBytes);

            String sha256 = computeSha256(pdfBytes);
            log.info("PDF del contrato generado: {} ({} bytes, sha256={})", filename, pdfBytes.length, sha256);
            return sha256;
        } catch (IOException e) {
            throw new BusinessRuleException("PDF_GENERATION_ERROR",
                    "Error al generar PDF del contrato: " + e.getMessage());
        }
    }

    private String computeSha256(byte[] data) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(data);
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            log.warn("SHA-256 not available: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Ensures the HTML is a complete document with <html>, <head>, <style>, and <body>.
     * If the HTML is already complete, returns it as-is.
     * If it's a body fragment, wraps it in a complete document with the template CSS.
     */
    private String ensureCompleteHtml(String html) {
        if (html == null || html.isBlank()) {
            return "<html><head><meta charset=\"UTF-8\"></head><body></body></html>";
        }

        String lower = html.trim().toLowerCase();

        // Already a complete document
        if (lower.startsWith("<!doctype") || lower.startsWith("<html")) {
            return html;
        }

        // It's a body fragment — wrap in complete document
        return "<!DOCTYPE html>\n"
                + "<html lang=\"en\">\n"
                + "<head>\n"
                + "<meta charset=\"UTF-8\">\n"
                + "<style>\n"
                + "  @page { size: letter; margin: 0.75in; }\n"
                + "  * { box-sizing: border-box; }\n"
                + "  body {\n"
                + "    font-family: \"Times New Roman\", Georgia, serif;\n"
                + "    font-size: 12pt;\n"
                + "    line-height: 1.5;\n"
                + "    color: #1a1a1a;\n"
                + "    max-width: 850px;\n"
                + "    margin: 0 auto;\n"
                + "    padding: 40px 50px 60px;\n"
                + "    background: #fdfdfb;\n"
                + "  }\n"
                + "  .header { text-align: center; margin-bottom: 20px; }\n"
                + "  .header h1 { font-size: 20pt; margin: 0 0 4px; letter-spacing: 0.5px; }\n"
                + "  .header h2 { font-size: 13pt; font-weight: normal; margin: 0 0 12px; font-style: italic; }\n"
                + "  .header h3 { font-size: 15pt; margin: 10px 0 20px; letter-spacing: 2px; padding: 6px 0; }\n"
                + "  p { margin: 0 0 14px; text-align: justify; }\n"
                + "  .intro { margin-bottom: 14px; text-align: justify; }\n"
                + "  .patient-name { display: inline-block; min-width: 240px; max-width: 60%; border-bottom: 1px solid #333; padding: 2px 4px; vertical-align: baseline; font-weight: bold; }\n"
                + "  .fill-short { display: inline-block; width: 50px; border-bottom: 1px solid #333; padding: 2px 4px; }\n"
                + "  .fill-med { display: inline-block; width: 130px; border-bottom: 1px solid #333; padding: 2px 4px; }\n"
                + "  ol.articles { padding-left: 22px; margin: 0 0 16px; }\n"
                + "  ol.articles > li { margin-bottom: 14px; text-align: justify; }\n"
                + "  .rights-note { text-align: justify; margin: 0 0 14px; }\n"
                + "  .rights-note strong { text-transform: uppercase; }\n"
                + "  .services-columns { display: flex; gap: 40px; margin: 6px 0 16px; }\n"
                + "  .services-col { flex: 1; }\n"
                + "  .services-col h4 { text-decoration: underline; font-style: italic; font-weight: normal; margin: 0 0 6px; font-size: 12pt; }\n"
                + "  .services-col ul { margin: 0; padding-left: 18px; }\n"
                + "  .services-col li { margin-bottom: 4px; font-size: 11pt; }\n"
                + "  .mou-title { text-align: center; text-decoration: underline; font-weight: bold; margin: 26px 0 14px; font-size: 13pt; }\n"
                + "  .fee-line { margin: 18px 0 24px; }\n"
                + "  .signature-block { margin-top: 30px; page-break-inside: avoid; }\n"
                + "  .sig-row { margin: 20px 0 2px; }\n"
                + "  .sig-value { display: block; width: 100%; min-height: 28px; border-bottom: 1px solid #333; padding: 4px; font-weight: bold; font-size: 13pt; }\n"
                + "  .sig-caption { font-size: 10pt; font-style: italic; margin-top: 2px; margin-bottom: 16px; }\n"
                + "  .approve-sig-row { display: flex; align-items: baseline; gap: 6px; margin-top: 8px; }\n"
                + "  .approve-sig-line { flex: 1; border-bottom: 1px solid #333; min-height: 28px; }\n"
                + "  .contact-section { margin-top: 20px; }\n"
                + "  .contact-section h4 { font-weight: bold; margin: 0 0 8px; }\n"
                + "  .address-line { border: none; border-bottom: 1px solid #333; width: 100%; font-family: inherit; font-size: 13pt; padding: 4px; text-decoration: underline; background: transparent; }\n"
                + "  .address-caption { display: flex; justify-content: space-between; font-size: 10pt; font-style: italic; margin: 2px 0 16px; padding: 0 20px 0 60px; }\n"
                + "  .contact-fields { display: flex; gap: 20px; margin-bottom: 20px; }\n"
                + "  .contact-field { flex: 1; border-bottom: 1px solid #333; font-family: inherit; font-size: 13pt; padding: 4px; background: transparent; }\n"
                + "  .contact-caption { display: flex; gap: 20px; font-size: 10pt; font-style: italic; margin-top: -14px; margin-bottom: 20px; }\n"
                + "  .contact-caption span { flex: 1; text-align: center; }\n"
                + "</style>\n"
                + "</head>\n"
                + "<body>\n"
                + html + "\n"
                + "</body>\n"
                + "</html>";
    }

    private void saveFirma(Path dirPath, String firmaBase64) {
        if (firmaBase64 == null || firmaBase64.isBlank()) return;
        try {
            String base64 = firmaBase64;
            if (base64.contains(",")) {
                base64 = base64.split(",")[1];
            }
            byte[] imageBytes = Base64.getDecoder().decode(base64);
            Files.write(dirPath.resolve("firma.png"), imageBytes);
            log.info("Firma PNG guardada: {} bytes", imageBytes.length);
        } catch (Exception e) {
            log.error("Error guardando firma PNG: {}", e.getMessage());
        }
    }

    private void saveMetadata(Path dirPath, ContratoSigningSession session,
                              Paciente paciente, String pdfSha256) {
        try {
            String nombreCompleto =
                    (paciente.getApellidoPaterno() != null ? paciente.getApellidoPaterno() + " " : "")
                    + (paciente.getNombres() != null ? paciente.getNombres() : "");

            Map<String, Object> metadata = new LinkedHashMap<>();
            metadata.put("sessionId", session.getId());
            metadata.put("clinicaId", session.getClinicaId());
            metadata.put("pacienteId", session.getPacienteId());
            metadata.put("pacienteNombre", nombreCompleto);
            metadata.put("templateCode", session.getTemplateCode());
            metadata.put("consentimientoId", session.getConsentimientoId());
            metadata.put("signedAt", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
            metadata.put("status", session.getStatus());
            if (pdfSha256 != null) {
                metadata.put("pdfSha256", pdfSha256);
            }

            String json = objectMapper.writerWithDefaultPrettyPrinter()
                    .writeValueAsString(metadata);
            Files.write(dirPath.resolve("metadata.json"), json.getBytes());
            log.info("Metadata.json guardado para sesion {} (sha256={})", session.getId(), pdfSha256);
        } catch (Exception e) {
            log.error("Error guardando metadata.json: {}", e.getMessage());
        }
    }

    @lombok.Data
    @lombok.Builder
    public static class ContratoStorageResult {
        private String storagePath;
        private boolean pdfExists;
        private boolean firmaExists;
        private boolean metadataExists;
        private String pdfPath;
        private String firmaPath;
    }
}
