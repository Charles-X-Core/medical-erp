package com.medicalerp.config;

import com.medicalerp.clinica.repository.ClinicaRepository;
import com.medicalerp.paciente.entity.consentimiento.ConsentTemplate;
import com.medicalerp.paciente.repository.consentimiento.ConsentTemplateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Optional;

/**
 * ConsentTemplateInitializer
 *
 * Las plantillas de contrato NO viven en la base de datos: la fila de
 * {@code consent_templates} solo guarda un {@code storage_path} que apunta al
 * archivo HTML dentro de {@code app.upload.dir}. Eso significa que un HTML
 * borrado del disco (o una base de datos reconstruida) dejaba los contratos sin
 * poder emitirse, y no habia forma de recuperarlos desde el repo.
 *
 * Este initializer hace que las plantillas sean reproducibles desde el codigo:
 * los HTML viven en el classpath ({@code resources/plantillas/}) y al arrancar
 * se copian al directorio de uploads si no estan, y se registra la fila en
 * {@code consent_templates} si falta.
 *
 * Es idempotente: si la fila existe y el archivo esta en disco, no hace nada.
 * En una instalacion sana no modifica absolutamente nada.
 *
 * Toda la logica va envuelta en try/catch a proposito: si el directorio de
 * uploads no fuese escribible, el arranque debe continuar igual (con un WARN)
 * en lugar de tumbar la aplicacion en produccion.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ConsentTemplateInitializer implements CommandLineRunner {

    private static final String VERSION = "1.0";
    private static final Long CLINICA_ID = 1L;

    /** Plantillas empaquetadas en el JAR. */
    private record Seed(String codigo, String titulo, String classpath, String storagePath) {
    }

    private static final Seed[] SEEDS = new Seed[]{
            new Seed(
                    "CONTRATO_MEMBRESIA",
                    "Contrato de Membresía - Optimal Health NOW",
                    "plantillas/contrato_membresia_v1.html",
                    "templates/contrato_membresia_v1.html"),
            new Seed(
                    "CONTRATO_MEMBRESIA_ES",
                    "Contrato de Membresía (Español) - Optimal Health NOW",
                    "plantillas/contrato_membresia_v1_ES.html",
                    "templates/contrato_membresia_v1_ES.html"),
    };

    private final ConsentTemplateRepository templateRepository;
    private final ClinicaRepository clinicaRepository;

    @Value("${app.upload.dir:./uploads}")
    private String uploadDir;

    @Override
    @Transactional
    public void run(String... args) {
        try {
            if (clinicaRepository.findById(CLINICA_ID).isEmpty()) {
                log.debug("Clinica {} aun no existe: no se siembran plantillas", CLINICA_ID);
                return;
            }
            for (Seed seed : SEEDS) {
                try {
                    asegurar(seed);
                } catch (Exception e) {
                    log.warn("No se pudo asegurar la plantilla {}: {}", seed.codigo(), e.getMessage());
                }
            }
        } catch (Exception e) {
            log.warn("No se pudieron sembrar las plantillas de consentimiento: {}", e.getMessage());
        }
    }

    private void asegurar(Seed seed) throws Exception {
        Optional<ConsentTemplate> existente =
                templateRepository.findByClinicaIdAndCodigoAndVersion(CLINICA_ID, seed.codigo(), VERSION);

        // Si la fila ya existe, respetamos el storage_path que tenga (puede
        // haber sido movida a mano); solo usamos el por defecto si no hay fila.
        String storagePath = existente.map(ConsentTemplate::getStoragePath).orElse(seed.storagePath());
        Path destino = Paths.get(uploadDir, storagePath);

        boolean archivoExiste = Files.isRegularFile(destino);
        boolean filaExiste = existente.isPresent();

        if (archivoExiste && filaExiste) {
            log.debug("Plantilla {} OK en {}", seed.codigo(), destino);
            return;
        }

        // Falta el archivo -> se restaura desde el classpath (dentro del JAR).
        if (!archivoExiste) {
            ClassPathResource recurso = new ClassPathResource(seed.classpath());
            if (!recurso.exists()) {
                log.warn("Plantilla {} no esta en el JAR ({}); se deja como esta", seed.codigo(), seed.classpath());
                return;
            }
            Files.createDirectories(destino.getParent());
            try (InputStream in = recurso.getInputStream()) {
                Files.copy(in, destino, StandardCopyOption.REPLACE_EXISTING);
            }
            log.warn("Plantilla {} restaurada en {} ({} bytes)",
                    seed.codigo(), destino, Files.size(destino));
        }

        // Falta la fila -> se registra.
        if (!filaExiste) {
            templateRepository.save(ConsentTemplate.builder()
                    .clinicaId(CLINICA_ID)
                    .codigo(seed.codigo())
                    .version(VERSION)
                    .titulo(seed.titulo())
                    .storagePath(storagePath)
                    .mimeType("text/html")
                    .variablesVersion("1.0")
                    .requiereFirma(true)
                    .requiereFecha(true)
                    .activo(true)
                    .build());
            log.info("Plantilla {} v{} registrada para la clinica {}", seed.codigo(), VERSION, CLINICA_ID);
        }
    }
}
