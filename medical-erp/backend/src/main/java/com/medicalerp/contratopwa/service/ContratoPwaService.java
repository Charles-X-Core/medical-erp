package com.medicalerp.contratopwa.service;

import com.medicalerp.common.exception.BusinessRuleException;
import com.medicalerp.common.exception.ResourceNotFoundException;
import com.medicalerp.common.util.SecurityUtils;
import com.medicalerp.contacto.service.EmailService;
import com.medicalerp.contratopwa.dto.ContratoPwaResponse;
import com.medicalerp.contratopwa.entity.ContratoSigningSession;
import com.medicalerp.contratopwa.repository.ContratoSigningSessionRepository;
import com.medicalerp.membresia.dto.MembresiaRequest;
import com.medicalerp.membresia.service.MembresiaService;
import com.medicalerp.paciente.dto.consentimiento.ConsentimientoFirmaRequest;
import com.medicalerp.paciente.dto.consentimiento.ConsentimientoFirmaResponse;
import com.medicalerp.paciente.entity.Paciente;
import com.medicalerp.paciente.entity.consentimiento.ConsentTemplate;
import com.medicalerp.paciente.repository.PacienteRepository;
import com.medicalerp.paciente.repository.consentimiento.ConsentTemplateRepository;
import com.medicalerp.paciente.service.consentimiento.ConsentimientoSignService;
import com.medicalerp.paciente.service.consentimiento.ConsentTemplateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ContratoPwaService {

    private final ContratoSigningSessionRepository sessionRepository;
    private final PacienteRepository pacienteRepository;
    private final ConsentTemplateRepository templateRepository;
    private final ConsentTemplateService templateService;
    private final ConsentimientoSignService signService;
    private final MembresiaService membresiaService;
    private final ContratoStorageService contratoStorageService;
    private final EmailService emailService;
    private final SecurityUtils securityUtils;

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final String TOKEN_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789";

    @Transactional
    public ContratoPwaResponse enviar(Long pacienteId, String templateCode) {
        Long clinicaId = securityUtils.getCurrentClinicaId();

        Paciente paciente = pacienteRepository.findByIdAndClinicaId(pacienteId, clinicaId)
                .orElseThrow(() -> new ResourceNotFoundException("Paciente", pacienteId));

        // Cancelar sesiones PENDIENTE anteriores del mismo paciente
        List<ContratoSigningSession> staleSessions = sessionRepository
                .findByPacienteIdAndClinicaIdAndStatus(pacienteId, clinicaId, "PENDIENTE");
        for (ContratoSigningSession stale : staleSessions) {
            stale.setStatus("EXPIRADO");
        }
        sessionRepository.saveAll(staleSessions);

        String token = generateUniqueToken(clinicaId);

        ContratoSigningSession session = ContratoSigningSession.builder()
                .clinicaId(clinicaId)
                .pacienteId(pacienteId)
                .templateCode(templateCode)
                .signingToken(token)
                .status("PENDIENTE")
                .build();

        session = sessionRepository.save(session);

        log.info("Sesión de firma creada: paciente={}, token={}", pacienteId, token);

        return ContratoPwaResponse.builder()
                .sessionId(session.getId())
                .token(token)
                .status("PENDIENTE")
                .pacienteNombre(paciente.getApellidoPaterno() + " " + paciente.getNombres())
                .pacienteId(pacienteId)
                .mensaje("Contrato enviado a tablet para firma")
                .build();
    }

    public ContratoPwaResponse getPreview(Long pacienteId, String templateCode) {
        Long clinicaId = securityUtils.getCurrentClinicaId();

        Paciente paciente = pacienteRepository.findByIdAndClinicaId(pacienteId, clinicaId)
                .orElseThrow(() -> new ResourceNotFoundException("Paciente", pacienteId));

        ConsentTemplate template = templateRepository.findByClinicaIdAndCodigoAndVersion(
                clinicaId, templateCode, "1.0")
                .orElseThrow(() -> new BusinessRuleException("TEMPLATE_NOT_FOUND",
                        "Template de contrato no encontrado: " + templateCode));

        String htmlContent = templateService.loadTemplateContent(template.getId());
        Map<String, String> variables = buildVariables(paciente);
        String renderedHtml = replaceVariables(htmlContent, variables);

        return ContratoPwaResponse.builder()
                .htmlContent(renderedHtml)
                .pacienteNombre(paciente.getApellidoPaterno() + " " + paciente.getNombres())
                .pacienteId(pacienteId)
                .status("PREVIEW")
                .build();
    }

    public ContratoPwaResponse checkFirmado(Long pacienteId) {
        Long clinicaId = securityUtils.getCurrentClinicaId();

        List<ContratoSigningSession> firmadas = sessionRepository
                .findByPacienteIdAndClinicaIdAndStatus(pacienteId, clinicaId, "FIRMADO");

        if (firmadas.isEmpty()) {
            return ContratoPwaResponse.builder()
                    .status("NO_FIRMADO")
                    .pacienteId(pacienteId)
                    .build();
        }

        ContratoSigningSession ultima = firmadas.get(firmadas.size() - 1);

        return ContratoPwaResponse.builder()
                .sessionId(ultima.getId())
                .status("FIRMADO")
                .pacienteId(pacienteId)
                .contratoStoragePath(ultima.getContratoStoragePath())
                .consentimientoId(ultima.getConsentimientoId())
                .mensaje("Contrato ya firmado")
                .build();
    }

    public void enviarPorEmail(Long sessionId) {
        Long clinicaId = securityUtils.getCurrentClinicaId();
        ContratoSigningSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Sesión de contrato", sessionId));

        if (!session.getClinicaId().equals(clinicaId)) {
            throw new BusinessRuleException("SESSION_FORBIDDEN", "No tienes acceso a esta sesión");
        }

        if (!"FIRMADO".equals(session.getStatus())) {
            throw new BusinessRuleException("CONTRACT_NOT_SIGNED", "El contrato aún no ha sido firmado");
        }

        Paciente paciente = pacienteRepository.findById(session.getPacienteId())
                .orElseThrow(() -> new ResourceNotFoundException("Paciente", session.getPacienteId()));

        byte[] pdfBytes = contratoStorageService.loadContratoPdf(
                clinicaId, paciente.getId(), sessionId);

        if (pdfBytes == null || pdfBytes.length == 0) {
            throw new BusinessRuleException("PDF_NOT_FOUND", "No se encontró el PDF del contrato");
        }

        String filename = "Contrato_Membresia_" + paciente.getNombres() + ".pdf";
        emailService.sendContratoFirmado(
                paciente.getEmail(),
                paciente.getApellidoPaterno() + " " + paciente.getNombres(),
                pdfBytes,
                filename);
    }

    public ContratoPwaResponse getSiguiente(Long clinicaId) {
        Optional<ContratoSigningSession> sessionOpt = sessionRepository
                .findFirstByClinicaIdAndStatusOrderByCreatedAtAsc(clinicaId, "PENDIENTE");

        if (sessionOpt.isEmpty()) {
            return ContratoPwaResponse.builder()
                    .status("VACIO")
                    .mensaje("No hay contratos pendientes")
                    .build();
        }

        ContratoSigningSession session = sessionOpt.get();
        Paciente paciente = pacienteRepository.findById(session.getPacienteId()).orElse(null);

        return ContratoPwaResponse.builder()
                .sessionId(session.getId())
                .token(session.getSigningToken())
                .status(session.getStatus())
                .pacienteNombre(paciente != null ? paciente.getApellidoPaterno() + " " + paciente.getNombres() : "N/A")
                .pacienteId(session.getPacienteId())
                .build();
    }

    public ContratoPwaResponse render(String token) {
        ContratoSigningSession session = sessionRepository.findBySigningToken(token)
                .orElseThrow(() -> new BusinessRuleException("TOKEN_INVALID", "Token de firma inválido o expirado"));

        if ("FIRMADO".equals(session.getStatus())) {
            return ContratoPwaResponse.builder()
                    .sessionId(session.getId())
                    .token(token)
                    .status("FIRMADO")
                    .pacienteId(session.getPacienteId())
                    .consentimientoId(session.getConsentimientoId())
                    .contratoStoragePath(session.getContratoStoragePath())
                    .mensaje("Este contrato ya ha sido firmado")
                    .build();
        }

        if ("EXPIRADO".equals(session.getStatus())) {
            return ContratoPwaResponse.builder()
                    .sessionId(session.getId())
                    .token(token)
                    .status("EXPIRADO")
                    .mensaje("Este contrato ha expirado")
                    .build();
        }

        Paciente paciente = pacienteRepository.findById(session.getPacienteId())
                .orElseThrow(() -> new ResourceNotFoundException("Paciente", session.getPacienteId()));

        ConsentTemplate template = templateRepository.findByClinicaIdAndCodigoAndVersion(
                session.getClinicaId(), session.getTemplateCode(), "1.0")
                .orElseThrow(() -> new BusinessRuleException("TEMPLATE_NOT_FOUND",
                        "Template de contrato no encontrado: " + session.getTemplateCode()));

        String htmlContent = templateService.loadTemplateContent(template.getId());
        Map<String, String> variables = buildVariables(paciente);
        String renderedHtml = replaceVariables(htmlContent, variables);

        return ContratoPwaResponse.builder()
                .sessionId(session.getId())
                .token(token)
                .status("PENDIENTE")
                .pacienteNombre(paciente.getApellidoPaterno() + " " + paciente.getNombres())
                .pacienteId(session.getPacienteId())
                .htmlContent(renderedHtml)
                .build();
    }

    @Transactional
    public ContratoPwaResponse firmar(String token, String firmaBase64, String htmlContentFromFrontend) {
        ContratoSigningSession session = sessionRepository.findBySigningToken(token)
                .orElseThrow(() -> new BusinessRuleException("TOKEN_INVALID", "Token de firma inválido"));

        if ("FIRMADO".equals(session.getStatus())) {
            throw new BusinessRuleException("ALREADY_SIGNED", "Este contrato ya ha sido firmado");
        }

        Long clinicaId = session.getClinicaId();
        Long pacienteId = session.getPacienteId();

        // 1. Crear membresía VITALICIA
        try {
            MembresiaRequest membresiaReq = MembresiaRequest.builder()
                    .pacienteId(pacienteId)
                    .tipo("VITALICIA")
                    .fechaInicio(java.time.LocalDate.now())
                    .fechaFin(java.time.LocalDate.of(2099, 12, 31))
                    .build();
            membresiaService.create(membresiaReq, clinicaId);
            log.info("Membresía VITALICIA creada para paciente {}", pacienteId);
        } catch (Exception e) {
            log.warn("Error creando membresía (puede ya existir): {}", e.getMessage());
        }

        // 2. Buscar template y generar consentimiento firmado
        ConsentTemplate template = templateRepository.findByClinicaIdAndCodigoAndVersion(
                clinicaId, session.getTemplateCode(), "1.0")
                .orElseThrow(() -> new BusinessRuleException("TEMPLATE_NOT_FOUND",
                        "Template no encontrado: " + session.getTemplateCode()));

        Paciente paciente = pacienteRepository.findById(pacienteId)
                .orElseThrow(() -> new ResourceNotFoundException("Paciente", pacienteId));

        // Usar el template del archivo para generar el PDF (garantiza CSS completo)
        String htmlContent = templateService.loadTemplateContent(template.getId());
        Map<String, String> variables = buildVariables(paciente);
        String renderedHtml = replaceVariables(htmlContent, variables);

        // Si el frontend envía HTML con firma, extraer la imagen de firma e insertarla en el template
        if (htmlContentFromFrontend != null && !htmlContentFromFrontend.isBlank()) {
            String firmaImg = extractFirmaFromHtml(htmlContentFromFrontend);
            if (firmaImg != null) {
                renderedHtml = renderedHtml.replace("{{firma_imagen}}", firmaImg);
            }
        }

        // 3. Firmar via ConsentimientoSignService
        ConsentimientoFirmaRequest firmaReq = ConsentimientoFirmaRequest.builder()
                .firmaImagen(firmaBase64)
                .ipAddress("kiosco-pwa")
                .userAgent("ContratoPWA-Kiosk")
                .build();

        ConsentimientoFirmaResponse firmaResp = signService.firmar(
                template.getId(), pacienteId, firmaReq);

        // 4. Guardar contrato en almacenamiento dedicado (PDF + firma.png + metadata.json)
        String contratoPath = contratoStorageService.saveContrato(
                session, paciente, firmaBase64, renderedHtml);

        // 5. Actualizar sesión
        session.setStatus("FIRMADO");
        session.setConsentimientoId(firmaResp.getConsentimientoId());
        session.setSignedAt(LocalDateTime.now());
        session.setContratoStoragePath(contratoPath);
        sessionRepository.save(session);

        // 6. Enviar contrato firmado por email al paciente
        if (contratoPath != null && paciente.getEmail() != null && !paciente.getEmail().isBlank()) {
            try {
                byte[] pdfBytes = contratoStorageService.loadContratoPdf(
                        clinicaId, pacienteId, session.getId());
                String filename = "Contrato_Membresia_" + paciente.getNombres() + ".pdf";
                emailService.sendContratoFirmado(
                        paciente.getEmail(),
                        paciente.getApellidoPaterno() + " " + paciente.getNombres(),
                        pdfBytes,
                        filename);
            } catch (Exception e) {
                log.warn("Error enviando contrato por email (no critico): {}", e.getMessage());
            }
        }

        log.info("Contrato firmado y almacenado: paciente={}, token={}, consentimiento={}, path={}",
                pacienteId, token, firmaResp.getConsentimientoId(), contratoPath);

        return ContratoPwaResponse.builder()
                .sessionId(session.getId())
                .token(token)
                .status("FIRMADO")
                .pacienteNombre(paciente.getApellidoPaterno() + " " + paciente.getNombres())
                .pacienteId(pacienteId)
                .consentimientoId(firmaResp.getConsentimientoId())
                .contratoStoragePath(contratoPath)
                .mensaje("Contrato firmado exitosamente")
                .build();
    }

    public ContratoPwaResponse getStatus(String token) {
        ContratoSigningSession session = sessionRepository.findBySigningToken(token)
                .orElseThrow(() -> new BusinessRuleException("TOKEN_INVALID", "Token inválido"));

        return ContratoPwaResponse.builder()
                .sessionId(session.getId())
                .token(token)
                .status(session.getStatus())
                .pacienteId(session.getPacienteId())
                .consentimientoId(session.getConsentimientoId())
                .contratoStoragePath(session.getContratoStoragePath())
                .build();
    }

    private Map<String, String> buildVariables(Paciente paciente) {
        Map<String, String> vars = new LinkedHashMap<>();
        vars.put("nombre_paciente", paciente.getNombres());
        vars.put("apellido_paciente", paciente.getApellidoPaterno() != null ? paciente.getApellidoPaterno() : "");
        vars.put("nombre_completo",
                (paciente.getApellidoPaterno() != null ? paciente.getApellidoPaterno() + " " : "")
                + (paciente.getNombres() != null ? paciente.getNombres() : ""));
        vars.put("tipo_documento", "ID");
        vars.put("numero_documento", paciente.getLicenciaConducir() != null ? paciente.getLicenciaConducir() : "N/A");
        vars.put("fecha_nacimiento", paciente.getFechaNacimiento() != null
                ? paciente.getFechaNacimiento().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) : "N/A");
        vars.put("direccion_completa", buildDireccion(paciente));
        vars.put("telefono", paciente.getTelefono() != null ? paciente.getTelefono() : "N/A");
        vars.put("email", paciente.getEmail() != null ? paciente.getEmail() : "N/A");
        vars.put("sexo", paciente.getSexo() != null ? paciente.getSexo() : "N/A");

        java.time.LocalDate now = java.time.LocalDate.now();
        java.time.format.DateTimeFormatter dayFmt = java.time.format.DateTimeFormatter.ofPattern("d");
        java.time.format.DateTimeFormatter monthFmt = java.time.format.DateTimeFormatter.ofPattern("MMMM", java.util.Locale.ENGLISH);
        java.time.format.DateTimeFormatter yearFmt = java.time.format.DateTimeFormatter.ofPattern("yyyy");
        vars.put("fecha_dia", now.format(dayFmt));
        vars.put("fecha_mes", now.format(monthFmt));
        vars.put("fecha_anio", now.format(yearFmt));

        return vars;
    }

    private String buildDireccion(Paciente paciente) {
        StringBuilder sb = new StringBuilder();
        if (paciente.getDireccionLinea1() != null) sb.append(paciente.getDireccionLinea1());
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

    private String replaceVariables(String html, Map<String, String> variables) {
        String result = html;
        for (Map.Entry<String, String> entry : variables.entrySet()) {
            result = result.replace("{{" + entry.getKey() + "}}",
                    entry.getValue() != null ? entry.getValue() : "");
        }
        return result;
    }

    private String generateToken() {
        StringBuilder sb = new StringBuilder(8);
        for (int i = 0; i < 8; i++) {
            sb.append(TOKEN_CHARS.charAt(RANDOM.nextInt(TOKEN_CHARS.length())));
        }
        return sb.toString();
    }

    private String generateUniqueToken(Long clinicaId) {
        String token;
        int attempts = 0;
        do {
            token = generateToken();
            attempts++;
            if (attempts > 100) {
                throw new BusinessRuleException("TOKEN_GEN", "No se pudo generar token único");
            }
        } while (sessionRepository.findBySigningTokenAndClinicaId(token, clinicaId).isPresent());
        return token;
    }

    /**
     * Extracts the signature image (base64) from the frontend HTML.
     * The frontend embeds the signature as an <img> tag with src="data:image/...".
     */
    private String extractFirmaFromHtml(String html) {
        if (html == null) return null;
        // Look for <img src="data:image/..." pattern
        java.util.regex.Matcher matcher = java.util.regex.Pattern
                .compile("<img[^>]+src=[\"'](data:image/[^\"']+)[\"']", java.util.regex.Pattern.CASE_INSENSITIVE)
                .matcher(html);
        if (matcher.find()) {
            return matcher.group(1);
        }
        return null;
    }
}
