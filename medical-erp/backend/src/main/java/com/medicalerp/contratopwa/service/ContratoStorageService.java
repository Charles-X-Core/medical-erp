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
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
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
        savePdfFromHtml(dirPath, session.getId(), renderedHtml);

        // 2. Guardar firma como imagen separada
        saveFirma(dirPath, firmaBase64);

        // 3. Guardar metadata
        saveMetadata(dirPath, session, paciente);

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

    private void savePdfFromHtml(Path dirPath, Long sessionId, String renderedHtml) {
        String filename = "contrato_" + sessionId + ".pdf";
        Path pdfPath = dirPath.resolve(filename);
        try {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            HtmlConverter.convertToPdf(renderedHtml, baos);
            Files.write(pdfPath, baos.toByteArray());
            log.info("PDF del contrato generado: {} ({} bytes)", filename, baos.size());
        } catch (IOException e) {
            throw new BusinessRuleException("PDF_GENERATION_ERROR",
                    "Error al generar PDF del contrato: " + e.getMessage());
        }
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

    private void saveMetadata(Path dirPath, ContratoSigningSession session, Paciente paciente) {
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

            String json = objectMapper.writerWithDefaultPrettyPrinter()
                    .writeValueAsString(metadata);
            Files.write(dirPath.resolve("metadata.json"), json.getBytes());
            log.info("Metadata.json guardado para sesion {}", session.getId());
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
