package com.medicalerp.paciente.service;

import com.medicalerp.clinica.entity.Clinica;
import com.medicalerp.clinica.repository.ClinicaRepository;
import com.medicalerp.common.exception.ResourceNotFoundException;
import com.medicalerp.common.util.BusinessTime;
import com.medicalerp.common.util.SecurityUtils;
import com.medicalerp.paciente.dto.ImportResult;
import com.medicalerp.paciente.entity.Paciente;
import com.medicalerp.paciente.repository.PacienteRepository;
import com.medicalerp.tratamiento.entity.Tratamiento;
import com.medicalerp.tratamiento.enums.EstadoTratamiento;
import com.medicalerp.tratamiento.repository.TratamientoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class PacienteImportService {

    private final PacienteRepository pacienteRepository;
    private final TratamientoRepository tratamientoRepository;
    private final ClinicaRepository clinicaRepository;
    private final SecurityUtils securityUtils;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final DateTimeFormatter DATE_FMT_SLASH = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter DATE_FMT_DASH = DateTimeFormatter.ofPattern("dd-MM-yyyy");

    // ==================== CSV IMPORT ====================

    @Transactional
    public ImportResult importCsv(MultipartFile file) {
        ImportResult result = new ImportResult();
        Long clinicaId = securityUtils.getCurrentClinicaId();
        Clinica clinica = clinicaRepository.findById(clinicaId)
                .orElseThrow(() -> new ResourceNotFoundException("Clínica", clinicaId));

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8));
             CSVParser parser = CSVFormat.DEFAULT.builder()
                     .setHeader()
                     .setSkipHeaderRecord(true)
                     .setIgnoreHeaderCase(true)
                     .setTrim(true)
                     .build()
                     .parse(reader)) {

            java.util.List<CSVRecord> records = parser.getRecords();
            result.setTotalFilas(records.size());

            // Pre-build header map for flexible column matching
            Map<String, Integer> headerMap = new HashMap<>();
            for (Map.Entry<String, Integer> entry : parser.getHeaderMap().entrySet()) {
                headerMap.put(entry.getKey().toLowerCase().trim(), entry.getValue());
            }

            for (CSVRecord record : records) {
                try {
                    processRow(record, headerMap, clinicaId, clinica.getPais(), result);
                } catch (Exception e) {
                    result.addError(String.valueOf(record.getRecordNumber()), e.getMessage());
                    log.error("Error importing row {}: {}", record.getRecordNumber(), e.getMessage());
                }
            }
        } catch (Exception e) {
            result.addError("0", "Error leyendo archivo CSV: " + e.getMessage());
            log.error("CSV import error", e);
        }

        return result;
    }

    // ==================== EXCEL IMPORT ====================

    @Transactional
    public ImportResult importExcel(MultipartFile file) {
        ImportResult result = new ImportResult();
        Long clinicaId = securityUtils.getCurrentClinicaId();
        Clinica clinica = clinicaRepository.findById(clinicaId)
                .orElseThrow(() -> new ResourceNotFoundException("Clínica", clinicaId));

        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            if (sheet.getPhysicalNumberOfRows() == 0) {
                result.addError("0", "El archivo está vacío");
                return result;
            }

            // Read header row
            Row headerRow = sheet.getRow(0);
            Map<String, Integer> headerMap = new HashMap<>();
            for (int i = 0; i < headerRow.getPhysicalNumberOfCells(); i++) {
                Cell cell = headerRow.getCell(i);
                if (cell != null) {
                    String header = getCellValue(cell).toLowerCase().trim();
                    headerMap.put(header, i);
                }
            }

            int totalRows = sheet.getLastRowNum();
            result.setTotalFilas(totalRows);

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                try {
                    processExcelRow(row, headerMap, clinicaId, clinica.getPais(), result);
                } catch (Exception e) {
                    result.addError(String.valueOf(i + 1), e.getMessage());
                    log.error("Error importing row {}: {}", i + 1, e.getMessage());
                }
            }
        } catch (Exception e) {
            result.addError("0", "Error leyendo archivo Excel: " + e.getMessage());
            log.error("Excel import error", e);
        }

        return result;
    }

    // ==================== SHARED ROW PROCESSING ====================

    private void processRow(CSVRecord record, Map<String, Integer> headerMap,
                            Long clinicaId, String pais, ImportResult result) {

        String nombreCompleto = getRecordValue(record, headerMap, "nombre completo", "nombre", "nombres");
        if (nombreCompleto == null || nombreCompleto.isBlank()) {
            result.addError(String.valueOf(record.getRecordNumber()), "Nombre completo es requerido");
            return;
        }

        // Check duplicate by email
        String email = getRecordValue(record, headerMap, "correo electronico", "email", "correo");
        if (email != null && !email.isBlank() && pacienteRepository.existsByEmailAndClinicaId(email, clinicaId)) {
            result.addSaltado(nombreCompleto, "Ya existe paciente con email " + email);
            return;
        }

        // Split name
        String[] nameParts = splitNombreCompleto(nombreCompleto);

        // Create patient
        Paciente paciente = new Paciente();
        paciente.setClinicaId(clinicaId);
        paciente.setPais(pais);
        paciente.setNombres(nameParts[0]);
        paciente.setApellidoPaterno(nameParts[1]);
        paciente.setApellidoMaterno(nameParts.length > 2 ? nameParts[2] : null);
        paciente.setLicenciaConducir(generateLicenciaConducir(clinicaId));
        paciente.setEstado("activo");

        // Optional fields
        paciente.setFechaNacimiento(parseDate(getRecordValue(record, headerMap, "fecha nacimiento", "fecha de nacimiento", "nacimiento")));
        paciente.setSexo(normalizeSexo(getRecordValue(record, headerMap, "sexo", "genero")));
        paciente.setTelefono(getRecordValue(record, headerMap, "telefono", "teléfono", "tel"));
        paciente.setEmail(email);
        paciente.setPeso(parseDouble(getRecordValue(record, headerMap, "peso")));
        paciente.setEstatura(parseDouble(getRecordValue(record, headerMap, "estatura", "altura")));

        // Address
        String ciudadEstado = getRecordValue(record, headerMap, "ciudad/estado", "ciudad estado", "ciudad");
        if (ciudadEstado != null && ciudadEstado.contains(",")) {
            String[] parts = ciudadEstado.split(",", 2);
            paciente.setCiudad(parts[0].trim());
            paciente.setEstadoProvincia(parts[1].trim());
        } else {
            paciente.setCiudad(ciudadEstado);
        }
        paciente.setDireccionLinea1(getRecordValue(record, headerMap, "direccion", "dirección", "dir"));

        // Emergency contact
        paciente.setContactoEmergencia(getRecordValue(record, headerMap, "contacto de emergencia", "emergencia", "contacto emergencia"));

        // Medical data
        paciente.setAlergias(getRecordValue(record, headerMap, "alergias"));
        paciente.setAntecedentesPersonales(getRecordValue(record, headerMap, "antecedentes medicos", "antecedentes", "antecedentes personales"));

        Paciente saved = pacienteRepository.save(paciente);

        // Create treatment if provided
        String tipoTratamiento = getRecordValue(record, headerMap, "tipo de tratamiento", "tratamiento", "tipo tratamiento");
        if (tipoTratamiento != null && !tipoTratamiento.isBlank()) {
            createTratamiento(saved.getId(), clinicaId, record, headerMap, tipoTratamiento);
        }

        result.addImportado(nombreCompleto);
        log.info("Imported patient: {} (ID: {})", nombreCompleto, saved.getId());
    }

    private void processExcelRow(Row row, Map<String, Integer> headerMap,
                                 Long clinicaId, String pais, ImportResult result) {

        String nombreCompleto = getExcelValue(row, headerMap, "nombre completo", "nombre", "nombres");
        if (nombreCompleto == null || nombreCompleto.isBlank()) {
            result.addError(String.valueOf(row.getRowNum() + 1), "Nombre completo es requerido");
            return;
        }

        // Check duplicate by email
        String email = getExcelValue(row, headerMap, "correo electronico", "email", "correo");
        if (email != null && !email.isBlank() && pacienteRepository.existsByEmailAndClinicaId(email, clinicaId)) {
            result.addSaltado(nombreCompleto, "Ya existe paciente con email " + email);
            return;
        }

        String[] nameParts = splitNombreCompleto(nombreCompleto);

        Paciente paciente = new Paciente();
        paciente.setClinicaId(clinicaId);
        paciente.setPais(pais);
        paciente.setNombres(nameParts[0]);
        paciente.setApellidoPaterno(nameParts[1]);
        paciente.setApellidoMaterno(nameParts.length > 2 ? nameParts[2] : null);
        paciente.setLicenciaConducir(generateLicenciaConducir(clinicaId));
        paciente.setEstado("activo");

        paciente.setFechaNacimiento(parseDate(getExcelValue(row, headerMap, "fecha nacimiento", "fecha de nacimiento", "nacimiento")));
        paciente.setSexo(normalizeSexo(getExcelValue(row, headerMap, "sexo", "genero")));
        paciente.setTelefono(getExcelValue(row, headerMap, "telefono", "teléfono", "tel"));
        paciente.setEmail(email);
        paciente.setPeso(parseDouble(getExcelValue(row, headerMap, "peso")));
        paciente.setEstatura(parseDouble(getExcelValue(row, headerMap, "estatura", "altura")));

        String ciudadEstado = getExcelValue(row, headerMap, "ciudad/estado", "ciudad estado", "ciudad");
        if (ciudadEstado != null && ciudadEstado.contains(",")) {
            String[] parts = ciudadEstado.split(",", 2);
            paciente.setCiudad(parts[0].trim());
            paciente.setEstadoProvincia(parts[1].trim());
        } else {
            paciente.setCiudad(ciudadEstado);
        }
        paciente.setDireccionLinea1(getExcelValue(row, headerMap, "direccion", "dirección", "dir"));
        paciente.setContactoEmergencia(getExcelValue(row, headerMap, "contacto de emergencia", "emergencia", "contacto emergencia"));
        paciente.setAlergias(getExcelValue(row, headerMap, "alergias"));
        paciente.setAntecedentesPersonales(getExcelValue(row, headerMap, "antecedentes medicos", "antecedentes", "antecedentes personales"));

        Paciente saved = pacienteRepository.save(paciente);

        String tipoTratamiento = getExcelValue(row, headerMap, "tipo de tratamiento", "tratamiento", "tipo tratamiento");
        if (tipoTratamiento != null && !tipoTratamiento.isBlank()) {
            createTratamiento(saved.getId(), clinicaId, row, headerMap, tipoTratamiento);
        }

        result.addImportado(nombreCompleto);
        log.info("Imported patient from Excel: {} (ID: {})", nombreCompleto, saved.getId());
    }

    // ==================== HELPERS ====================

    private void createTratamiento(Long pacienteId, Long clinicaId, CSVRecord record,
                                   Map<String, Integer> headerMap, String tipoTratamiento) {
        try {
            Tratamiento t = new Tratamiento();
            t.setPacienteId(pacienteId);
            t.setClinicaId(clinicaId);
            t.setTipoTratamiento(tipoTratamiento);
            t.setObjetivo(getRecordValue(record, headerMap, "observaciones", "objetivo", "motivo") != null
                    ? getRecordValue(record, headerMap, "observaciones", "objetivo", "motivo")
                    : "Tratamiento indicado por importación");
            t.setEstado(EstadoTratamiento.EN_CURSO);
            t.setSesionesPlaneadas(parseInt(getRecordValue(record, headerMap, "sesiones", "sesiones realizadas", "sesiones planeadas")));
            t.setSesionesRealizadas(0);
            t.setCostoEstimado(parseBigDecimal(getRecordValue(record, headerMap, "costo", "costo total", "costo estimado")));
            t.setCostoTotal(BigDecimal.ZERO);
            t.setFechaInicio(LocalDate.now(BusinessTime.ZONE));
            t.setObservaciones(getRecordValue(record, headerMap, "evolucion", "evolución", "mejoría"));
            tratamientoRepository.save(t);
        } catch (Exception e) {
            log.warn("Could not create treatment for patient {}: {}", pacienteId, e.getMessage());
        }
    }

    private void createTratamiento(Long pacienteId, Long clinicaId, Row row,
                                   Map<String, Integer> headerMap, String tipoTratamiento) {
        try {
            Tratamiento t = new Tratamiento();
            t.setPacienteId(pacienteId);
            t.setClinicaId(clinicaId);
            t.setTipoTratamiento(tipoTratamiento);
            t.setObjetivo(getExcelValue(row, headerMap, "observaciones", "objetivo", "motivo") != null
                    ? getExcelValue(row, headerMap, "observaciones", "objetivo", "motivo")
                    : "Tratamiento indicado por importación");
            t.setEstado(EstadoTratamiento.EN_CURSO);
            t.setSesionesPlaneadas(parseInt(getExcelValue(row, headerMap, "sesiones", "sesiones realizadas", "sesiones planeadas")));
            t.setSesionesRealizadas(0);
            t.setCostoEstimado(parseBigDecimal(getExcelValue(row, headerMap, "costo", "costo total", "costo estimado")));
            t.setCostoTotal(BigDecimal.ZERO);
            t.setFechaInicio(LocalDate.now(BusinessTime.ZONE));
            t.setObservaciones(getExcelValue(row, headerMap, "evolucion", "evolución", "mejoría"));
            tratamientoRepository.save(t);
        } catch (Exception e) {
            log.warn("Could not create treatment for patient {}: {}", pacienteId, e.getMessage());
        }
    }

    private String generateLicenciaConducir(Long clinicaId) {
        long count = pacienteRepository.countByClinicaId(clinicaId) + 1;
        String licencia;
        do {
            licencia = String.format("IMP-%04d", count);
            count++;
        } while (pacienteRepository.existsByLicenciaConducir(licencia));
        return licencia;
    }

    private String[] splitNombreCompleto(String nombreCompleto) {
        String[] parts = nombreCompleto.trim().split("\\s+");
        if (parts.length == 1) return new String[]{parts[0], "", ""};
        if (parts.length == 2) return new String[]{parts[0], parts[1], ""};
        // First word = nombre, last word = apellidoPaterno, middle = apellidoMaterno
        StringBuilder nombres = new StringBuilder(parts[0]);
        for (int i = 1; i < parts.length - 2; i++) {
            nombres.append(" ").append(parts[i]);
        }
        return new String[]{nombres.toString(), parts[parts.length - 2], parts[parts.length - 1]};
    }

    // CSV value extraction with fuzzy header matching
    private String getRecordValue(CSVRecord record, Map<String, Integer> headerMap, String... alternatives) {
        for (String alt : alternatives) {
            String key = alt.toLowerCase().trim();
            if (headerMap.containsKey(key)) {
                try {
                    String val = record.get(headerMap.get(key));
                    return (val != null && !val.isBlank()) ? val.trim() : null;
                } catch (Exception e) { /* continue */ }
            }
        }
        // Fallback: try direct header name
        for (String alt : alternatives) {
            try {
                String val = record.get(alt);
                if (val != null && !val.isBlank()) return val.trim();
            } catch (Exception e) { /* continue */ }
        }
        return null;
    }

    // Excel value extraction with fuzzy header matching
    private String getExcelValue(Row row, Map<String, Integer> headerMap, String... alternatives) {
        for (String alt : alternatives) {
            String key = alt.toLowerCase().trim();
            if (headerMap.containsKey(key)) {
                Cell cell = row.getCell(headerMap.get(key));
                if (cell != null) {
                    String val = getCellValue(cell);
                    if (val != null && !val.isBlank()) return val.trim();
                }
            }
        }
        return null;
    }

    private String getCellValue(Cell cell) {
        if (cell == null) return null;
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue().trim();
            case NUMERIC -> {
                double val = cell.getNumericCellValue();
                yield val == Math.floor(val) ? String.valueOf((long) val) : String.valueOf(val);
            }
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            case FORMULA -> {
                try { yield cell.getStringCellValue().trim(); }
                catch (Exception e) { yield String.valueOf(cell.getNumericCellValue()); }
            }
            default -> null;
        };
    }

    private LocalDate parseDate(String dateStr) {
        if (dateStr == null || dateStr.isBlank()) return null;
        try { return LocalDate.parse(dateStr.trim(), DATE_FMT); } catch (DateTimeParseException e1) {
            try { return LocalDate.parse(dateStr.trim(), DATE_FMT_SLASH); } catch (DateTimeParseException e2) {
                try { return LocalDate.parse(dateStr.trim(), DATE_FMT_DASH); } catch (DateTimeParseException e3) {
                    return null;
                }
            }
        }
    }

    private Double parseDouble(String val) {
        if (val == null || val.isBlank()) return null;
        try { return Double.parseDouble(val.trim().replace(",", ".")); }
        catch (NumberFormatException e) { return null; }
    }

    private Integer parseInt(String val) {
        if (val == null || val.isBlank()) return 1;
        try { return (int) Double.parseDouble(val.trim().replace(",", ".")); }
        catch (NumberFormatException e) { return 1; }
    }

    private BigDecimal parseBigDecimal(String val) {
        if (val == null || val.isBlank()) return null;
        try { return new BigDecimal(val.trim().replace(",", ".")); }
        catch (NumberFormatException e) { return null; }
    }

    private String normalizeSexo(String sexo) {
        if (sexo == null) return null;
        String s = sexo.trim().toUpperCase();
        return switch (s) {
            case "M", "MASCULINO", "H", "HOMBRE" -> "M";
            case "F", "FEMENINO", "MUJER" -> "F";
            default -> s.substring(0, Math.min(s.length(), 10));
        };
    }
}
