package com.medicalerp.tarea.controller;

import com.medicalerp.common.dto.ApiResponse;
import com.medicalerp.common.util.SecurityUtils;
import com.medicalerp.tarea.dto.TareaRequest;
import com.medicalerp.tarea.dto.TareaResponse;
import com.medicalerp.tarea.service.TareaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/tareas")
@RequiredArgsConstructor
public class TareaController {

    private final TareaService tareaService;
    private final SecurityUtils securityUtils;

    @GetMapping("/pendientes")
    @PreAuthorize("hasRole('ENFERMERA') or hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<TareaResponse>>> getPendientes(@RequestParam String rol) {
        Long clinicaId = securityUtils.getCurrentClinicaId();
        return ResponseEntity.ok(ApiResponse.success(tareaService.getPendientes(rol, clinicaId)));
    }

    @GetMapping("/count")
    @PreAuthorize("hasRole('ENFERMERA') or hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Long>>> countPendientes(@RequestParam String rol) {
        Long clinicaId = securityUtils.getCurrentClinicaId();
        long count = tareaService.countPendientes(rol, clinicaId);
        return ResponseEntity.ok(ApiResponse.success(Map.of("count", count)));
    }

    @PostMapping
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<TareaResponse>> create(@Valid @RequestBody TareaRequest request) {
        Long clinicaId = securityUtils.getCurrentClinicaId();
        Long userId = securityUtils.getCurrentUserId();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(tareaService.create(request, userId, clinicaId), "Tarea creada"));
    }

    @PatchMapping("/{id}/estado")
    @PreAuthorize("hasRole('ENFERMERA') or hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<TareaResponse>> updateEstado(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(ApiResponse.success(
                tareaService.updateEstado(id, body.get("estado")), "Tarea actualizada"));
    }
}
