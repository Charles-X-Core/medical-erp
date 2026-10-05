package com.medicalerp.tratamiento.service;

import com.medicalerp.common.exception.BusinessRuleException;
import com.medicalerp.common.exception.ResourceNotFoundException;
import com.medicalerp.common.util.JsonMapperHelper;
import com.medicalerp.common.valueobject.SignosVitales;
import com.medicalerp.cita.entity.Cita;
import com.medicalerp.cita.repository.CitaRepository;
import com.medicalerp.paciente.entity.Paciente;
import com.medicalerp.paciente.repository.PacienteRepository;
import com.medicalerp.tratamiento.dto.SesionTratamientoRequest;
import com.medicalerp.tratamiento.dto.SesionTratamientoResponse;
import com.medicalerp.tratamiento.entity.SesionTratamiento;
import com.medicalerp.tratamiento.entity.TipoSesionTratamiento;
import com.medicalerp.tratamiento.entity.Tratamiento;
import com.medicalerp.tratamiento.enums.EstadoTratamiento;
import com.medicalerp.tratamiento.enums.TipoCambioClinico;
import com.medicalerp.tratamiento.mapper.SesionTratamientoMapper;
import com.medicalerp.tratamiento.repository.SesionTratamientoRepository;
import com.medicalerp.tratamiento.repository.TratamientoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
@Slf4j
public class SesionTratamientoService {

    private final SesionTratamientoRepository sesionRepository;
    private final TratamientoRepository tratamientoRepository;
    private final CitaRepository citaRepository;
    private final SesionTratamientoMapper mapper;
    private final HistorialClinicoService historialClinicoService;
    private final TipoSesionTratamientoService tipoSesionService;
    private final JsonMapperHelper jsonHelper;
    private final PacienteRepository pacienteRepository;

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

        // Si la sesión viene vinculada a una cita, validar que la cita corresponda al tratamiento
        // y usar su fecha/hora para la sesión (la sesión se ejecuta cuando llega el horario de la cita).
        if (request.getCitaId() != null) {
            Cita cita = citaRepository.findById(request.getCitaId()).orElse(null);
            if (cita == null) {
                throw new BusinessRuleException("BR-TRAT-SES-CITA",
                        "La cita vinculada a la sesión no existe");
            }
            if (cita.getTratamientoId() != null && !cita.getTratamientoId().equals(tratamientoId)) {
                throw new BusinessRuleException("BR-TRAT-SES-CITA",
                        "La cita vinculada no pertenece a este tratamiento");
            }
        }

        SesionTratamiento sesion = mapper.toEntity(request, jsonHelper);
        sesion.setTratamientoId(tratamientoId);
        sesion.setClinicaId(tratamiento.getClinicaId());
        sesion.setNumeroSesion(numeroSesion);

        SesionTratamiento saved = sesionRepository.save(sesion);

        // Actualizar peso/talla del Paciente desde los signos vitales de la sesión
        actualizarPesoTallaPaciente(tratamiento.getPacienteId(), saved.getSignosVitales());

        // Actualizar contador en tratamiento
        tratamiento.setSesionesRealizadas(tratamiento.getSesionesRealizadas() + 1);
        if (saved.getCostoSesion() != null) {
            tratamiento.setCostoTotal(tratamiento.getCostoTotal().add(saved.getCostoSesion()));
        }
        tratamientoRepository.save(tratamiento);

        // Registrar en historial clinico con nombre del tipo de sesion
        String nombreTipoSesion = "Sesion " + numeroSesion;
        try {
            TipoSesionTratamiento tipoSesion = tipoSesionService.findById(request.getTipoSesionId());
            if (tipoSesion != null) {
                nombreTipoSesion = tipoSesion.getNombre();
            }
        } catch (Exception e) {
            // Si no encuentra el tipo, usa el nombre por defecto
        }

        historialClinicoService.registrar(
                tratamientoId,
                tratamiento.getClinicaId(),
                TipoCambioClinico.CREACION,
                "Sesion " + numeroSesion,
                null,
                nombreTipoSesion,
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

    /**
     * Actualiza el peso y estatura del Paciente desde el JSON de signos vitales.
     */
    private void actualizarPesoTallaPaciente(Long pacienteId, String signosVitalesJson) {
        if (pacienteId == null || signosVitalesJson == null || signosVitalesJson.isBlank()) return;
        try {
            Paciente paciente = pacienteRepository.findById(pacienteId).orElse(null);
            if (paciente == null) return;

            SignosVitales sv = jsonHelper.fromJson(signosVitalesJson, SignosVitales.class);
            boolean changed = false;
            if (sv.getPeso() != null && !sv.getPeso().equals(paciente.getPeso())) {
                paciente.setPeso(sv.getPeso());
                changed = true;
            }
            if (sv.getTalla() != null) {
                double tallaAsDouble = sv.getTalla().doubleValue();
                if (!Double.valueOf(tallaAsDouble).equals(paciente.getEstatura())) {
                    paciente.setEstatura(tallaAsDouble);
                    changed = true;
                }
            }
            if (changed) {
                pacienteRepository.save(paciente);
            }
        } catch (Exception e) {
            log.warn("No se pudo actualizar peso/talla del paciente {}: {}", pacienteId, e.getMessage());
        }
    }

}
