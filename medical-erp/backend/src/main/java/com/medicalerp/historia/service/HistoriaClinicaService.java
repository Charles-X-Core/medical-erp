package com.medicalerp.historia.service;

import com.medicalerp.common.exception.DuplicateResourceException;
import com.medicalerp.common.exception.ResourceNotFoundException;
import com.medicalerp.common.util.Auditable;
import com.medicalerp.historia.dto.HistoriaClinicaRequest;
import com.medicalerp.historia.dto.HistoriaClinicaResponse;
import com.medicalerp.historia.entity.HistoriaClinica;
import com.medicalerp.historia.mapper.HistoriaClinicaMapper;
import com.medicalerp.historia.repository.HistoriaClinicaRepository;
import com.medicalerp.paciente.entity.Paciente;
import com.medicalerp.paciente.repository.PacienteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Historia Clinica Service
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class HistoriaClinicaService {

    private final HistoriaClinicaRepository historiaRepository;
    private final PacienteRepository pacienteRepository;
    private final HistoriaClinicaMapper historiaMapper;

    @Transactional
    @Auditable
    public HistoriaClinicaResponse create(HistoriaClinicaRequest request) {
        if (historiaRepository.existsByPacienteId(request.getPacienteId())) {
            throw new DuplicateResourceException("paciente_id", request.getPacienteId().toString());
        }

        Paciente paciente = pacienteRepository.findById(request.getPacienteId())
                .orElseThrow(() -> new ResourceNotFoundException("Paciente", request.getPacienteId()));

        HistoriaClinica historia = historiaMapper.toEntity(request);
        historia.setPaciente(paciente);

        // Auto-generate historia number
        if (historia.getNumeroHistoria() == null || historia.getNumeroHistoria().isBlank()) {
            historia.setNumeroHistoria("HCL-" + System.currentTimeMillis());
        }

        HistoriaClinica saved = historiaRepository.save(historia);
        return historiaMapper.toResponse(saved);
    }

    public HistoriaClinicaResponse getById(Long id) {
        HistoriaClinica historia = historiaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("HistoriaClinica", id));
        return historiaMapper.toResponse(historia);
    }

    public HistoriaClinicaResponse getByPacienteId(Long pacienteId) {
        HistoriaClinica historia = historiaRepository.findByPacienteId(pacienteId)
                .orElseThrow(() -> new ResourceNotFoundException("HistoriaClinica del paciente", pacienteId));
        return historiaMapper.toResponse(historia);
    }

    public Page<HistoriaClinicaResponse> listar(Pageable pageable) {
        return historiaRepository.findAll(pageable)
                .map(historiaMapper::toResponse);
    }

    @Transactional
    @Auditable
    public HistoriaClinicaResponse update(Long id, HistoriaClinicaRequest request) {
        HistoriaClinica historia = historiaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("HistoriaClinica", id));

        historiaMapper.updateEntity(historia, request);
        HistoriaClinica saved = historiaRepository.save(historia);
        return historiaMapper.toResponse(saved);
    }

    @Transactional
    public HistoriaClinicaResponse updateAntecedentes(Long id, java.util.Map<String, String> antecedentes) {
        HistoriaClinica historia = historiaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("HistoriaClinica", id));

        if (antecedentes.containsKey("alergiaMedicamentos")) historia.setAlergiaMedicamentos(antecedentes.get("alergiaMedicamentos"));
        if (antecedentes.containsKey("propensionHemorragias")) historia.setPropensionHemorragias(antecedentes.get("propensionHemorragias"));
        if (antecedentes.containsKey("complicacionesAnestesia")) historia.setComplicacionesAnestesia(antecedentes.get("complicacionesAnestesia"));
        if (antecedentes.containsKey("presionArterialMedicacion")) historia.setPresionArterialMedicacion(antecedentes.get("presionArterialMedicacion"));
        if (antecedentes.containsKey("cardiopatiasPersonales")) historia.setCardiopatiasPersonales(antecedentes.get("cardiopatiasPersonales"));
        if (antecedentes.containsKey("cardiopatiasFamiliares")) historia.setCardiopatiasFamiliares(antecedentes.get("cardiopatiasFamiliares"));
        if (antecedentes.containsKey("diabetesPersonal")) historia.setDiabetesPersonal(antecedentes.get("diabetesPersonal"));
        if (antecedentes.containsKey("diabetesFamiliar")) historia.setDiabetesFamiliar(antecedentes.get("diabetesFamiliar"));
        if (antecedentes.containsKey("hepatitis")) historia.setHepatitis(antecedentes.get("hepatitis"));
        if (antecedentes.containsKey("otrasEnfermedades")) historia.setOtrasEnfermedades(antecedentes.get("otrasEnfermedades"));
        if (antecedentes.containsKey("enfermedadActualMedicacion")) historia.setEnfermedadActualMedicacion(antecedentes.get("enfermedadActualMedicacion"));

        HistoriaClinica saved = historiaRepository.save(historia);
        return historiaMapper.toResponse(saved);
    }

}
