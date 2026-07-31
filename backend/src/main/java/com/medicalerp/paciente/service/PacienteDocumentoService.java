package com.medicalerp.paciente.service;

import com.medicalerp.common.exception.ResourceNotFoundException;
import com.medicalerp.common.util.SecurityUtils;
import com.medicalerp.paciente.dto.PacienteDocumentoRequest;
import com.medicalerp.paciente.dto.PacienteDocumentoResponse;
import com.medicalerp.paciente.entity.Paciente;
import com.medicalerp.paciente.entity.PacienteDocumento;
import com.medicalerp.paciente.mapper.PacienteDocumentoMapper;
import com.medicalerp.paciente.repository.PacienteDocumentoRepository;
import com.medicalerp.paciente.repository.PacienteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PacienteDocumentoService {

    private final PacienteDocumentoRepository documentoRepository;
    private final PacienteRepository pacienteRepository;
    private final PacienteDocumentoMapper documentoMapper;
    private final SecurityUtils securityUtils;

    @Transactional
    public PacienteDocumentoResponse create(Long pacienteId, PacienteDocumentoRequest request) {
        Long clinicaId = securityUtils.getCurrentClinicaId();
        Paciente paciente = pacienteRepository.findByIdAndClinicaId(pacienteId, clinicaId)
                .orElseThrow(() -> new ResourceNotFoundException("Paciente", pacienteId));

        PacienteDocumento documento = documentoMapper.toEntity(request);
        documento.setPaciente(paciente);
        documento.setClinicaId(clinicaId);
        PacienteDocumento saved = documentoRepository.save(documento);
        return documentoMapper.toResponse(saved);
    }

    @Transactional
    public PacienteDocumentoResponse update(Long id, PacienteDocumentoRequest request) {
        Long clinicaId = securityUtils.getCurrentClinicaId();
        securityUtils.validateClinicaAccessOnWrite(clinicaId);

        PacienteDocumento documento = documentoRepository.findByIdAndClinicaId(id, clinicaId)
                .orElseThrow(() -> new ResourceNotFoundException("Documento", id));
        documentoMapper.updateEntity(documento, request);
        PacienteDocumento saved = documentoRepository.save(documento);
        return documentoMapper.toResponse(saved);
    }

    @Transactional
    public void delete(Long id) {
        Long clinicaId = securityUtils.getCurrentClinicaId();
        securityUtils.validateClinicaAccessOnWrite(clinicaId);

        PacienteDocumento documento = documentoRepository.findByIdAndClinicaId(id, clinicaId)
                .orElseThrow(() -> new ResourceNotFoundException("Documento", id));
        documento.setDeletedAt(LocalDateTime.now());
        documentoRepository.save(documento);
    }

    public List<PacienteDocumentoResponse> getByPacienteId(Long pacienteId) {
        Long clinicaId = securityUtils.getCurrentClinicaId();
        return documentoRepository.findByPacienteIdAndClinicaId(pacienteId, clinicaId)
                .stream()
                .map(documentoMapper::toResponse)
                .toList();
    }

    public PacienteDocumentoResponse getById(Long id) {
        Long clinicaId = securityUtils.getCurrentClinicaId();
        PacienteDocumento documento = documentoRepository.findByIdAndClinicaId(id, clinicaId)
                .orElseThrow(() -> new ResourceNotFoundException("Documento", id));
        return documentoMapper.toResponse(documento);
    }
}
