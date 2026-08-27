package com.medicalerp.paciente.service;

import com.medicalerp.common.exception.ResourceNotFoundException;
import com.medicalerp.common.util.SecurityUtils;
import com.medicalerp.contacto.service.EmailService;
import com.medicalerp.paciente.dto.PacienteConsentimientoRequest;
import com.medicalerp.paciente.dto.PacienteConsentimientoResponse;
import com.medicalerp.paciente.entity.Paciente;
import com.medicalerp.paciente.entity.PacienteConsentimiento;
import com.medicalerp.paciente.mapper.PacienteConsentimientoMapper;
import com.medicalerp.paciente.repository.PacienteConsentimientoRepository;
import com.medicalerp.paciente.repository.PacienteRepository;
import com.medicalerp.storage.StoragePathBuilder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PacienteConsentimientoService {

    private final PacienteConsentimientoRepository consentimientoRepository;
    private final PacienteRepository pacienteRepository;
    private final PacienteConsentimientoMapper consentimientoMapper;
    private final SecurityUtils securityUtils;
    private final EmailService emailService;
    private final StoragePathBuilder pathBuilder;

    @Transactional
    public PacienteConsentimientoResponse create(Long pacienteId, PacienteConsentimientoRequest request) {
        Long clinicaId = securityUtils.getCurrentClinicaId();
        Paciente paciente = pacienteRepository.findByIdAndClinicaId(pacienteId, clinicaId)
                .orElseThrow(() -> new ResourceNotFoundException("Paciente", pacienteId));

        PacienteConsentimiento consentimiento = consentimientoMapper.toEntity(request);
        consentimiento.setPaciente(paciente);
        consentimiento.setClinicaId(clinicaId);
        PacienteConsentimiento saved = consentimientoRepository.save(consentimiento);
        return consentimientoMapper.toResponse(saved);
    }

    @Transactional
    public PacienteConsentimientoResponse update(Long id, PacienteConsentimientoRequest request) {
        Long clinicaId = securityUtils.getCurrentClinicaId();
        securityUtils.validateClinicaAccessOnWrite(clinicaId);

        PacienteConsentimiento consentimiento = consentimientoRepository.findByIdAndClinicaId(id, clinicaId)
                .orElseThrow(() -> new ResourceNotFoundException("Consentimiento", id));
        consentimientoMapper.updateEntity(consentimiento, request);
        PacienteConsentimiento saved = consentimientoRepository.save(consentimiento);
        return consentimientoMapper.toResponse(saved);
    }

    @Transactional
    public void delete(Long id) {
        Long clinicaId = securityUtils.getCurrentClinicaId();
        securityUtils.validateClinicaAccessOnWrite(clinicaId);

        PacienteConsentimiento consentimiento = consentimientoRepository.findByIdAndClinicaId(id, clinicaId)
                .orElseThrow(() -> new ResourceNotFoundException("Consentimiento", id));
        consentimiento.setDeletedAt(LocalDateTime.now());
        consentimientoRepository.save(consentimiento);
    }

    public List<PacienteConsentimientoResponse> getByPacienteId(Long pacienteId) {
        Long clinicaId = securityUtils.getCurrentClinicaId();
        return consentimientoRepository.findByPacienteIdAndClinicaId(pacienteId, clinicaId)
                .stream()
                .map(consentimientoMapper::toResponse)
                .toList();
    }

    public PacienteConsentimientoResponse getById(Long id) {
        Long clinicaId = securityUtils.getCurrentClinicaId();
        PacienteConsentimiento consentimiento = consentimientoRepository.findByIdAndClinicaId(id, clinicaId)
                .orElseThrow(() -> new ResourceNotFoundException("Consentimiento", id));
        return consentimientoMapper.toResponse(consentimiento);
    }

    public void enviarPorEmail(Long consentimientoId, Long pacienteId, String asunto, String mensaje) {
        PacienteConsentimiento consentimiento = consentimientoRepository.findById(consentimientoId)
                .orElseThrow(() -> new ResourceNotFoundException("Consentimiento", consentimientoId));

        Paciente paciente = pacienteRepository.findById(pacienteId)
                .orElseThrow(() -> new ResourceNotFoundException("Paciente", pacienteId));

        String email = paciente.getEmail();
        if (email == null || email.isBlank()) {
            throw new ResourceNotFoundException("El paciente no tiene correo electrónico registrado");
        }

        String pacienteNombre = paciente.getNombres() + " " + paciente.getApellidoPaterno();
        String tipo = consentimiento.getTipo() != null ? consentimiento.getTipo() : "Consentimiento";

        byte[] pdfBytes = null;
        String nombreArchivo = consentimiento.getNombreArchivo() != null ? consentimiento.getNombreArchivo() : "consentimiento.pdf";
        if (consentimiento.getStoragePath() != null && !consentimiento.getStoragePath().isBlank()) {
            try {
                java.nio.file.Path filePath = pathBuilder.getFullStoragePath(consentimiento.getStoragePath());
                if (java.nio.file.Files.exists(filePath)) {
                    pdfBytes = java.nio.file.Files.readAllBytes(filePath);
                    log.info("PDF leído desde {} ({} bytes)", consentimiento.getStoragePath(), pdfBytes.length);
                } else {
                    log.warn("PDF no encontrado en {}", consentimiento.getStoragePath());
                }
            } catch (Exception e) {
                log.error("Error leyendo PDF desde {}: {}", consentimiento.getStoragePath(), e.getMessage());
            }
        }

        emailService.sendConsentimientoPaciente(email, pacienteNombre, tipo, pdfBytes, nombreArchivo, asunto, mensaje);
        log.info("Consentimiento {} enviado por email a {}", consentimientoId, email);
    }
}
