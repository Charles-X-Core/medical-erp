package com.medicalerp.paciente.controller;

import com.medicalerp.auditoria.service.AccessLogService;
import com.medicalerp.common.dto.ApiResponse;
import com.medicalerp.common.util.SecurityUtils;
import com.medicalerp.paciente.dto.PacienteCompletoRequest;
import com.medicalerp.paciente.dto.PacienteRequest;
import com.medicalerp.paciente.dto.PacienteResponse;
import com.medicalerp.paciente.service.PacienteService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Patient Controller (API-002)
 */
@RestController
@RequestMapping("/api/v1/pacientes")
@RequiredArgsConstructor
public class PacienteController {

    private final PacienteService pacienteService;
    private final AccessLogService accessLogService;
    private final SecurityUtils securityUtils;

    @PostMapping
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ENFERMERA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PacienteResponse>> create(@Valid @RequestBody PacienteRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(pacienteService.create(request), "Paciente creado exitosamente"));
    }

    @PostMapping("/full")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ENFERMERA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PacienteResponse>> createCompleto(
            @Valid @RequestBody PacienteCompletoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(pacienteService.createCompleto(request), "Paciente creado exitosamente"));
    }

    @GetMapping
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ENFERMERA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Page<PacienteResponse>>> getAll(Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(pacienteService.getAll(pageable)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ENFERMERA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PacienteResponse>> getById(
            @PathVariable Long id,
            HttpServletRequest httpRequest) {
        PacienteResponse response = pacienteService.getById(id);
        accessLogService.log(
                securityUtils.getCurrentClinicaId(),
                "VIEW",
                "PACIENTE",
                id,
                securityUtils.getCurrentUserEmail(),
                httpRequest.getRemoteAddr(),
                httpRequest.getHeader("User-Agent")
        );
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ENFERMERA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PacienteResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody PacienteRequest request) {
        return ResponseEntity.ok(ApiResponse.success(pacienteService.update(id, request), "Paciente actualizado"));
    }

    @PutMapping("/full/{id}")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ENFERMERA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PacienteResponse>> updateCompleto(
            @PathVariable Long id,
            @Valid @RequestBody PacienteCompletoRequest request) {
        return ResponseEntity.ok(ApiResponse.success(pacienteService.updateCompleto(id, request), "Paciente actualizado"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        pacienteService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/buscar")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ENFERMERA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Page<PacienteResponse>>> search(
            @RequestParam String q,
            Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(pacienteService.search(q, pageable)));
    }

    @GetMapping("/estado/{estado}")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ENFERMERA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Page<PacienteResponse>>> getByEstado(
            @PathVariable String estado,
            Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(pacienteService.getByEstado(estado, pageable)));
    }

}
