package com.medicalerp.cita.controller;

import com.medicalerp.common.dto.ApiResponse;
import com.medicalerp.cita.dto.CitaRequest;
import com.medicalerp.cita.dto.CitaResponse;
import com.medicalerp.cita.service.CitaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * Cita Controller (API-002)
 */
@RestController
@RequestMapping("/api/v1/citas")
@RequiredArgsConstructor
public class CitaController {

    private final CitaService citaService;

    @PostMapping
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ENFERMERA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<CitaResponse>> create(@Valid @RequestBody CitaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(citaService.create(request), "Cita creada exitosamente"));
    }

    @PostMapping("/solicitar")
    @PreAuthorize("hasRole('DOCTORA')")
    public ResponseEntity<ApiResponse<CitaResponse>> solicitar(@Valid @RequestBody CitaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(citaService.createSolicitada(request), "Solicitud de cita enviada"));
    }

    @GetMapping
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ENFERMERA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Page<CitaResponse>>> getAll(
            @RequestParam(required = false) LocalDate fecha,
            @RequestParam(required = false) String estado,
            @RequestParam(required = false) Long usuarioId,
            Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(citaService.getAll(fecha, estado, usuarioId, pageable)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ENFERMERA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<CitaResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(citaService.getById(id)));
    }

    @GetMapping("/hoy")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ENFERMERA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<CitaResponse>>> getHoy() {
        return ResponseEntity.ok(ApiResponse.success(citaService.getHoy()));
    }

    @GetMapping("/proximas")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ENFERMERA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<CitaResponse>>> getProximas() {
        return ResponseEntity.ok(ApiResponse.success(citaService.getProximas()));
    }

    @GetMapping("/paciente/{pacienteId}")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ENFERMERA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<CitaResponse>>> getByPacienteId(@PathVariable Long pacienteId) {
        return ResponseEntity.ok(ApiResponse.success(citaService.getByPacienteId(pacienteId)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ENFERMERA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<CitaResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody CitaRequest request) {
        return ResponseEntity.ok(ApiResponse.success(citaService.update(id, request), "Cita actualizada"));
    }

    @PatchMapping("/{id}/confirmar")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ENFERMERA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<CitaResponse>> confirmar(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(citaService.confirmar(id), "Cita confirmada"));
    }

    @PatchMapping("/{id}/asistencia")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ENFERMERA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<CitaResponse>> registrarAsistencia(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(citaService.registrarAsistencia(id), "Asistencia registrada"));
    }

    @PatchMapping("/{id}/completar")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<CitaResponse>> completar(
            @PathVariable Long id,
            @RequestParam(required = true) Long consultaId) {
        return ResponseEntity.ok(ApiResponse.success(citaService.completar(id, consultaId), "Cita completada"));
    }

    @PatchMapping("/{id}/cancelar")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ENFERMERA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<CitaResponse>> cancelar(
            @PathVariable Long id,
            @RequestParam(required = false) String motivo) {
        return ResponseEntity.ok(ApiResponse.success(citaService.cancelar(id, motivo), "Cita cancelada"));
    }

    @PatchMapping("/{id}/reprogramar")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ENFERMERA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<CitaResponse>> reprogramar(
            @PathVariable Long id,
            @Valid @RequestBody CitaRequest request) {
        return ResponseEntity.ok(ApiResponse.success(citaService.reprogramar(id, request), "Cita reprogramada"));
    }

    @PatchMapping("/{id}/programar")
    @PreAuthorize("hasRole('ENFERMERA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<CitaResponse>> programar(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(citaService.programar(id), "Cita programada"));
    }

    @PatchMapping("/{id}/rechazar")
    @PreAuthorize("hasRole('ENFERMERA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<CitaResponse>> rechazar(
            @PathVariable Long id,
            @RequestParam(required = false) String motivo) {
        return ResponseEntity.ok(ApiResponse.success(citaService.rechazar(id, motivo), "Solicitud rechazada"));
    }

    @GetMapping("/solicitadas")
    @PreAuthorize("hasRole('ENFERMERA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<CitaResponse>>> getSolicitadasPendientes() {
        return ResponseEntity.ok(ApiResponse.success(citaService.getSolicitadasPendientes()));
    }

    @GetMapping("/disponibilidad-solicitud")
    @PreAuthorize("hasRole('ENFERMERA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<java.util.Map<String, Object>>>> getDisponibilidadParaSolicitud(
            @RequestParam Long usuarioId,
            @RequestParam LocalDate fechaMinima,
            @RequestParam(required = false, defaultValue = "30") Integer duracion) {
        return ResponseEntity.ok(ApiResponse.success(
                citaService.getDisponibilidadParaSolicitud(usuarioId, fechaMinima, duracion)));
    }

    @GetMapping("/{id}/verificar-extension")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ENFERMERA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<java.util.Map<String, Object>>> verificarExtension(
            @PathVariable Long id,
            @RequestParam Integer nuevaDuracion) {
        return ResponseEntity.ok(ApiResponse.success(citaService.verificarExtension(id, nuevaDuracion)));
    }

}
