package com.medicalerp.tratamiento.service;

import com.medicalerp.common.exception.BusinessRuleException;
import com.medicalerp.common.exception.ResourceNotFoundException;
import com.medicalerp.common.util.BusinessTime;
import com.medicalerp.common.util.SecurityUtils;
import com.medicalerp.tratamiento.dto.*;
import com.medicalerp.tratamiento.entity.Tratamiento;
import com.medicalerp.tratamiento.enums.EstadoTratamiento;
import com.medicalerp.tratamiento.enums.TipoCambioAdministrativo;
import com.medicalerp.tratamiento.mapper.TratamientoMapper;
import com.medicalerp.tratamiento.repository.TratamientoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;

/**
 * Tratamiento Service (DOM-TRAT-001)
 * Máquina de estados:
 *   PENDIENTE → PROGRAMADO → EN_CURSO → FINALIZADO
 *                   ↓           ↓
 *                CANCELADO   PAUSADO → EN_CURSO
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TratamientoService {

    private final TratamientoRepository repository;
    private final TratamientoMapper mapper;
    private final ProtocoloClinicoService protocoloService;
    private final HistorialClinicoService historialClinicoService;
    private final HistorialAdministrativoService historialAdminService;
    private final SecurityUtils securityUtils;

    private static final List<EstadoTratamiento> ESTADOS_ACTIVOS = Arrays.asList(
            EstadoTratamiento.PENDIENTE,
            EstadoTratamiento.PROGRAMADO,
            EstadoTratamiento.EN_CURSO,
            EstadoTratamiento.PAUSADO
    );

    @Transactional
    public TratamientoResponse crear(TratamientoRequest request) {
        Long clinicaId = securityUtils.getCurrentClinicaId();
        Long usuarioId = securityUtils.getCurrentUserId();

        long count = repository.countByPacienteIdAndTipoTratamientoAndEstadoIn(
                request.getPacienteId(), request.getTipoTratamiento(), ESTADOS_ACTIVOS);
        if (count > 0) {
            throw new BusinessRuleException("BR-TRAT-001",
                    "Ya existe un tratamiento activo del tipo '" + request.getTipoTratamiento() + "' para este paciente");
        }

        Tratamiento tratamiento = mapper.toEntity(request);
        tratamiento.setClinicaId(clinicaId);
        if (request.getUsuarioAsignadoId() != null) {
            tratamiento.setUsuarioAsignadoId(request.getUsuarioAsignadoId());
        } else {
            tratamiento.setUsuarioAsignadoId(usuarioId);
        }

        Tratamiento saved = repository.save(tratamiento);

        historialAdminService.registrar(
                saved.getId(), clinicaId,
                TipoCambioAdministrativo.CREACION,
                "Tratamiento", null,
                "Tipo: " + saved.getTipoTratamiento(),
                null, usuarioId
        );

        return mapper.toResponse(saved);
    }

    public TratamientoResponse getById(Long id) {
        Tratamiento tratamiento = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tratamiento", id));
        return mapper.toResponse(tratamiento);
    }

    public Page<TratamientoResponse> getAll(Long clinicaId, Pageable pageable) {
        return repository.findByClinicaId(clinicaId, pageable).map(mapper::toResponse);
    }

    public Page<TratamientoResponse> getByEstado(Long clinicaId, EstadoTratamiento estado, Pageable pageable) {
        return repository.findByClinicaIdAndEstado(clinicaId, estado, pageable).map(mapper::toResponse);
    }

    public Page<TratamientoResponse> getByPaciente(Long clinicaId, Long pacienteId, Pageable pageable) {
        return repository.findByClinicaIdAndPacienteId(clinicaId, pacienteId, pageable).map(mapper::toResponse);
    }

    public List<TratamientoResponse> getActivos(Long clinicaId) {
        return repository.findByClinicaIdAndEstado(clinicaId, EstadoTratamiento.EN_CURSO)
                .stream()
                .map(mapper::toResponse)
                .toList();
    }

    public Page<TratamientoResponse> search(Long clinicaId, String query, Pageable pageable) {
        return repository.searchByClinicaId(clinicaId, query, pageable).map(mapper::toResponse);
    }

    /**
     * Programar tratamiento: PENDIENTE → PROGRAMADO
     */
    @Transactional
    public TratamientoResponse programar(Long id, Long usuarioId) {
        Tratamiento tratamiento = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tratamiento", id));

        if (tratamiento.getEstado() != EstadoTratamiento.PENDIENTE) {
            throw new BusinessRuleException("BR-TRAT-002",
                    "Solo se puede programar un tratamiento en estado PENDIENTE");
        }

        String estadoAnterior = tratamiento.getEstado().name();
        tratamiento.setEstado(EstadoTratamiento.PROGRAMADO);
        historialAdminService.registrar(id, tratamiento.getClinicaId(),
                TipoCambioAdministrativo.CAMBIO_ESTADO, "estado",
                estadoAnterior, "PROGRAMADO", null, usuarioId);

        Tratamiento saved = repository.save(tratamiento);
        return mapper.toResponse(saved);
    }

    /**
     * Iniciar tratamiento: PROGRAMADO → EN_CURSO
     */
    @Transactional
    public TratamientoResponse iniciar(Long id, Long usuarioId) {
        Tratamiento tratamiento = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tratamiento", id));

        if (tratamiento.getEstado() != EstadoTratamiento.PROGRAMADO) {
            throw new BusinessRuleException("BR-TRAT-003",
                    "Solo se puede iniciar un tratamiento en estado PROGRAMADO");
        }

        String estadoAnterior = tratamiento.getEstado().name();
        tratamiento.setEstado(EstadoTratamiento.EN_CURSO);
        tratamiento.setFechaInicio(LocalDate.now(BusinessTime.ZONE));
        historialAdminService.registrar(id, tratamiento.getClinicaId(),
                TipoCambioAdministrativo.CAMBIO_ESTADO, "estado",
                estadoAnterior, "EN_CURSO", null, usuarioId);

        Tratamiento saved = repository.save(tratamiento);
        return mapper.toResponse(saved);
    }

    /**
     * Pausar tratamiento: EN_CURSO → PAUSADO
     */
    @Transactional
    public TratamientoResponse pausar(Long id, String motivo, Long usuarioId) {
        Tratamiento tratamiento = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tratamiento", id));

        if (tratamiento.getEstado() != EstadoTratamiento.EN_CURSO) {
            throw new BusinessRuleException("BR-TRAT-005",
                    "Solo se puede pausar un tratamiento en estado EN_CURSO");
        }

        String estadoAnterior = tratamiento.getEstado().name();
        tratamiento.setEstado(EstadoTratamiento.PAUSADO);
        tratamiento.setMotivoPausa(motivo);
        historialAdminService.registrar(id, tratamiento.getClinicaId(),
                TipoCambioAdministrativo.CAMBIO_ESTADO, "estado",
                estadoAnterior, "PAUSADO", motivo, usuarioId);

        Tratamiento saved = repository.save(tratamiento);
        return mapper.toResponse(saved);
    }

    /**
     * Reanudar tratamiento: PAUSADO → EN_CURSO
     */
    @Transactional
    public TratamientoResponse reanudar(Long id, Long usuarioId) {
        Tratamiento tratamiento = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tratamiento", id));

        if (tratamiento.getEstado() != EstadoTratamiento.PAUSADO) {
            throw new BusinessRuleException("BR-TRAT-006",
                    "Solo se puede reanudar un tratamiento en estado PAUSADO");
        }

        String estadoAnterior = tratamiento.getEstado().name();
        tratamiento.setEstado(EstadoTratamiento.EN_CURSO);
        historialAdminService.registrar(id, tratamiento.getClinicaId(),
                TipoCambioAdministrativo.CAMBIO_ESTADO, "estado",
                estadoAnterior, "EN_CURSO", null, usuarioId);

        Tratamiento saved = repository.save(tratamiento);
        return mapper.toResponse(saved);
    }

    /**
     * Finalizar tratamiento: EN_CURSO → FINALIZADO
     */
    @Transactional
    public TratamientoResponse finalizar(Long id, String resultadoFinal, Long usuarioId) {
        Tratamiento tratamiento = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tratamiento", id));

        if (tratamiento.getEstado() != EstadoTratamiento.EN_CURSO
                && tratamiento.getEstado() != EstadoTratamiento.PAUSADO) {
            throw new BusinessRuleException("BR-TRAT-007",
                    "Solo se puede finalizar un tratamiento en estado EN_CURSO o PAUSADO");
        }

        if (resultadoFinal == null || resultadoFinal.isBlank()) {
            throw new BusinessRuleException("BR-TRAT-007b",
                    "Se requiere resultado final para finalizar tratamiento");
        }

        String estadoAnterior = tratamiento.getEstado().name();
        tratamiento.setEstado(EstadoTratamiento.FINALIZADO);
        tratamiento.setFechaFin(LocalDate.now(BusinessTime.ZONE));
        tratamiento.setResultadoFinal(resultadoFinal);
        historialAdminService.registrar(id, tratamiento.getClinicaId(),
                TipoCambioAdministrativo.CAMBIO_ESTADO, "estado",
                estadoAnterior, "FINALIZADO", resultadoFinal, usuarioId);

        Tratamiento saved = repository.save(tratamiento);
        return mapper.toResponse(saved);
    }

    /**
     * Cancelar tratamiento: PENDIENTE/PROGRAMADO/EN_CURSO → CANCELADO
     */
    @Transactional
    public TratamientoResponse cancelar(Long id, String motivo, Long usuarioId) {
        Tratamiento tratamiento = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tratamiento", id));

        if (tratamiento.getEstado() == EstadoTratamiento.FINALIZADO
                || tratamiento.getEstado() == EstadoTratamiento.CANCELADO) {
            throw new BusinessRuleException("BR-TRAT-008",
                    "No se puede cancelar un tratamiento finalizado o ya cancelado");
        }

        if (motivo == null || motivo.isBlank()) {
            throw new BusinessRuleException("BR-TRAT-008b",
                    "Se requiere motivo para cancelar tratamiento");
        }

        String estadoAnterior = tratamiento.getEstado().name();
        tratamiento.setEstado(EstadoTratamiento.CANCELADO);
        tratamiento.setMotivoCancelacion(motivo);
        historialAdminService.registrar(id, tratamiento.getClinicaId(),
                TipoCambioAdministrativo.CAMBIO_ESTADO, "estado",
                estadoAnterior, "CANCELADO", motivo, usuarioId);

        Tratamiento saved = repository.save(tratamiento);
        return mapper.toResponse(saved);
    }

    @Transactional
    public TratamientoResponse actualizarPlan(Long id, TratamientoRequest request, Long usuarioId) {
        Tratamiento tratamiento = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tratamiento", id));

        if (tratamiento.getEstado() == EstadoTratamiento.FINALIZADO
                || tratamiento.getEstado() == EstadoTratamiento.CANCELADO) {
            throw new BusinessRuleException("BR-TRAT-004",
                    "No se puede modificar un tratamiento finalizado o cancelado");
        }

        Integer sesionesAnteriores = tratamiento.getSesionesPlaneadas();

        if (request.getSesionesPlaneadas() != null) {
            tratamiento.setSesionesPlaneadas(request.getSesionesPlaneadas());
        }
        if (request.getCostoEstimado() != null) {
            tratamiento.setCostoEstimado(request.getCostoEstimado());
        }
        if (request.getObservaciones() != null) {
            tratamiento.setObservaciones(request.getObservaciones());
        }
        if (request.getObjetivo() != null) {
            tratamiento.setObjetivo(request.getObjetivo());
        }

        if (request.getSesionesPlaneadas() != null && !request.getSesionesPlaneadas().equals(sesionesAnteriores)) {
            historialAdminService.registrar(id, tratamiento.getClinicaId(),
                    TipoCambioAdministrativo.CAMBIO_SESIONES_PLANEADAS, "sesionesPlaneadas",
                    sesionesAnteriores != null ? sesionesAnteriores.toString() : null,
                    request.getSesionesPlaneadas().toString(),
                    request.getObservaciones(), usuarioId);
        }

        Tratamiento saved = repository.save(tratamiento);
        return mapper.toResponse(saved);
    }

    @Transactional
    public void ampliarPlan(Long id, Integer nuevasSesiones, String motivo, Long usuarioId) {
        Tratamiento tratamiento = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tratamiento", id));

        Integer sesionesAnteriores = tratamiento.getSesionesPlaneadas();
        tratamiento.setSesionesPlaneadas(nuevasSesiones);

        historialAdminService.registrar(id, tratamiento.getClinicaId(),
                TipoCambioAdministrativo.AMPLIACION_PLAN, "sesionesPlaneadas",
                sesionesAnteriores.toString(), nuevasSesiones.toString(),
                motivo, usuarioId);

        repository.save(tratamiento);
    }

}
