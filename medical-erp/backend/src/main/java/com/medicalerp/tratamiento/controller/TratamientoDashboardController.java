package com.medicalerp.tratamiento.controller;

import com.medicalerp.common.dto.ApiResponse;
import com.medicalerp.common.util.SecurityUtils;
import com.medicalerp.tratamiento.dto.TratamientoAlertaResponse;
import com.medicalerp.tratamiento.dto.TratamientoDashboardResponse;
import com.medicalerp.tratamiento.entity.Tratamiento;
import com.medicalerp.tratamiento.repository.TratamientoRepository;
import com.medicalerp.tratamiento.enums.EstadoTratamiento;
import com.medicalerp.paciente.entity.Paciente;
import com.medicalerp.paciente.repository.PacienteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

/**
 * TratamientoDashboard Controller (API-TRAT-006)
 * Dashboard y alertas de tratamientos
 */
@RestController
@RequestMapping("/api/v1/tratamientos/dashboard")
@RequiredArgsConstructor
public class TratamientoDashboardController {

    private final TratamientoRepository tratamientoRepository;
    private final PacienteRepository pacienteRepository;
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

        List<TratamientoAlertaResponse> alertas = new ArrayList<>();
        for (Tratamiento t : tratamientoRepository.findActivosConLimiteAlcanzado(clinicaId)) {
            alertas.add(buildAlerta(t, "LIMITE_ALCANZADO", "ERROR",
                    "El tratamiento alcanzó el límite de sesiones planeadas",
                    "Finalizar o ampliar el plan de tratamiento"));
        }
        for (Tratamiento t : tratamientoRepository.findPendientesDeInicio(clinicaId)) {
            alertas.add(buildAlerta(t, "PENDIENTE_INICIO", "WARNING",
                    "Tratamiento creado pendiente de inicio",
                    "Programar e iniciar el tratamiento"));
        }

        TratamientoDashboardResponse response = TratamientoDashboardResponse.builder()
                .totalTratamientos(total)
                .tratamientosPendientes((long) pendientes)
                .tratamientosActivos((long) enCurso)
                .tratamientosPausados((long) pausados)
                .tratamientosFinalizados((long) finalizados)
                .tratamientosCancelados((long) cancelados)
                .alertas(alertas)
                .build();

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    private TratamientoAlertaResponse buildAlerta(Tratamiento t, String tipo, String severidad,
                                                  String mensaje, String accionSugerida) {
        String pacienteNombre = pacienteRepository.findById(t.getPacienteId())
                .map(Paciente::getNombreCompleto)
                .orElse(null);
        return TratamientoAlertaResponse.builder()
                .tipoAlerta(tipo)
                .tratamientoId(t.getId())
                .pacienteId(t.getPacienteId())
                .pacienteNombre(pacienteNombre)
                .tipoTratamiento(t.getTipoTratamiento())
                .mensaje(mensaje)
                .accionSugerida(accionSugerida)
                .severidad(severidad)
                .build();
    }

}
