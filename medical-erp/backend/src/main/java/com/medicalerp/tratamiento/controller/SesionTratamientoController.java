package com.medicalerp.tratamiento.controller;

import com.medicalerp.common.dto.ApiResponse;
import com.medicalerp.common.util.SecurityUtils;
import com.medicalerp.tratamiento.dto.SesionTratamientoRequest;
import com.medicalerp.tratamiento.dto.SesionTratamientoResponse;
import com.medicalerp.tratamiento.service.SesionTratamientoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * SesionTratamiento Controller (API-TRAT-003)
 */
@RestController
@RequestMapping("/api/v1/sesiones-tratamiento")
@RequiredArgsConstructor
public class SesionTratamientoController {

    private final SesionTratamientoService sesionService;
    private final SecurityUtils securityUtils;

    @PostMapping
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<SesionTratamientoResponse>> crear(
            @RequestParam Long tratamientoId,
            @Valid @RequestBody SesionTratamientoRequest request) {
        Long usuarioId = securityUtils.getCurrentUserId();
        SesionTratamientoResponse response = sesionService.crear(tratamientoId, request, usuarioId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Sesion creada exitosamente"));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ENFERMERA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<SesionTratamientoResponse>> obtenerPorId(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(sesionService.findById(id)));
    }

    @GetMapping("/tratamiento/{tratamientoId}")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ENFERMERA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<SesionTratamientoResponse>>> porTratamiento(
            @PathVariable Long tratamientoId) {
        return ResponseEntity.ok(ApiResponse.success(sesionService.findByTratamientoId(tratamientoId)));
    }

}
