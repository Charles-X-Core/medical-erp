package com.medicalerp.tratamiento.service;

import com.medicalerp.common.exception.BusinessRuleException;
import com.medicalerp.common.util.BusinessTime;
import com.medicalerp.common.util.SecurityUtils;
import com.medicalerp.tratamiento.dto.*;
import com.medicalerp.tratamiento.entity.ProtocoloClinico;
import com.medicalerp.tratamiento.entity.Tratamiento;
import com.medicalerp.tratamiento.enums.EstadoTratamiento;
import com.medicalerp.tratamiento.enums.TipoCambioClinico;
import com.medicalerp.tratamiento.mapper.TratamientoMapper;
import com.medicalerp.tratamiento.repository.TratamientoRepository;
import com.medicalerp.tratamiento.service.rules.ClinicalContext;
import com.medicalerp.tratamiento.service.rules.ClinicalEvaluation;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * TreatmentWorkflowService
 * Orquestador de flujos de tratamiento
 * Coordina TratamientoService, ClinicalRuleEngine, SugerenciaCitaService
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TreatmentWorkflowService {

    private final TratamientoService tratamientoService;
    private final ProtocoloClinicoService protocoloService;
    private final SesionTratamientoService sesionService;
    private final ClinicalRuleEngine ruleEngine;
    private final SugerenciaCitaService sugerenciaCitaService;
    private final HistorialClinicoService historialClinicoService;
    private final TratamientoRepository tratamientoRepository;
    private final TratamientoMapper mapper;
    private final SecurityUtils securityUtils;

    /**
     * Crea un tratamiento y evalua reglas iniciales
     */
    @Transactional
    public TratamientoResponse crearConWorkflow(TratamientoRequest request) {
        // 1. Crear tratamiento
        TratamientoResponse response = tratamientoService.crear(request);

        // 2. Si iniciarAhora, crear primera sesion
        if (Boolean.TRUE.equals(request.getIniciarAhora()) && request.getTipoPrimeraSesionId() != null) {
            Long responseId = response.getId();
            Tratamiento tratamiento = tratamientoRepository.findById(responseId)
                    .orElseThrow(() -> new com.medicalerp.common.exception.ResourceNotFoundException("Tratamiento", responseId));

            // Iniciar tratamiento
            tratamientoService.iniciar(tratamiento.getId(), securityUtils.getCurrentUserId());

            // Crear primera sesion
            SesionTratamientoRequest primeraSesion = SesionTratamientoRequest.builder()
                    .tipoSesionId(request.getTipoPrimeraSesionId())
                    .fecha(BusinessTime.currentDateTime())
                    .motivoVisita("Primera sesion de tratamiento")
                    .requiereCita(true)
                    .build();
            sesionService.crear(tratamiento.getId(), primeraSesion, securityUtils.getCurrentUserId());

            // Actualizar response
            response = tratamientoService.getById(tratamiento.getId());
        }

        // 3. Evaluar reglas
        Long finalResponseId = response.getId();
        Tratamiento tratamiento = tratamientoRepository.findById(finalResponseId)
                .orElseThrow(() -> new com.medicalerp.common.exception.ResourceNotFoundException("Tratamiento", finalResponseId));

        ClinicalContext context = ClinicalContext.builder()
                .tratamiento(tratamiento)
                .protocolo(protocoloService.findByTratamientoId(finalResponseId))
                .sesiones(sesionService.findByTratamientoId(finalResponseId).stream()
                        .map(s -> {
                            var entity = new com.medicalerp.tratamiento.entity.SesionTratamiento();
                            entity.setId(s.getId());
                            entity.setFecha(s.getFecha());
                            return entity;
                        }).toList())
                .clinicaId(securityUtils.getCurrentClinicaId())
                .now(BusinessTime.now())
                .build();

        ClinicalEvaluation eval = ruleEngine.evaluate(tratamiento, context);

        // 4. Enriquecer response
        response.setProximaAccion(eval.getProximaAccion());
        response.setAlertas(eval.getAlertas());
        response.setMensaje(eval.getMensaje());

        return response;
    }

    /**
     * Registra una sesion y evalua reglas
     */
    @Transactional
    public SesionTratamientoResponse registrarSesionConWorkflow(Long tratamientoId, SesionTratamientoRequest request) {
        Long usuarioId = securityUtils.getCurrentUserId();

        // 1. Registrar sesion
        SesionTratamientoResponse sesion = sesionService.crear(tratamientoId, request, usuarioId);

        // 2. Evaluar reglas
        Tratamiento tratamiento = tratamientoRepository.findById(tratamientoId)
                .orElseThrow(() -> new com.medicalerp.common.exception.ResourceNotFoundException("Tratamiento", tratamientoId));

        ClinicalContext context = ClinicalContext.builder()
                .tratamiento(tratamiento)
                .protocolo(protocoloService.findByTratamientoId(tratamientoId))
                .clinicaId(securityUtils.getCurrentClinicaId())
                .now(BusinessTime.now())
                .build();

        ClinicalEvaluation eval = ruleEngine.evaluate(tratamiento, context);

        // 3. Registrar en historial clinico
        historialClinicoService.registrar(
                tratamientoId,
                tratamiento.getClinicaId(),
                TipoCambioClinico.CREACION,
                "Sesion " + sesion.getNumeroSesion(),
                null,
                "Sesion registrada",
                null,
                usuarioId
        );

        return sesion;
    }

    /**
     * Cambia estado y evalua reglas
     */
    @Transactional
    public TratamientoResponse cambiarEstadoConWorkflow(Long id, String accion, String motivo) {
        Long usuarioId = securityUtils.getCurrentUserId();

        // 1. Cambiar estado según la acción
        TratamientoResponse response;
        switch (accion.toUpperCase()) {
            case "PROGRAMAR":
                response = tratamientoService.programar(id, usuarioId);
                break;
            case "INICIAR":
                response = tratamientoService.iniciar(id, usuarioId);
                break;
            case "PAUSAR":
                response = tratamientoService.pausar(id, motivo, usuarioId);
                break;
            case "REANUDAR":
                response = tratamientoService.reanudar(id, usuarioId);
                break;
            case "FINALIZAR":
                response = tratamientoService.finalizar(id, motivo, usuarioId);
                break;
            case "CANCELAR":
                response = tratamientoService.cancelar(id, motivo, usuarioId);
                break;
            default:
                throw new BusinessRuleException("BR-TRAT-000", "Acción no implementada: " + accion);
        }

        // 2. Evaluar reglas
        Tratamiento tratamiento = tratamientoRepository.findById(id)
                .orElseThrow(() -> new com.medicalerp.common.exception.ResourceNotFoundException("Tratamiento", id));

        ClinicalContext context = ClinicalContext.builder()
                .tratamiento(tratamiento)
                .protocolo(protocoloService.findByTratamientoId(id))
                .clinicaId(securityUtils.getCurrentClinicaId())
                .now(BusinessTime.now())
                .build();

        ClinicalEvaluation eval = ruleEngine.evaluate(tratamiento, context);

        // 3. Enriquecer response
        response.setProximaAccion(eval.getProximaAccion());
        response.setAlertas(eval.getAlertas());
        response.setMensaje(eval.getMensaje());

        return response;
    }

}
