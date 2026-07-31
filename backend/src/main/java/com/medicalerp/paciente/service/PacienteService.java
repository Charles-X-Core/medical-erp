package com.medicalerp.paciente.service;

import com.medicalerp.clinica.entity.Clinica;
import com.medicalerp.clinica.repository.ClinicaRepository;
import com.medicalerp.common.exception.BusinessRuleException;
import com.medicalerp.common.exception.DuplicateResourceException;
import com.medicalerp.common.exception.ResourceNotFoundException;
import com.medicalerp.common.util.Auditable;
import com.medicalerp.common.util.SecurityUtils;
import com.medicalerp.config.PaisConfig;
import com.medicalerp.config.PaisConfigService;
import com.medicalerp.paciente.dto.*;
import com.medicalerp.paciente.entity.Paciente;
import com.medicalerp.paciente.entity.PacienteConsentimiento;
import com.medicalerp.paciente.entity.PacienteDocumento;
import com.medicalerp.paciente.entity.PacienteSeguro;
import com.medicalerp.paciente.mapper.PacienteConsentimientoMapper;
import com.medicalerp.paciente.mapper.PacienteDocumentoMapper;
import com.medicalerp.paciente.mapper.PacienteMapper;
import com.medicalerp.paciente.mapper.PacienteSeguroMapper;
import com.medicalerp.paciente.repository.PacienteConsentimientoRepository;
import com.medicalerp.paciente.repository.PacienteDocumentoRepository;
import com.medicalerp.paciente.repository.PacienteRepository;
import com.medicalerp.paciente.repository.PacienteSeguroRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Patient Service (DOM-PAC-001)
 * Multi-region, multi-tenant aware.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PacienteService {

    private final PacienteRepository pacienteRepository;
    private final PacienteDocumentoRepository documentoRepository;
    private final PacienteSeguroRepository seguroRepository;
    private final PacienteConsentimientoRepository consentimientoRepository;
    private final PacienteMapper pacienteMapper;
    private final PacienteDocumentoMapper documentoMapper;
    private final PacienteSeguroMapper seguroMapper;
    private final PacienteConsentimientoMapper consentimientoMapper;
    private final SecurityUtils securityUtils;
    private final ClinicaRepository clinicaRepository;
    private final PaisConfigService paisConfigService;

    // ==================== CREATE FULL ====================

    @Transactional
    @Auditable
    public PacienteResponse createCompleto(PacienteCompletoRequest request) {
        Long clinicaId = securityUtils.getCurrentClinicaId();
        if (clinicaId == null) {
            throw new BusinessRuleException("VR-PAC-001", "Usuario sin clínica asignada");
        }

        Clinica clinica = clinicaRepository.findById(clinicaId)
                .orElseThrow(() -> new ResourceNotFoundException("Clínica", clinicaId));

        String pais = clinica.getPais();
        PaisConfig config = paisConfigService.getConfig(pais);

        // Phase 1: validate everything BEFORE any insert
        validarPacienteRequest(request.getPaciente(), pais, config, null, clinicaId);
        validarDocumentos(request.getDocumentos(), pais, config, clinicaId, null);
        validarSeguros(request.getSeguros(), pais, config);
        validarConsentimientos(request.getConsentimientos(), pais, config);

        // Phase 2: insert patient
        Paciente paciente = pacienteMapper.toEntity(request.getPaciente());
        paciente.setClinicaId(clinicaId);
        paciente.setPais(pais);
        paciente.setEstado("activo");
        Paciente savedPaciente = pacienteRepository.save(paciente);

        // Phase 3: insert documents
        if (request.getDocumentos() != null) {
            for (PacienteDocumentoRequest docReq : request.getDocumentos()) {
                PacienteDocumento doc = documentoMapper.toEntity(docReq);
                doc.setPaciente(savedPaciente);
                doc.setClinicaId(clinicaId);
                documentoRepository.save(doc);
            }
        }

        // Phase 4: insert insurance
        if (request.getSeguros() != null) {
            for (PacienteSeguroRequest segReq : request.getSeguros()) {
                PacienteSeguro seguro = seguroMapper.toEntity(segReq);
                seguro.setPaciente(savedPaciente);
                seguro.setClinicaId(clinicaId);
                seguroRepository.save(seguro);
            }
        }

        // Phase 5: insert consent
        if (request.getConsentimientos() != null) {
            for (PacienteConsentimientoRequest conReq : request.getConsentimientos()) {
                PacienteConsentimiento con = consentimientoMapper.toEntity(conReq);
                con.setPaciente(savedPaciente);
                con.setClinicaId(clinicaId);
                consentimientoRepository.save(con);
            }
        }

        return buildFullResponse(savedPaciente);
    }

    // ==================== UPDATE FULL ====================

    @Transactional
    @Auditable
    public PacienteResponse updateCompleto(Long id, PacienteCompletoRequest request) {
        Long clinicaId = securityUtils.getCurrentClinicaId();
        securityUtils.validateClinicaAccessOnWrite(clinicaId);

        Paciente paciente = pacienteRepository.findByIdAndClinicaId(id, clinicaId)
                .orElseThrow(() -> new ResourceNotFoundException("Paciente", id));

        Clinica clinica = clinicaRepository.findById(clinicaId)
                .orElseThrow(() -> new ResourceNotFoundException("Clínica", clinicaId));

        String pais = clinica.getPais();
        PaisConfig config = paisConfigService.getConfig(pais);

        // Phase 1: validate everything BEFORE any insert
        validarPacienteRequest(request.getPaciente(), pais, config, id, clinicaId);
        validarDocumentos(request.getDocumentos(), pais, config, clinicaId, id);
        validarSeguros(request.getSeguros(), pais, config);
        validarConsentimientos(request.getConsentimientos(), pais, config);

        // Phase 2: update patient
        pacienteMapper.updateEntity(paciente, request.getPaciente());
        paciente.setClinicaId(clinicaId);
        paciente.setPais(pais);
        Paciente savedPaciente = pacienteRepository.save(paciente);

        // Phase 3: replace documents (soft-delete old, insert new)
        if (request.getDocumentos() != null) {
            documentoRepository.softDeleteByPacienteId(id);
            for (PacienteDocumentoRequest docReq : request.getDocumentos()) {
                PacienteDocumento doc = documentoMapper.toEntity(docReq);
                doc.setPaciente(savedPaciente);
                doc.setClinicaId(clinicaId);
                documentoRepository.save(doc);
            }
        }

        // Phase 4: replace insurance
        if (request.getSeguros() != null) {
            seguroRepository.softDeleteByPacienteId(id);
            for (PacienteSeguroRequest segReq : request.getSeguros()) {
                PacienteSeguro seguro = seguroMapper.toEntity(segReq);
                seguro.setPaciente(savedPaciente);
                seguro.setClinicaId(clinicaId);
                seguroRepository.save(seguro);
            }
        }

        // Phase 5: replace consent
        if (request.getConsentimientos() != null) {
            consentimientoRepository.softDeleteByPacienteId(id);
            for (PacienteConsentimientoRequest conReq : request.getConsentimientos()) {
                PacienteConsentimiento con = consentimientoMapper.toEntity(conReq);
                con.setPaciente(savedPaciente);
                con.setClinicaId(clinicaId);
                consentimientoRepository.save(con);
            }
        }

        return buildFullResponse(savedPaciente);
    }

    // ==================== BASIC CRUD ====================

    @Transactional
    @Auditable
    public PacienteResponse create(PacienteRequest request) {
        Long clinicaId = securityUtils.getCurrentClinicaId();
        if (clinicaId == null) {
            throw new BusinessRuleException("VR-PAC-001", "Usuario sin clínica asignada");
        }

        Clinica clinica = clinicaRepository.findById(clinicaId)
                .orElseThrow(() -> new ResourceNotFoundException("Clínica", clinicaId));

        PaisConfig config = paisConfigService.getConfig(clinica.getPais());
        validarPacienteRequest(request, clinica.getPais(), config, null, clinicaId);

        Paciente paciente = pacienteMapper.toEntity(request);
        paciente.setClinicaId(clinicaId);
        paciente.setPais(clinica.getPais());
        paciente.setEstado("activo");
        Paciente saved = pacienteRepository.save(paciente);
        return buildFullResponse(saved);
    }

    public PacienteResponse getById(Long id) {
        Long clinicaId = securityUtils.getCurrentClinicaId();
        Paciente paciente = pacienteRepository.findByIdAndClinicaId(id, clinicaId)
                .orElseThrow(() -> new ResourceNotFoundException("Paciente", id));
        return buildFullResponse(paciente);
    }

    public Page<PacienteResponse> getAll(Pageable pageable) {
        Long clinicaId = securityUtils.getCurrentClinicaId();
        return pacienteRepository.findByClinicaId(clinicaId, pageable)
                .map(this::buildFullResponse);
    }

    public Page<PacienteResponse> search(String query, Pageable pageable) {
        Long clinicaId = securityUtils.getCurrentClinicaId();
        return pacienteRepository.searchByClinicaId(clinicaId, query, pageable)
                .map(this::buildFullResponse);
    }

    public Page<PacienteResponse> getByEstado(String estado, Pageable pageable) {
        Long clinicaId = securityUtils.getCurrentClinicaId();
        return pacienteRepository.findByClinicaIdAndEstado(clinicaId, estado, pageable)
                .map(this::buildFullResponse);
    }

    @Transactional
    @Auditable
    public PacienteResponse update(Long id, PacienteRequest request) {
        Long clinicaId = securityUtils.getCurrentClinicaId();
        securityUtils.validateClinicaAccessOnWrite(clinicaId);

        Paciente paciente = pacienteRepository.findByIdAndClinicaId(id, clinicaId)
                .orElseThrow(() -> new ResourceNotFoundException("Paciente", id));

        Clinica clinica = clinicaRepository.findById(clinicaId)
                .orElseThrow(() -> new ResourceNotFoundException("Clínica", clinicaId));

        PaisConfig config = paisConfigService.getConfig(clinica.getPais());
        validarPacienteRequest(request, clinica.getPais(), config, id, clinicaId);

        pacienteMapper.updateEntity(paciente, request);
        paciente.setClinicaId(clinicaId);
        paciente.setPais(clinica.getPais());
        Paciente saved = pacienteRepository.save(paciente);
        return buildFullResponse(saved);
    }

    @Transactional
    @Auditable
    public void delete(Long id) {
        Long clinicaId = securityUtils.getCurrentClinicaId();
        securityUtils.validateClinicaAccessOnWrite(clinicaId);

        Paciente paciente = pacienteRepository.findByIdAndClinicaId(id, clinicaId)
                .orElseThrow(() -> new ResourceNotFoundException("Paciente", id));
        paciente.setEstado("inactivo");
        pacienteRepository.save(paciente);

        // Soft delete sub-entities
        documentoRepository.softDeleteByPacienteId(id);
        seguroRepository.softDeleteByPacienteId(id);
        consentimientoRepository.softDeleteByPacienteId(id);
    }

    // ==================== VALIDATION ====================

    private void validarPacienteRequest(PacienteRequest request, String pais, PaisConfig config, Long excludeId, Long clinicaId) {
        if (request == null) {
            throw new BusinessRuleException("VR-PAC-002", "Datos del paciente son requeridos");
        }

        validarDocumentoPorPais(request.getDni(), request.getTipoDocumento(), pais, config);
        validarFechaNacimiento(request.getFechaNacimiento());

        if (request.getDni() != null && !request.getDni().isBlank()) {
            if (excludeId == null) {
                if (pacienteRepository.existsByDniAndTipoDocumento(request.getDni(), request.getTipoDocumento())) {
                    throw new DuplicateResourceException("dni", request.getDni());
                }
            } else {
                Paciente existing = pacienteRepository.findById(excludeId).orElse(null);
                if (existing != null && !request.getDni().equals(existing.getDni())
                        && pacienteRepository.existsByDniAndTipoDocumento(request.getDni(), request.getTipoDocumento())) {
                    throw new DuplicateResourceException("dni", request.getDni());
                }
            }
        }
    }

    private void validarDocumentos(List<PacienteDocumentoRequest> docs, String pais, PaisConfig config, Long clinicaId, Long pacienteId) {
        if (docs == null || docs.isEmpty()) return;
        if (docs.size() > 10) {
            throw new BusinessRuleException("VR-DOC-010", "Máximo 10 documentos permitidos");
        }

        Set<String> tiposValidos = config.tiposDocumento().stream()
                .map(PaisConfig.TipoDocumentoConfig::codigo)
                .collect(Collectors.toSet());

        long principalCount = 0;
        for (int i = 0; i < docs.size(); i++) {
            PacienteDocumentoRequest doc = docs.get(i);
            if (doc.getTipoDocumento() == null || !tiposValidos.contains(doc.getTipoDocumento())) {
                throw new BusinessRuleException("VR-DOC-001",
                        "Tipo de documento '" + doc.getTipoDocumento() + "' no válido para " + pais);
            }

            PaisConfig.TipoDocumentoConfig tipoConfig = config.tiposDocumento().stream()
                    .filter(t -> t.codigo().equals(doc.getTipoDocumento()))
                    .findFirst()
                    .orElseThrow();

            if (doc.getNumeroDocumento() == null || doc.getNumeroDocumento().isBlank()) {
                throw new BusinessRuleException("VR-DOC-002", "Número de documento es requerido");
            }

            if (doc.getNumeroDocumento().length() > tipoConfig.maxLength()) {
                throw new BusinessRuleException("VR-DOC-003",
                        "El documento no puede exceder " + tipoConfig.maxLength() + " caracteres");
            }

            if (tipoConfig.pattern() != null && !doc.getNumeroDocumento().matches(tipoConfig.pattern())) {
                throw new BusinessRuleException("VR-DOC-004",
                        "Formato inválido para " + tipoConfig.label());
            }

            // Duplicate check within same request
            for (int j = i + 1; j < docs.size(); j++) {
                PacienteDocumentoRequest other = docs.get(j);
                if (doc.getTipoDocumento().equals(other.getTipoDocumento())
                        && doc.getNumeroDocumento().equals(other.getNumeroDocumento())) {
                    throw new BusinessRuleException("VR-DOC-005", "Documento duplicado en la solicitud");
                }
            }

            // Duplicate check against database
            boolean exists = doc.getId() == null
                    ? documentoRepository.existsByNumeroDocumentoAndTipoDocumentoAndClinicaId(
                    doc.getNumeroDocumento(), doc.getTipoDocumento(), clinicaId)
                    : documentoRepository.existsByNumeroDocumentoAndTipoDocumentoAndClinicaIdAndIdNot(
                    doc.getNumeroDocumento(), doc.getTipoDocumento(), clinicaId, doc.getId());
            if (exists) {
                throw new DuplicateResourceException("documento", doc.getTipoDocumento() + " " + doc.getNumeroDocumento());
            }

            if (Boolean.TRUE.equals(doc.getEsPrincipal())) {
                principalCount++;
            }
        }

        if (principalCount > 1) {
            throw new BusinessRuleException("VR-DOC-006", "Solo puede haber un documento principal");
        }
    }

    private void validarSeguros(List<PacienteSeguroRequest> seguros, String pais, PaisConfig config) {
        if (seguros == null || seguros.isEmpty()) {
            if (config.seguroRequerido()) {
                throw new BusinessRuleException("VR-SEG-001", "Al menos un seguro médico es requerido");
            }
            return;
        }

        if (seguros.size() > 5) {
            throw new BusinessRuleException("VR-SEG-010", "Máximo 5 seguros permitidos");
        }

        Set<String> tiposValidos = config.tiposSeguro() != null
                ? Set.copyOf(config.tiposSeguro())
                : Set.of();

        for (PacienteSeguroRequest seguro : seguros) {
            if (seguro.getTipoSeguro() == null || !tiposValidos.contains(seguro.getTipoSeguro())) {
                throw new BusinessRuleException("VR-SEG-002",
                        "Tipo de seguro '" + seguro.getTipoSeguro() + "' no válido");
            }
        }
    }

    private void validarConsentimientos(List<PacienteConsentimientoRequest> consentimientos, String pais, PaisConfig config) {
        if (consentimientos == null || consentimientos.isEmpty()) {
            if (config.consentimiento().requerido()) {
                throw new BusinessRuleException("VR-CON-001", "Los consentimientos son requeridos");
            }
            return;
        }

        if (consentimientos.size() > 10) {
            throw new BusinessRuleException("VR-CON-010", "Máximo 10 consentimientos permitidos");
        }

        Set<String> tiposValidos = config.consentimiento().tipos() != null
                ? config.consentimiento().tipos().stream()
                    .map(PaisConfig.TipoConsentimiento::codigo)
                    .collect(Collectors.toSet())
                : Set.of();

        for (PacienteConsentimientoRequest con : consentimientos) {
            if (con.getTipo() == null || !tiposValidos.contains(con.getTipo())) {
                throw new BusinessRuleException("VR-CON-002",
                        "Tipo de consentimiento '" + con.getTipo() + "' no válido");
            }
        }
    }

    private void validarDocumentoPorPais(String dni, String tipoDocumento, String pais, PaisConfig config) {
        if (dni == null || dni.isBlank()) return;

        String tipo = tipoDocumento != null ? tipoDocumento.toUpperCase() : config.tipoDocumentoDefault();
        Optional<PaisConfig.TipoDocumentoConfig> tipoConfigOpt = config.tiposDocumento().stream()
                .filter(t -> t.codigo().equals(tipo))
                .findFirst();

        if (tipoConfigOpt.isEmpty()) {
            throw new BusinessRuleException("VR-PAC-009",
                    "Tipo de documento '" + tipo + "' no válido para " + pais);
        }

        PaisConfig.TipoDocumentoConfig tipoConfig = tipoConfigOpt.get();
        if (dni.length() > tipoConfig.maxLength()) {
            throw new BusinessRuleException("VR-PAC-010",
                    "El documento no puede exceder " + tipoConfig.maxLength() + " caracteres");
        }

        if (tipoConfig.pattern() != null && !dni.matches(tipoConfig.pattern())) {
            throw new BusinessRuleException("VR-PAC-011",
                    "Formato inválido para " + tipoConfig.label());
        }
    }

    private void validarFechaNacimiento(LocalDate fechaNacimiento) {
        if (fechaNacimiento != null && fechaNacimiento.isAfter(LocalDate.now())) {
            throw new BusinessRuleException("VR-PAC-008", "La fecha de nacimiento no puede ser futura");
        }
    }

    // ==================== BUILDERS ====================

    private PacienteResponse buildFullResponse(Paciente paciente) {
        PacienteResponse response = pacienteMapper.toResponse(paciente);
        response.setDocumentos(
                documentoRepository.findByPacienteIdAndClinicaId(paciente.getId(), paciente.getClinicaId())
                        .stream()
                        .map(documentoMapper::toResponse)
                        .toList()
        );
        response.setSeguros(
                seguroRepository.findByPacienteIdAndClinicaId(paciente.getId(), paciente.getClinicaId())
                        .stream()
                        .map(seguroMapper::toResponse)
                        .toList()
        );
        response.setConsentimientos(
                consentimientoRepository.findByPacienteIdAndClinicaId(paciente.getId(), paciente.getClinicaId())
                        .stream()
                        .map(consentimientoMapper::toResponse)
                        .toList()
        );
        return response;
    }
}
