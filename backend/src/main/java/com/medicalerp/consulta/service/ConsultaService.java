package com.medicalerp.consulta.service;

import com.medicalerp.common.exception.BusinessRuleException;
import com.medicalerp.common.exception.ResourceNotFoundException;
import com.medicalerp.common.util.Auditable;
import com.medicalerp.common.util.JsonMapperHelper;
import com.medicalerp.consulta.dto.ConsultaRequest;
import com.medicalerp.consulta.dto.ConsultaResponse;
import com.medicalerp.consulta.entity.Consulta;
import com.medicalerp.consulta.mapper.ConsultaMapper;
import com.medicalerp.consulta.repository.ConsultaRepository;
import com.medicalerp.historia.entity.HistoriaClinica;
import com.medicalerp.historia.repository.HistoriaClinicaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Consulta Service (DOM-CON-001)
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ConsultaService {

    private final ConsultaRepository consultaRepository;
    private final HistoriaClinicaRepository historiaRepository;
    private final ConsultaMapper consultaMapper;
    private final JsonMapperHelper jsonHelper;

    @Transactional
    @Auditable
    public ConsultaResponse create(ConsultaRequest request) {
        if (request.getFecha().isAfter(LocalDateTime.now())) {
            throw new BusinessRuleException("VR-CON-003", "La fecha no puede ser futura");
        }

        HistoriaClinica historia = historiaRepository.findById(request.getHistoriaId())
                .orElseThrow(() -> new ResourceNotFoundException("HistoriaClinica", request.getHistoriaId()));

        Consulta consulta = consultaMapper.toEntity(request, jsonHelper);
        consulta.setHistoria(historia);
        consulta.setFirmado(false);

        Consulta saved = consultaRepository.save(consulta);
        return consultaMapper.toResponse(saved, jsonHelper);
    }

    public ConsultaResponse getById(Long id) {
        Consulta consulta = consultaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Consulta", id));
        return consultaMapper.toResponse(consulta, jsonHelper);
    }

    public Page<ConsultaResponse> getByHistoria(Long historiaId, Pageable pageable) {
        return consultaRepository.findByHistoriaId(historiaId, pageable)
                .map(c -> consultaMapper.toResponse(c, jsonHelper));
    }

    public List<ConsultaResponse> getByPacienteId(Long pacienteId) {
        return consultaRepository.findByPacienteId(pacienteId)
                .stream()
                .map(c -> consultaMapper.toResponse(c, jsonHelper))
                .toList();
    }

    @Transactional
    @Auditable
    public ConsultaResponse update(Long id, ConsultaRequest request) {
        Consulta consulta = consultaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Consulta", id));

        if (Boolean.TRUE.equals(consulta.getFirmado())) {
            throw new BusinessRuleException("CONSULTA_SIGNED", "No se puede modificar una consulta firmada");
        }

        if (request.getFecha().isAfter(LocalDateTime.now())) {
            throw new BusinessRuleException("VR-CON-003", "La fecha no puede ser futura");
        }

        consultaMapper.updateEntity(consulta, request, jsonHelper);
        Consulta saved = consultaRepository.save(consulta);
        return consultaMapper.toResponse(saved, jsonHelper);
    }

    @Transactional
    @Auditable
    public void delete(Long id) {
        Consulta consulta = consultaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Consulta", id));

        if (Boolean.TRUE.equals(consulta.getFirmado())) {
            throw new BusinessRuleException("CONSULTA_SIGNED", "No se puede eliminar una consulta firmada");
        }

        consultaRepository.delete(consulta);
    }

    @Transactional
    @Auditable
    public ConsultaResponse firmar(Long id) {
        Consulta consulta = consultaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Consulta", id));

        consulta.setFirmado(true);
        consulta.setFirmadoAt(LocalDateTime.now());
        Consulta saved = consultaRepository.save(consulta);
        return consultaMapper.toResponse(saved, jsonHelper);
    }

}
