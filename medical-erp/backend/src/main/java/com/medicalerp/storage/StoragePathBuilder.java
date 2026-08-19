package com.medicalerp.storage;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * StoragePathBuilder
 * Generador de rutas de almacenamiento
 */
@Component
public class StoragePathBuilder {

    @Value("${app.upload.dir:./uploads}")
    private String uploadDir;

    public String buildEvidenciaPath(Long clinicaId, Long pacienteId, Long tratamientoId, Integer numeroSesion) {
        return String.format("%d/pacientes/%d/tratamientos/%d/sesion_%d",
                clinicaId, pacienteId, tratamientoId, numeroSesion);
    }

    public String buildDocumentoPath(Long clinicaId, Long pacienteId) {
        return String.format("%d/pacientes/%d/documentos", clinicaId, pacienteId);
    }

    public String buildConsentimientoPath(Long clinicaId, Long pacienteId) {
        return String.format("%d/pacientes/%d/consentimientos", clinicaId, pacienteId);
    }

    public String buildTemplatePath(Long clinicaId) {
        return String.format("%d/templates", clinicaId);
    }

    public String buildContratoPath(Long clinicaId, Long pacienteId) {
        return String.format("%d/contratos/%d", clinicaId, pacienteId);
    }

    public Path getFullTemplatePath(String storagePath) {
        return Paths.get(uploadDir, storagePath);
    }

    public Path getFullStoragePath(String storagePath) {
        return Paths.get(uploadDir, storagePath);
    }
}
