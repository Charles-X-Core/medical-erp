package com.medicalerp.paciente.service;

import com.medicalerp.common.exception.ResourceNotFoundException;
import com.medicalerp.common.util.SecurityUtils;
import com.medicalerp.paciente.dto.PacienteConsentimientoRequest;
import com.medicalerp.paciente.dto.PacienteConsentimientoResponse;
import com.medicalerp.paciente.entity.Paciente;
import com.medicalerp.paciente.entity.PacienteConsentimiento;
import com.medicalerp.paciente.mapper.PacienteConsentimientoMapper;
import com.medicalerp.paciente.repository.PacienteConsentimientoRepository;
import com.medicalerp.paciente.repository.PacienteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PacienteConsentimientoService {

    private final PacienteConsentimientoRepository consentimientoRepository;
    private final PacienteRepository pacienteRepository;
    private final PacienteConsentimientoMapper consentimientoMapper;
    private final SecurityUtils securityUtils;

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
}
