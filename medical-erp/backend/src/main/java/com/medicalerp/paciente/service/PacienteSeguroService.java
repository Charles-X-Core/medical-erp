package com.medicalerp.paciente.service;

import com.medicalerp.common.exception.ResourceNotFoundException;
import com.medicalerp.common.util.SecurityUtils;
import com.medicalerp.paciente.dto.PacienteSeguroRequest;
import com.medicalerp.paciente.dto.PacienteSeguroResponse;
import com.medicalerp.paciente.entity.Paciente;
import com.medicalerp.paciente.entity.PacienteSeguro;
import com.medicalerp.paciente.mapper.PacienteSeguroMapper;
import com.medicalerp.paciente.repository.PacienteRepository;
import com.medicalerp.paciente.repository.PacienteSeguroRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PacienteSeguroService {

    private final PacienteSeguroRepository seguroRepository;
    private final PacienteRepository pacienteRepository;
    private final PacienteSeguroMapper seguroMapper;
    private final SecurityUtils securityUtils;

    @Transactional
    public PacienteSeguroResponse create(Long pacienteId, PacienteSeguroRequest request) {
        Long clinicaId = securityUtils.getCurrentClinicaId();
        Paciente paciente = pacienteRepository.findByIdAndClinicaId(pacienteId, clinicaId)
                .orElseThrow(() -> new ResourceNotFoundException("Paciente", pacienteId));

        PacienteSeguro seguro = seguroMapper.toEntity(request);
        seguro.setPaciente(paciente);
        seguro.setClinicaId(clinicaId);
        PacienteSeguro saved = seguroRepository.save(seguro);
        return seguroMapper.toResponse(saved);
    }

    @Transactional
    public PacienteSeguroResponse update(Long id, PacienteSeguroRequest request) {
        Long clinicaId = securityUtils.getCurrentClinicaId();
        securityUtils.validateClinicaAccessOnWrite(clinicaId);

        PacienteSeguro seguro = seguroRepository.findByIdAndClinicaId(id, clinicaId)
                .orElseThrow(() -> new ResourceNotFoundException("Seguro", id));
        seguroMapper.updateEntity(seguro, request);
        PacienteSeguro saved = seguroRepository.save(seguro);
        return seguroMapper.toResponse(saved);
    }

    @Transactional
    public void delete(Long id) {
        Long clinicaId = securityUtils.getCurrentClinicaId();
        securityUtils.validateClinicaAccessOnWrite(clinicaId);

        PacienteSeguro seguro = seguroRepository.findByIdAndClinicaId(id, clinicaId)
                .orElseThrow(() -> new ResourceNotFoundException("Seguro", id));
        seguro.setDeletedAt(LocalDateTime.now());
        seguroRepository.save(seguro);
    }

    public List<PacienteSeguroResponse> getByPacienteId(Long pacienteId) {
        Long clinicaId = securityUtils.getCurrentClinicaId();
        return seguroRepository.findByPacienteIdAndClinicaId(pacienteId, clinicaId)
                .stream()
                .map(seguroMapper::toResponse)
                .toList();
    }

    public PacienteSeguroResponse getById(Long id) {
        Long clinicaId = securityUtils.getCurrentClinicaId();
        PacienteSeguro seguro = seguroRepository.findByIdAndClinicaId(id, clinicaId)
                .orElseThrow(() -> new ResourceNotFoundException("Seguro", id));
        return seguroMapper.toResponse(seguro);
    }
}
