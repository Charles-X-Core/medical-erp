package com.medicalerp.consulta.controller;

import com.medicalerp.common.dto.ApiResponse;
import com.medicalerp.consulta.dto.ConsultaRequest;
import com.medicalerp.consulta.dto.ConsultaResponse;
import com.medicalerp.consulta.service.ConsultaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Consulta Controller (API-002)
 */
@RestController
@RequestMapping("/api/v1/consultas")
@RequiredArgsConstructor
public class ConsultaController {

    private final ConsultaService consultaService;

    @PostMapping
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ConsultaResponse>> create(@Valid @RequestBody ConsultaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(consultaService.create(request), "Consulta creada exitosamente"));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ENFERMERA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ConsultaResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(consultaService.getById(id)));
    }

    @GetMapping("/historia/{historiaId}")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ENFERMERA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Page<ConsultaResponse>>> getByHistoria(
            @PathVariable Long historiaId,
            Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(consultaService.getByHistoria(historiaId, pageable)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ConsultaResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody ConsultaRequest request) {
        return ResponseEntity.ok(ApiResponse.success(consultaService.update(id, request), "Consulta actualizada"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        consultaService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/firmar")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ConsultaResponse>> firmar(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(consultaService.firmar(id), "Consulta firmada"));
    }

}
