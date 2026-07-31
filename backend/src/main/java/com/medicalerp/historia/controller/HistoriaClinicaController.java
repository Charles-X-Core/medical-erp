package com.medicalerp.historia.controller;

import com.medicalerp.common.dto.ApiResponse;
import com.medicalerp.historia.dto.HistoriaClinicaRequest;
import com.medicalerp.historia.dto.HistoriaClinicaResponse;
import com.medicalerp.historia.service.HistoriaClinicaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Historia Clinica Controller (API-002)
 */
@RestController
@RequestMapping("/api/v1/historias")
@RequiredArgsConstructor
public class HistoriaClinicaController {

    private final HistoriaClinicaService historiaService;

    @PostMapping
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<HistoriaClinicaResponse>> create(@Valid @RequestBody HistoriaClinicaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(historiaService.create(request), "Historia clínica creada exitosamente"));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ENFERMERA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<HistoriaClinicaResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(historiaService.getById(id)));
    }

    @GetMapping("/paciente/{pacienteId}")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ENFERMERA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<HistoriaClinicaResponse>> getByPaciente(@PathVariable Long pacienteId) {
        return ResponseEntity.ok(ApiResponse.success(historiaService.getByPacienteId(pacienteId)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<HistoriaClinicaResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody HistoriaClinicaRequest request) {
        return ResponseEntity.ok(ApiResponse.success(historiaService.update(id, request), "Historia clínica actualizada"));
    }

}
