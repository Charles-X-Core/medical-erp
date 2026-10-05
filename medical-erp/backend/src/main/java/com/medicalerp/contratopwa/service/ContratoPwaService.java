package com.medicalerp.contratopwa.service;

import com.medicalerp.common.exception.BusinessRuleException;
import com.medicalerp.common.exception.ResourceNotFoundException;
import com.medicalerp.common.util.BusinessTime;
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
import java.time.Instant;
import java.time.LocalDate;
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
    private final com.medicalerp.storage.StoragePathBuilder pathBuilder;

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

        ConsentTemplate template = resolveTemplate(clinicaId, templateCode, paciente);
        boolean esEspanol = esTemplateEspanol(template);

        String htmlContent = templateService.loadTemplateContent(template.getId());
        Map<String, String> variables = buildVariables(paciente, esEspanol);
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

        Paciente paciente = pacienteRepository.findById(session.getPacienteId())
                .orElseThrow(() -> new ResourceNotFoundException("Paciente", session.getPacienteId()));

        enviarPdfContrato(paciente, session);
    }

    /**
     * Envía por email el último contrato de membresía FIRMADO del paciente.
     * Reutilizado desde el detalle de consentimientos para reenviar el PDF del contrato firmado.
     */
    public void enviarContratoPorEmail(Long pacienteId) {
        Long clinicaId = securityUtils.getCurrentClinicaId();

        Paciente paciente = pacienteRepository.findByIdAndClinicaId(pacienteId, clinicaId)
                .orElseThrow(() -> new ResourceNotFoundException("Paciente", pacienteId));

        List<ContratoSigningSession> firmadas = sessionRepository
                .findByPacienteIdAndClinicaIdAndStatus(pacienteId, clinicaId, "FIRMADO");

        if (firmadas.isEmpty()) {
            throw new BusinessRuleException("CONTRACT_NOT_SIGNED", "El paciente no tiene un contrato de membresía firmado");
        }

        // Tomar la sesión firmada más reciente
        ContratoSigningSession ultima = firmadas.get(firmadas.size() - 1);

        enviarPdfContrato(paciente, ultima);
    }

    private void enviarPdfContrato(Paciente paciente, ContratoSigningSession session) {
        if (!"FIRMADO".equals(session.getStatus())) {
            throw new BusinessRuleException("CONTRACT_NOT_SIGNED", "El contrato aún no ha sido firmado");
        }

        byte[] pdfBytes = contratoStorageService.loadContratoPdf(
                session.getClinicaId(), paciente.getId(), session.getId());

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

        ConsentTemplate template = resolveTemplate(session.getClinicaId(), session.getTemplateCode(), paciente);
        boolean esEspanol = esTemplateEspanol(template);

        String htmlContent = templateService.loadTemplateContent(template.getId());
        Map<String, String> variables = buildVariables(paciente, esEspanol);
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
                    .fechaInicio(LocalDate.now(BusinessTime.ZONE))
                    .fechaFin(java.time.LocalDate.of(2099, 12, 31))
                    .build();
            membresiaService.create(membresiaReq, clinicaId);
            log.info("Membresía VITALICIA creada para paciente {}", pacienteId);
        } catch (Exception e) {
            log.warn("Error creando membresía (puede ya existir): {}", e.getMessage());
        }

        // 2. Buscar template (variante ES si el paciente es de Perú) y generar consentimiento firmado
        Paciente paciente = pacienteRepository.findById(pacienteId)
                .orElseThrow(() -> new ResourceNotFoundException("Paciente", pacienteId));

        ConsentTemplate template = resolveTemplate(clinicaId, session.getTemplateCode(), paciente);
        boolean esEspanol = esTemplateEspanol(template);

        // Usar el template del archivo para generar el PDF (garantiza CSS completo)
        String htmlContent = templateService.loadTemplateContent(template.getId());
        Map<String, String> variables = buildVariables(paciente, esEspanol);
        String renderedHtml = replaceVariables(htmlContent, variables);

        // Si el frontend envía HTML con firma, extraer la imagen de firma e insertarla en el template
        if (htmlContentFromFrontend != null && !htmlContentFromFrontend.isBlank()) {
            String firmaImg = extractFirmaFromHtml(htmlContentFromFrontend);
            if (firmaImg != null) {
                renderedHtml = injectFirmaIntoSigValue(renderedHtml, firmaImg);
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
        session.setSignedAt(Instant.now());
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

    /**
     * Resuelve el template de contrato según el país del paciente.
     *
     * Si el paciente es de Perú ({@code direccionPais = "PE"}) y existe una variante
     * {@code <codigo>_ES} activa para la clínica, se usa esa (contrato en español).
     * En cualquier otro caso se usa el código base (inglés).
     *
     * Nota: la variante debe existir como fila en {@code consent_templates} con el mismo
     * {@code version} ("1.0") y un {@code storage_path} apuntando al archivo ES.
     */
    private ConsentTemplate resolveTemplate(Long clinicaId, String codigoBase, Paciente paciente) {
        String codigo = codigoBase;

        if (paciente != null && "PE".equalsIgnoreCase(paciente.getDireccionPais())) {
            String codigoEs = codigoBase + "_ES";
            boolean existeEs = templateRepository
                    .findByClinicaIdAndCodigoAndVersion(clinicaId, codigoEs, "1.0")
                    .isPresent();
            if (existeEs) {
                codigo = codigoEs;
                log.info("Usando template ES para paciente {} (país PE): {}", paciente.getId(), codigoEs);
            }
        }

        final String codigoResuelto = codigo;
        return templateRepository.findByClinicaIdAndCodigoAndVersion(clinicaId, codigoResuelto, "1.0")
                .orElseThrow(() -> new BusinessRuleException("TEMPLATE_NOT_FOUND",
                        "Template de contrato no encontrado: " + codigoResuelto));
    }

    private boolean esTemplateEspanol(ConsentTemplate template) {
        return template != null && template.getCodigo() != null
                && template.getCodigo().toUpperCase(java.util.Locale.ROOT).endsWith("_ES");
    }

    private Map<String, String> buildVariables(Paciente paciente, boolean esEspanol) {
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
        vars.put("direccion_calle", paciente.getDireccionLinea1() != null ? paciente.getDireccionLinea1() : "");
        vars.put("direccion_ciudad", paciente.getCiudad() != null ? paciente.getCiudad() : "");
        vars.put("direccion_estado", paciente.getEstadoProvincia() != null ? paciente.getEstadoProvincia() : "");
        vars.put("direccion_codigo_postal", paciente.getCodigoPostal() != null ? paciente.getCodigoPostal() : "");
        vars.put("telefono", paciente.getTelefono() != null ? paciente.getTelefono() : "N/A");
        vars.put("email", paciente.getEmail() != null ? paciente.getEmail() : "N/A");
        vars.put("sexo", paciente.getSexo() != null ? paciente.getSexo() : "N/A");

        java.time.LocalDate now = LocalDate.now(BusinessTime.ZONE);
        java.time.format.DateTimeFormatter dayFmt = java.time.format.DateTimeFormatter.ofPattern("d");
        java.time.format.DateTimeFormatter monthFmt = java.time.format.DateTimeFormatter.ofPattern(
                "MMMM", esEspanol ? java.util.Locale.of("es") : java.util.Locale.ENGLISH);
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

    /**
     * Injects the signature image into the LAST .sig-value div in the rendered HTML.
     * If the div contains text like "(Firmar en el kiosco)", it replaces the content.
     * If no .sig-value is found, appends the signature at the end of the body.
     */
    private String injectFirmaIntoSigValue(String html, String firmaBase64) {
        if (html == null || firmaBase64 == null) return html;

        String firmaImgTag = "<img src=\"" + firmaBase64 + "\" " +
                "style=\"width:100%;max-height:120px;display:block;margin:0 auto;\" />";

        // Match the LAST div with class="sig-value" (or class containing sig-value)
        // Pattern: <div class="sig-value"...>content</div>
        java.util.regex.Pattern divPattern = java.util.regex.Pattern.compile(
                "(<div[^>]*class=\"[^\"]*sig-value[^\"]*\"[^>]*>)(.*?)(</div>)",
                java.util.regex.Pattern.CASE_INSENSITIVE | java.util.regex.Pattern.DOTALL);

        java.util.regex.Matcher matcher = divPattern.matcher(html);
        String result = html;
        int lastStart = -1;
        int lastEnd = -1;

        // Find the LAST occurrence
        while (matcher.find()) {
            lastStart = matcher.start();
            lastEnd = matcher.end();
        }

        if (lastStart >= 0) {
            // Extract the opening tag from the original match
            // Re-run matcher to get groups for the last match
            matcher.reset();
            String openTag = null;
            while (matcher.find()) {
                openTag = matcher.group(1);
            }
            if (openTag != null) {
                result = result.substring(0, lastStart) +
                        openTag + firmaImgTag + "</div>" +
                        result.substring(lastEnd);
            }
        } else {
            // Fallback: append before </body>
            if (html.toLowerCase().contains("</body>")) {
                result = html.replace("</body>", firmaImgTag + "</body>");
            } else {
                result = html + firmaImgTag;
            }
        }

        return result;
    }
}
