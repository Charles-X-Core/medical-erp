package com.medicalerp.paciente.controller;

import com.medicalerp.common.dto.ApiResponse;
import com.medicalerp.paciente.dto.PacienteSeguroRequest;
import com.medicalerp.paciente.dto.PacienteSeguroResponse;
import com.medicalerp.paciente.service.PacienteSeguroService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/pacientes/{pacienteId}/seguros")
@RequiredArgsConstructor
public class PacienteSeguroController {

    private final PacienteSeguroService seguroService;

    @PostMapping
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PacienteSeguroResponse>> create(
            @PathVariable Long pacienteId,
            @Valid @RequestBody PacienteSeguroRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(seguroService.create(pacienteId, request), "Seguro creado exitosamente"));
    }

    @GetMapping
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<PacienteSeguroResponse>>> getByPaciente(
            @PathVariable Long pacienteId) {
        return ResponseEntity.ok(ApiResponse.success(seguroService.getByPacienteId(pacienteId)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PacienteSeguroResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(seguroService.getById(id)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PacienteSeguroResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody PacienteSeguroRequest request) {
        return ResponseEntity.ok(ApiResponse.success(seguroService.update(id, request), "Seguro actualizado"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        seguroService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
