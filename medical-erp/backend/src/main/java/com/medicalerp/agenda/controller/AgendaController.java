package com.medicalerp.agenda.controller;

import com.medicalerp.common.dto.ApiResponse;
import com.medicalerp.agenda.dto.*;
import com.medicalerp.agenda.service.AgendaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * Agenda Controller (API-002)
 */
@RestController
@RequestMapping("/api/v1/agenda")
@RequiredArgsConstructor
public class AgendaController {

    private final AgendaService agendaService;

    @PostMapping
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ENFERMERA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AgendaResponse>> create(@Valid @RequestBody AgendaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(agendaService.createAgenda(request), "Agenda creada exitosamente"));
    }

    @GetMapping("/usuario/{usuarioId}")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ENFERMERA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AgendaResponse>> getByUsuario(@PathVariable Long usuarioId) {
        return ResponseEntity.ok(ApiResponse.success(agendaService.getByUsuarioId(usuarioId)));
    }

    @PutMapping("/{agendaId}/disponibilidades")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ENFERMERA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AgendaResponse>> updateDisponibilidades(
            @PathVariable Long agendaId,
            @Valid @RequestBody List<DisponibilidadRequest> request) {
        return ResponseEntity.ok(ApiResponse.success(
                agendaService.updateDisponibilidades(agendaId, request), "Disponibilidades actualizadas"));
    }

    @PostMapping("/{agendaId}/bloqueos")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ENFERMERA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<BloqueoResponse>> createBloqueo(
            @PathVariable Long agendaId,
            @Valid @RequestBody BloqueoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(agendaService.createBloqueo(agendaId, request), "Bloqueo creado"));
    }

    @GetMapping("/{agendaId}/bloqueos")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ENFERMERA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<BloqueoResponse>>> getBloqueos(@PathVariable Long agendaId) {
        return ResponseEntity.ok(ApiResponse.success(agendaService.getBloqueos(agendaId)));
    }

    @DeleteMapping("/bloqueos/{bloqueoId}")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ENFERMERA') or hasRole('ADMIN')")
    public ResponseEntity<Void> deleteBloqueo(@PathVariable Long bloqueoId) {
        agendaService.deleteBloqueo(bloqueoId);
        return ResponseEntity.noContent().build();
    }

    // --- Tipo Cita ---

    @PostMapping("/tipos")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<TipoCitaResponse>> createTipoCita(@Valid @RequestBody TipoCitaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(agendaService.createTipoCita(request), "Tipo de cita creado"));
    }

    @GetMapping("/tipos")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ENFERMERA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<TipoCitaResponse>>> getAllTiposCita() {
        return ResponseEntity.ok(ApiResponse.success(agendaService.getAllTiposCita()));
    }

    @GetMapping("/tipos/{id}")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ENFERMERA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<TipoCitaResponse>> getTipoCitaById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(agendaService.getTipoCitaById(id)));
    }

    @PutMapping("/tipos/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<TipoCitaResponse>> updateTipoCita(
            @PathVariable Long id,
            @Valid @RequestBody TipoCitaRequest request) {
        return ResponseEntity.ok(ApiResponse.success(agendaService.updateTipoCita(id, request), "Tipo de cita actualizado"));
    }

    @DeleteMapping("/tipos/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteTipoCita(@PathVariable Long id) {
        agendaService.deleteTipoCita(id);
        return ResponseEntity.noContent().build();
    }

    // --- Endpoints de Disponibilidad (Fase 8-11) ---

    @GetMapping("/{usuarioId}/disponibilidad")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ENFERMERA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<SlotDisponibilidad>>> getDisponibilidad(
            @PathVariable Long usuarioId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha,
            @RequestParam(defaultValue = "30") Integer duracion) {
        return ResponseEntity.ok(ApiResponse.success(
                agendaService.getDisponibilidad(usuarioId, fecha, duracion)));
    }

    @GetMapping("/{usuarioId}/next-available")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ENFERMERA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<SlotDisponibilidad>> getNextAvailable(
            @PathVariable Long usuarioId,
            @RequestParam(defaultValue = "30") Integer duracion) {
        return ResponseEntity.ok(ApiResponse.success(
                agendaService.getNextAvailable(usuarioId, duracion)));
    }

    @GetMapping("/{usuarioId}/disponibilidad-semana")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ENFERMERA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<SlotDisponibilidad>>> getDisponibilidadSemana(
            @PathVariable Long usuarioId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fin) {
        return ResponseEntity.ok(ApiResponse.success(
                agendaService.getDisponibilidadSemana(usuarioId, inicio, fin)));
    }

}
