package com.medicalerp.paciente.controller;

import com.medicalerp.common.dto.ApiResponse;
import com.medicalerp.paciente.dto.PacienteConsentimientoRequest;
import com.medicalerp.paciente.dto.PacienteConsentimientoResponse;
import com.medicalerp.paciente.service.PacienteConsentimientoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/pacientes/{pacienteId}/consentimientos")
@RequiredArgsConstructor
public class PacienteConsentimientoController {

    private final PacienteConsentimientoService consentimientoService;

    @PostMapping
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ENFERMERA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PacienteConsentimientoResponse>> create(
            @PathVariable Long pacienteId,
            @Valid @RequestBody PacienteConsentimientoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(consentimientoService.create(pacienteId, request), "Consentimiento creado exitosamente"));
    }

    @GetMapping
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ENFERMERA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<PacienteConsentimientoResponse>>> getByPaciente(
            @PathVariable Long pacienteId) {
        return ResponseEntity.ok(ApiResponse.success(consentimientoService.getByPacienteId(pacienteId)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ENFERMERA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PacienteConsentimientoResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(consentimientoService.getById(id)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PacienteConsentimientoResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody PacienteConsentimientoRequest request) {
        return ResponseEntity.ok(ApiResponse.success(consentimientoService.update(id, request), "Consentimiento actualizado"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        consentimientoService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
