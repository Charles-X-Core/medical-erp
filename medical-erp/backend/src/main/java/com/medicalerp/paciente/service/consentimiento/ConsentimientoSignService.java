package com.medicalerp.paciente.service.consentimiento;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.medicalerp.clinica.entity.Clinica;
import com.medicalerp.clinica.repository.ClinicaRepository;
import com.medicalerp.common.exception.BusinessRuleException;
import com.medicalerp.common.exception.ResourceNotFoundException;
import com.medicalerp.common.util.SecurityUtils;
import com.medicalerp.paciente.dto.consentimiento.ConsentimientoFirmaRequest;
import com.medicalerp.paciente.dto.consentimiento.ConsentimientoFirmaResponse;
import com.medicalerp.paciente.dto.consentimiento.ConsentimientoRenderResponse;
import com.medicalerp.paciente.entity.Paciente;
import com.medicalerp.paciente.entity.PacienteConsentimiento;
import com.medicalerp.paciente.entity.consentimiento.ConsentTemplate;
import com.medicalerp.paciente.enums.EstadoConsentimientoDocumento;
import com.medicalerp.paciente.repository.PacienteConsentimientoRepository;
import com.medicalerp.paciente.repository.consentimiento.ConsentTemplateRepository;
import com.medicalerp.paciente.repository.PacienteRepository;
import com.medicalerp.seguridad.entity.Usuario;
import com.medicalerp.seguridad.repository.UsuarioRepository;
import com.medicalerp.storage.StorageStrategy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ConsentimientoSignService {

    private final ConsentTemplateRepository templateRepository;
    private final PacienteRepository pacienteRepository;
    private final PacienteConsentimientoRepository consentimientoRepository;
    private final ConsentTemplateService templateService;
    private final ConsentimientoDocumentService documentService;
    private final UsuarioRepository usuarioRepository;
    private final ClinicaRepository clinicaRepository;
    private final SecurityUtils securityUtils;
    private final ObjectMapper objectMapper;
    private final StorageStrategy storageStrategy;

    @Value("${app.upload.dir:./uploads}")
    private String uploadDir;

    public ConsentimientoRenderResponse render(Long templateId, Long pacienteId) {
        Long clinicaId = securityUtils.getCurrentClinicaId();

        ConsentTemplate template = templateRepository.findByIdAndClinicaId(templateId, clinicaId)
                .orElseThrow(() -> new ResourceNotFoundException("ConsentTemplate", templateId));

        if (!template.getActivo()) {
            throw new BusinessRuleException("VR-CON-006",
                    "El template no esta activo");
        }

        Paciente paciente = pacienteRepository.findByIdAndClinicaId(pacienteId, clinicaId)
                .orElseThrow(() -> new ResourceNotFoundException("Paciente", pacienteId));

        String htmlContent = templateService.loadTemplateContent(templateId);

        Map<String, String> variables = buildVariables(paciente, clinicaId);
        String renderedHtml = replaceVariables(htmlContent, variables);

        Long currentUserId = securityUtils.getCurrentUserId();
        Usuario doctor = usuarioRepository.findById(currentUserId).orElse(null);

        String nombreClinica = "Clinica";
        String direccionClinica = "";
        try {
            var clinica = clinicaRepository.findById(clinicaId).orElse(null);
            if (clinica != null) {
                nombreClinica = clinica.getNombre();
            }
        } catch (Exception e) {
            log.warn("No se pudo cargar información de la clínica: {}", e.getMessage());
        }

        return ConsentimientoRenderResponse.builder()
                .templateId(template.getId())
                .codigo(template.getCodigo())
                .titulo(template.getTitulo())
                .htmlContent(renderedHtml)
                .mimeType(template.getMimeType())
                .requiereFirma(template.getRequiereFirma())
                .requiereFecha(template.getRequiereFecha())
                .variablesVersion(template.getVariablesVersion())
                .variables(variables)
                .paciente(ConsentimientoRenderResponse.PacienteSnapshot.builder()
                        .nombreCompleto(paciente.getApellidoPaterno() + " " + paciente.getNombres())
                        .tipoDocumento("ID")
                        .numeroDocumento(paciente.getLicenciaConducir())
                        .fechaNacimiento(paciente.getFechaNacimiento() != null
                                ? paciente.getFechaNacimiento().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))
                                : "N/A")
                        .direccion(buildDireccion(paciente))
                        .telefono(paciente.getTelefono())
                        .email(paciente.getEmail())
                        .build())
                .doctor(ConsentimientoRenderResponse.DoctorInfo.builder()
                        .nombre(doctor != null ? doctor.getNombre() : "N/A")
                        .build())
                .clinica(ConsentimientoRenderResponse.ClinicaInfo.builder()
                        .nombre(nombreClinica)
                        .direccion(direccionClinica)
                        .build())
                .build();
    }

    @Transactional
    public ConsentimientoFirmaResponse firmar(Long templateId, Long pacienteId,
                                               ConsentimientoFirmaRequest request) {
        Long clinicaId = securityUtils.getCurrentClinicaId();

        ConsentTemplate template = templateRepository.findByIdAndClinicaId(templateId, clinicaId)
                .orElseThrow(() -> new ResourceNotFoundException("ConsentTemplate", templateId));

        if (!template.getActivo()) {
            throw new BusinessRuleException("VR-CON-006",
                    "El template no esta activo");
        }

        Paciente paciente = pacienteRepository.findByIdAndClinicaId(pacienteId, clinicaId)
                .orElseThrow(() -> new ResourceNotFoundException("Paciente", pacienteId));

        if (request.getTratamientoId() != null && request.getConsultaId() != null) {
            throw new BusinessRuleException("VR-CON-005",
                    "No se puede asociar a tratamiento y consulta simultaneamente");
        }

        Map<String, String> snapshot = buildSnapshot(paciente);

        PacienteConsentimiento consentimiento = PacienteConsentimiento.builder()
                .paciente(paciente)
                .clinicaId(clinicaId)
                .template(template)
                .tipo(template.getCodigo())
                .version(template.getVersion())
                .estadoDocumento(EstadoConsentimientoDocumento.BORRADOR)
                .tratamientoId(request.getTratamientoId())
                .consultaId(request.getConsultaId())
                .ipAddress(request.getIpAddress())
                .userAgent(request.getUserAgent())
                .build();

        PacienteConsentimiento saved = consentimientoRepository.save(consentimiento);

        consentimiento.setId(saved.getId());
        consentimiento.setPaciente(paciente);

        String htmlContent = templateService.loadTemplateContent(templateId);
        Map<String, String> variables = buildVariables(paciente, clinicaId);
        String renderedHtml = replaceVariables(htmlContent, variables);

        ConsentimientoDocumentService.DocumentGenerationResult result =
                documentService.generatePdf(consentimiento, template, renderedHtml,
                        request.getFirmaImagen());

        try {
            saved.setPacienteSnapshot(objectMapper.writeValueAsString(snapshot));
        } catch (Exception e) {
            log.error("Error serializando snapshot del paciente: {}", e.getMessage());
            saved.setPacienteSnapshot("{}");
        }
        saved.setFirmaFecha(Instant.now());
        saved.setStoragePath(result.getStoragePath());
        saved.setNombreArchivo(result.getNombreArchivo());
        saved.setHashDocumento(result.getHashDocumento());
        saved.setTamanoArchivo(result.getTamanoArchivo());
        saved.setEstadoDocumento(EstadoConsentimientoDocumento.FIRMADO);

        PacienteConsentimiento finalSaved = consentimientoRepository.save(saved);

        log.info("Consentimiento firmado: id={}, paciente={}, template={}, hash={}",
                finalSaved.getId(), pacienteId, templateId, result.getHashDocumento());

        return ConsentimientoFirmaResponse.builder()
                .firmado(true)
                .consentimientoId(finalSaved.getId())
                .hashDocumento(result.getHashDocumento())
                .nombreArchivo(result.getNombreArchivo())
                .firmaFecha(finalSaved.getFirmaFecha())
                .build();
    }

    private Map<String, String> buildVariables(Paciente paciente, Long clinicaId) {
        Map<String, String> vars = new LinkedHashMap<>();
        vars.put("nombre_paciente", paciente.getNombres());
        vars.put("apellido_paciente", paciente.getApellidoPaterno());
        vars.put("nombre_completo", paciente.getApellidoPaterno() + " " + paciente.getNombres());
        vars.put("tipo_documento", "ID");
        vars.put("numero_documento", paciente.getLicenciaConducir() != null ? paciente.getLicenciaConducir() : "N/A");
        vars.put("fecha_nacimiento", paciente.getFechaNacimiento() != null
                ? paciente.getFechaNacimiento().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))
                : "N/A");
        vars.put("direccion_completa", buildDireccion(paciente));
        vars.put("direccion_calle", paciente.getDireccionLinea1() != null ? paciente.getDireccionLinea1() : "");
        vars.put("direccion_ciudad", paciente.getCiudad() != null ? paciente.getCiudad() : "");
        vars.put("direccion_estado", paciente.getEstadoProvincia() != null ? paciente.getEstadoProvincia() : "");
        vars.put("direccion_codigo_postal", paciente.getCodigoPostal() != null ? paciente.getCodigoPostal() : "");
        vars.put("telefono", paciente.getTelefono() != null ? paciente.getTelefono() : "N/A");
        vars.put("email", paciente.getEmail() != null ? paciente.getEmail() : "N/A");
        vars.put("sexo", paciente.getSexo() != null ? paciente.getSexo() : "N/A");
        return vars;
    }

    private Map<String, String> buildSnapshot(Paciente paciente) {
        Map<String, String> snapshot = new HashMap<>();
        snapshot.put("nombre", paciente.getNombres());
        snapshot.put("apellido", paciente.getApellidoPaterno());
        snapshot.put("tipoDocumento", "ID");
        snapshot.put("numeroDocumento", paciente.getLicenciaConducir());
        snapshot.put("fechaNacimiento", paciente.getFechaNacimiento() != null
                ? paciente.getFechaNacimiento().toString() : null);
        snapshot.put("direccionLinea1", paciente.getDireccionLinea1());
        snapshot.put("direccionLinea2", paciente.getDireccionLinea2());
        snapshot.put("ciudad", paciente.getCiudad());
        snapshot.put("estadoProvincia", paciente.getEstadoProvincia());
        snapshot.put("codigoPostal", paciente.getCodigoPostal());
        snapshot.put("direccionPais", paciente.getDireccionPais());
        snapshot.put("email", paciente.getEmail());
        snapshot.put("telefono", paciente.getTelefono());
        return snapshot;
    }

    private String replaceVariables(String html, Map<String, String> variables) {
        String result = html;
        for (Map.Entry<String, String> entry : variables.entrySet()) {
            result = result.replace("{{" + entry.getKey() + "}}",
                    entry.getValue() != null ? entry.getValue() : "");
        }
        return result;
    }

    public byte[] loadPdf(Long consentimientoId) {
        Long clinicaId = securityUtils.getCurrentClinicaId();

        PacienteConsentimiento consentimiento = consentimientoRepository
                .findByIdAndClinicaId(consentimientoId, clinicaId)
                .orElseThrow(() -> new ResourceNotFoundException("Consentimiento", consentimientoId));

        if (consentimiento.getStoragePath() == null) {
            throw new BusinessRuleException("VR-CON-007",
                    "El consentimiento no tiene PDF asociado");
        }

        return storageStrategy.load(consentimiento.getStoragePath());
    }

    public String getNombreArchivo(Long consentimientoId) {
        Long clinicaId = securityUtils.getCurrentClinicaId();

        PacienteConsentimiento consentimiento = consentimientoRepository
                .findByIdAndClinicaId(consentimientoId, clinicaId)
                .orElseThrow(() -> new ResourceNotFoundException("Consentimiento", consentimientoId));

        return consentimiento.getNombreArchivo();
    }

    public VerificacionResult verificar(Long consentimientoId) {
        Long clinicaId = securityUtils.getCurrentClinicaId();

        PacienteConsentimiento consentimiento = consentimientoRepository
                .findByIdAndClinicaId(consentimientoId, clinicaId)
                .orElseThrow(() -> new ResourceNotFoundException("Consentimiento", consentimientoId));

        if (consentimiento.getStoragePath() == null) {
            throw new BusinessRuleException("VR-CON-007",
                    "El consentimiento no tiene PDF asociado");
        }

        String hashAlmacenado = consentimiento.getHashDocumento();
        if (hashAlmacenado == null) {
            throw new BusinessRuleException("VR-CON-008",
                    "El consentimiento no tiene hash almacenado");
        }

        String hashCalculado;
        try {
            Path filePath = Paths.get(uploadDir, consentimiento.getStoragePath());
            hashCalculado = documentService.calculateSha256(filePath);
        } catch (Exception e) {
            throw new BusinessRuleException("VR-CON-009",
                    "Error al calcular hash del documento: " + e.getMessage());
        }

        boolean integro = hashAlmacenado.equals(hashCalculado);

        return VerificacionResult.builder()
                .consentimientoId(consentimientoId)
                .hashAlmacenado(hashAlmacenado)
                .hashCalculado(hashCalculado)
                .integro(integro)
                .nombreArchivo(consentimiento.getNombreArchivo())
                .tamanoArchivo(consentimiento.getTamanoArchivo())
                .firmaFecha(consentimiento.getFirmaFecha())
                .estadoDocumento(consentimiento.getEstadoDocumento())
                .build();
    }

    private String buildDireccion(Paciente paciente) {
        StringBuilder sb = new StringBuilder();
        if (paciente.getDireccionLinea1() != null) {
            sb.append(paciente.getDireccionLinea1());
        }
        if (paciente.getCiudad() != null) {
            if (!sb.isEmpty()) sb.append(", ");
            sb.append(paciente.getCiudad());
        }
        if (paciente.getEstadoProvincia() != null) {
            if (!sb.isEmpty()) sb.append(", ");
            sb.append(paciente.getEstadoProvincia());
        }
        if (paciente.getCodigoPostal() != null) {
            if (!sb.isEmpty()) sb.append(" ");
            sb.append(paciente.getCodigoPostal());
        }
        return sb.toString();
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class VerificacionResult {
        private Long consentimientoId;
        private String hashAlmacenado;
        private String hashCalculado;
        private boolean integro;
        private String nombreArchivo;
        private Integer tamanoArchivo;
        private java.time.Instant firmaFecha;
        private EstadoConsentimientoDocumento estadoDocumento;
    }
}
