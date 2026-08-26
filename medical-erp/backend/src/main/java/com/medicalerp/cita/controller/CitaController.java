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
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<CitaResponse>> create(@Valid @RequestBody CitaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(citaService.create(request), "Cita creada exitosamente"));
    }

    @GetMapping
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Page<CitaResponse>>> getAll(
            @RequestParam(required = false) LocalDate fecha,
            @RequestParam(required = false) String estado,
            @RequestParam(required = false) Long usuarioId,
            Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(citaService.getAll(fecha, estado, usuarioId, pageable)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<CitaResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(citaService.getById(id)));
    }

    @GetMapping("/hoy")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<CitaResponse>>> getHoy() {
        return ResponseEntity.ok(ApiResponse.success(citaService.getHoy()));
    }

    @GetMapping("/proximas")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<CitaResponse>>> getProximas() {
        return ResponseEntity.ok(ApiResponse.success(citaService.getProximas()));
    }

    @GetMapping("/paciente/{pacienteId}")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<CitaResponse>>> getByPacienteId(@PathVariable Long pacienteId) {
        return ResponseEntity.ok(ApiResponse.success(citaService.getByPacienteId(pacienteId)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<CitaResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody CitaRequest request) {
        return ResponseEntity.ok(ApiResponse.success(citaService.update(id, request), "Cita actualizada"));
    }

    @PatchMapping("/{id}/confirmar")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<CitaResponse>> confirmar(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(citaService.confirmar(id), "Cita confirmada"));
    }

    @PatchMapping("/{id}/asistencia")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ADMIN')")
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
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<CitaResponse>> cancelar(
            @PathVariable Long id,
            @RequestParam(required = false) String motivo) {
        return ResponseEntity.ok(ApiResponse.success(citaService.cancelar(id, motivo), "Cita cancelada"));
    }

    @PatchMapping("/{id}/reprogramar")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<CitaResponse>> reprogramar(
            @PathVariable Long id,
            @Valid @RequestBody CitaRequest request) {
        return ResponseEntity.ok(ApiResponse.success(citaService.reprogramar(id, request), "Cita reprogramada"));
    }

    @GetMapping("/solicitadas/mis")
    @PreAuthorize("hasRole('DOCTORA')")
    public ResponseEntity<ApiResponse<java.util.List<CitaResponse>>> getSolicitadasByDoctora() {
        return ResponseEntity.ok(ApiResponse.success(citaService.getSolicitadasByDoctora()));
    }

    @GetMapping("/{id}/verificar-extension")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<java.util.Map<String, Object>>> verificarExtension(
            @PathVariable Long id,
            @RequestParam Integer nuevaDuracion) {
        return ResponseEntity.ok(ApiResponse.success(citaService.verificarExtension(id, nuevaDuracion)));
    }

    @PutMapping("/{id}/iniciar")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<CitaResponse>> iniciarAtencion(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(citaService.iniciarAtencion(id), "Atención iniciada"));
    }

    @PutMapping("/{id}/completar")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<CitaResponse>> completarCita(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(citaService.completarCita(id), "Cita completada"));
    }

    @PutMapping("/{id}/extender")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<java.util.Map<String, Object>>> extenderSesion(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, Integer> body) {
        Integer minutosExtra = body.getOrDefault("minutosExtra", 0);
        return ResponseEntity.ok(ApiResponse.success(
                citaService.extenderSesion(id, minutosExtra), "Sesión extendida"));
    }

    @PutMapping("/{id}/mover")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<CitaResponse>> moverCita(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, String> body) {
        java.time.LocalTime nuevaHora = java.time.LocalTime.parse(body.get("nuevaHora"));
        return ResponseEntity.ok(ApiResponse.success(citaService.moverCita(id, nuevaHora), "Cita movida"));
    }

    @PutMapping("/{id}/no-show")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<CitaResponse>> marcarNoShow(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(citaService.marcarNoShow(id), "Marcada como no asistida"));
    }

    @PatchMapping("/{id}/desmarcar-no-show")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<CitaResponse>> desmarcarNoShow(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(citaService.desmarcarNoShow(id), "No-show desmarcado"));
    }

}
