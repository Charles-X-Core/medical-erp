package com.medicalerp.tratamiento.service;

import com.medicalerp.common.exception.BusinessRuleException;
import com.medicalerp.common.exception.ResourceNotFoundException;
import com.medicalerp.common.util.JsonMapperHelper;
import com.medicalerp.tratamiento.dto.SesionTratamientoRequest;
import com.medicalerp.tratamiento.dto.SesionTratamientoResponse;
import com.medicalerp.tratamiento.entity.SesionTratamiento;
import com.medicalerp.tratamiento.entity.Tratamiento;
import com.medicalerp.tratamiento.enums.EstadoTratamiento;
import com.medicalerp.tratamiento.enums.TipoCambioClinico;
import com.medicalerp.tratamiento.mapper.SesionTratamientoMapper;
import com.medicalerp.tratamiento.repository.SesionTratamientoRepository;
import com.medicalerp.tratamiento.repository.TratamientoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

/**
 * SesionTratamiento Service (DOM-TRAT-003)
 * Gestion de sesiones de tratamiento
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SesionTratamientoService {

    private final SesionTratamientoRepository sesionRepository;
    private final TratamientoRepository tratamientoRepository;
    private final SesionTratamientoMapper mapper;
    private final HistorialClinicoService historialClinicoService;
    private final JsonMapperHelper jsonHelper;

    @Transactional
    public SesionTratamientoResponse crear(Long tratamientoId, SesionTratamientoRequest request, Long usuarioId) {
        Tratamiento tratamiento = tratamientoRepository.findById(tratamientoId)
                .orElseThrow(() -> new ResourceNotFoundException("Tratamiento", tratamientoId));

        if (tratamiento.getEstado() != EstadoTratamiento.EN_CURSO) {
            throw new BusinessRuleException("BR-TRAT-003",
                    "Solo se pueden crear sesiones en tratamientos activos");
        }

        // Calcular numero de sesion
        int numeroSesion = sesionRepository.countByTratamientoId(tratamientoId) + 1;

        SesionTratamiento sesion = mapper.toEntity(request, jsonHelper);
        sesion.setTratamientoId(tratamientoId);
        sesion.setClinicaId(tratamiento.getClinicaId());
        sesion.setNumeroSesion(numeroSesion);

        SesionTratamiento saved = sesionRepository.save(sesion);

        // Actualizar contador en tratamiento
        tratamiento.setSesionesRealizadas(tratamiento.getSesionesRealizadas() + 1);
        if (saved.getCostoSesion() != null) {
            tratamiento.setCostoTotal(tratamiento.getCostoTotal().add(saved.getCostoSesion()));
        }
        tratamientoRepository.save(tratamiento);

        // Registrar en historial clinico
        historialClinicoService.registrar(
                tratamientoId,
                tratamiento.getClinicaId(),
                TipoCambioClinico.CREACION,
                "Sesion " + numeroSesion,
                null,
                "Sesion creada: " + request.getTipoSesionId(),
                null,
                usuarioId
        );

        return mapper.toResponse(saved, jsonHelper);
    }

    public List<SesionTratamientoResponse> findByTratamientoId(Long tratamientoId) {
        return sesionRepository.findByTratamientoIdOrderByNumeroSesion(tratamientoId)
                .stream()
                .map(s -> mapper.toResponse(s, jsonHelper))
                .toList();
    }

    public SesionTratamientoResponse findById(Long id) {
        SesionTratamiento sesion = sesionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("SesionTratamiento", id));
        return mapper.toResponse(sesion, jsonHelper);
    }

}
