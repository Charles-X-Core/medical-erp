package com.medicalerp.tratamiento.controller;

import com.medicalerp.common.dto.ApiResponse;
import com.medicalerp.common.util.SecurityUtils;
import com.medicalerp.tratamiento.dto.TratamientoDashboardResponse;
import com.medicalerp.tratamiento.repository.TratamientoRepository;
import com.medicalerp.tratamiento.enums.EstadoTratamiento;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * TratamientoDashboard Controller (API-TRAT-006)
 * Dashboard y alertas de tratamientos
 */
@RestController
@RequestMapping("/api/v1/tratamientos/dashboard")
@RequiredArgsConstructor
public class TratamientoDashboardController {

    private final TratamientoRepository tratamientoRepository;
    private final SecurityUtils securityUtils;

    @GetMapping("/resumen")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ENFERMERA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<TratamientoDashboardResponse>> resumen() {
        Long clinicaId = securityUtils.getCurrentClinicaId();

        long total = tratamientoRepository.findByClinicaId(clinicaId,
                org.springframework.data.domain.PageRequest.of(0, 1)).getTotalElements();

        var pendientes = tratamientoRepository.findByClinicaIdAndEstado(clinicaId, EstadoTratamiento.PENDIENTE).size();
        var programados = tratamientoRepository.findByClinicaIdAndEstado(clinicaId, EstadoTratamiento.PROGRAMADO).size();
        var enCurso = tratamientoRepository.findByClinicaIdAndEstado(clinicaId, EstadoTratamiento.EN_CURSO).size();
        var pausados = tratamientoRepository.findByClinicaIdAndEstado(clinicaId, EstadoTratamiento.PAUSADO).size();
        var finalizados = tratamientoRepository.findByClinicaIdAndEstado(clinicaId, EstadoTratamiento.FINALIZADO).size();
        var cancelados = tratamientoRepository.findByClinicaIdAndEstado(clinicaId, EstadoTratamiento.CANCELADO).size();

        var limitAlcanzado = tratamientoRepository.findActivosConLimiteAlcanzado(clinicaId).size();
        var pendientesInicio = tratamientoRepository.findPendientesDeInicio(clinicaId).size();

        TratamientoDashboardResponse response = TratamientoDashboardResponse.builder()
                .totalTratamientos(total)
                .tratamientosPendientes((long) pendientes)
                .tratamientosActivos((long) enCurso)
                .tratamientosPausados((long) pausados)
                .tratamientosFinalizados((long) finalizados)
                .tratamientosCancelados((long) cancelados)
                .alertas(java.util.List.of())
                .build();

        return ResponseEntity.ok(ApiResponse.success(response));
    }

}
