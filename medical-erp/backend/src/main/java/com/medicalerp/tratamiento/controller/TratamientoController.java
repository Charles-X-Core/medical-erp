package com.medicalerp.tratamiento.controller;

import com.medicalerp.common.dto.ApiResponse;
import com.medicalerp.common.util.SecurityUtils;
import com.medicalerp.tratamiento.dto.*;
import com.medicalerp.tratamiento.enums.EstadoTratamiento;
import com.medicalerp.tratamiento.service.HistorialAdministrativoService;
import com.medicalerp.tratamiento.service.HistorialClinicoService;
import com.medicalerp.tratamiento.service.ProtocoloClinicoService;
import com.medicalerp.tratamiento.service.SugerenciaCitaService;
import com.medicalerp.tratamiento.service.TratamientoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Tratamiento Controller (API-TRAT-001)
 */
@RestController
@RequestMapping("/api/v1/tratamientos")
@RequiredArgsConstructor
public class TratamientoController {

    private final TratamientoService tratamientoService;
    private final ProtocoloClinicoService protocoloService;
    private final SugerenciaCitaService sugerenciaCitaService;
    private final HistorialClinicoService historialClinicoService;
    private final HistorialAdministrativoService historialAdminService;
    private final SecurityUtils securityUtils;

    @PostMapping
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<TratamientoResponse>> crear(
            @Valid @RequestBody TratamientoRequest request) {
        TratamientoResponse response = tratamientoService.crear(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Tratamiento creado exitosamente"));
    }

    @GetMapping
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Page<TratamientoResponse>>> listar(Pageable pageable) {
        Long clinicaId = securityUtils.getCurrentClinicaId();
        return ResponseEntity.ok(ApiResponse.success(tratamientoService.getAll(clinicaId, pageable)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<TratamientoResponse>> obtenerPorId(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(tratamientoService.getById(id)));
    }

    @GetMapping("/paciente/{pacienteId}")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Page<TratamientoResponse>>> porPaciente(
            @PathVariable Long pacienteId, Pageable pageable) {
        Long clinicaId = securityUtils.getCurrentClinicaId();
        return ResponseEntity.ok(ApiResponse.success(
                tratamientoService.getByPaciente(clinicaId, pacienteId, pageable)));
    }

    @GetMapping("/estado/{estado}")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Page<TratamientoResponse>>> porEstado(
            @PathVariable EstadoTratamiento estado, Pageable pageable) {
        Long clinicaId = securityUtils.getCurrentClinicaId();
        return ResponseEntity.ok(ApiResponse.success(
                tratamientoService.getByEstado(clinicaId, estado, pageable)));
    }

    @GetMapping("/activos")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<TratamientoResponse>>> activos() {
        Long clinicaId = securityUtils.getCurrentClinicaId();
        return ResponseEntity.ok(ApiResponse.success(tratamientoService.getActivos(clinicaId)));
    }

    @GetMapping("/buscar")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Page<TratamientoResponse>>> buscar(
            @RequestParam String q, Pageable pageable) {
        Long clinicaId = securityUtils.getCurrentClinicaId();
        return ResponseEntity.ok(ApiResponse.success(tratamientoService.search(clinicaId, q, pageable)));
    }

    @PatchMapping("/{id}/programar")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<TratamientoResponse>> programar(@PathVariable Long id) {
        Long usuarioId = securityUtils.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success(
                tratamientoService.programar(id, usuarioId),
                "Tratamiento programado"));
    }

    @PatchMapping("/{id}/iniciar")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<TratamientoResponse>> iniciar(@PathVariable Long id) {
        Long usuarioId = securityUtils.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success(
                tratamientoService.iniciar(id, usuarioId),
                "Tratamiento iniciado"));
    }

    @PatchMapping("/{id}/pausar")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<TratamientoResponse>> pausar(
            @PathVariable Long id,
            @RequestParam(required = false) String motivo) {
        Long usuarioId = securityUtils.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success(
                tratamientoService.pausar(id, motivo, usuarioId),
                "Tratamiento pausado"));
    }

    @PatchMapping("/{id}/reanudar")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<TratamientoResponse>> reanudar(@PathVariable Long id) {
        Long usuarioId = securityUtils.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success(
                tratamientoService.reanudar(id, usuarioId),
                "Tratamiento reanudado"));
    }

    @PatchMapping("/{id}/finalizar")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<TratamientoResponse>> finalizar(
            @PathVariable Long id,
            @RequestParam String resultadoFinal) {
        Long usuarioId = securityUtils.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success(
                tratamientoService.finalizar(id, resultadoFinal, usuarioId),
                "Tratamiento finalizado"));
    }

    @PatchMapping("/{id}/cancelar")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<TratamientoResponse>> cancelar(
            @PathVariable Long id,
            @RequestParam String motivo) {
        Long usuarioId = securityUtils.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success(
                tratamientoService.cancelar(id, motivo, usuarioId),
                "Tratamiento cancelado"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<TratamientoResponse>> actualizar(
            @PathVariable Long id,
            @Valid @RequestBody TratamientoRequest request) {
        Long usuarioId = securityUtils.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success(
                tratamientoService.actualizarPlan(id, request, usuarioId),
                "Plan del tratamiento actualizado"));
    }

    @PatchMapping("/{id}/ampliar")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> ampliarPlan(
            @PathVariable Long id,
            @RequestParam Integer nuevasSesiones,
            @RequestParam(required = false) String motivo) {
        Long usuarioId = securityUtils.getCurrentUserId();
        tratamientoService.ampliarPlan(id, nuevasSesiones, motivo, usuarioId);
        return ResponseEntity.ok(ApiResponse.success(null, "Plan ampliado exitosamente"));
    }

    @GetMapping("/{id}/protocolo")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ProtocoloClinicoResponse>> obtenerProtocolo(@PathVariable Long id) {
        var protocolo = protocoloService.findByTratamientoId(id);
        return ResponseEntity.ok(ApiResponse.success(protocoloService.toResponse(protocolo)));
    }

    @PutMapping("/{id}/protocolo")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ProtocoloClinicoResponse>> actualizarProtocolo(
            @PathVariable Long id,
            @RequestBody ProtocoloClinicoRequest request) {
        var protocolo = protocoloService.actualizar(id, request);
        return ResponseEntity.ok(ApiResponse.success(protocoloService.toResponse(protocolo),
                "Protocolo actualizado"));
    }

    @PostMapping("/{id}/sugerir-proxima-cita")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<SugerenciaCitaResponse>> sugerirProximaCita(@PathVariable Long id) {
        SugerenciaCitaResponse sugerencia = sugerenciaCitaService.sugerir(id);
        return ResponseEntity.ok(ApiResponse.success(sugerencia));
    }

    @GetMapping("/{id}/historial/clinico")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<HistorialClinicoResponse>>> historialClinico(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(historialClinicoService.findByTratamientoId(id)));
    }

    @GetMapping("/{id}/historial/administrativo")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<HistorialAdministrativoResponse>>> historialAdministrativo(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(historialAdminService.findByTratamientoId(id)));
    }

}
