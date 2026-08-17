package com.medicalerp.notificacion.controller;

import com.medicalerp.common.dto.ApiResponse;
import com.medicalerp.notificacion.dto.NotificacionRequest;
import com.medicalerp.notificacion.dto.NotificacionResponse;
import com.medicalerp.notificacion.service.NotificacionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/notificaciones")
@RequiredArgsConstructor
public class NotificacionController {
    private final NotificacionService notificacionService;

    @GetMapping("/no-leidas")
    @PreAuthorize("hasAnyRole('DOCTORA','ENFERMERA','ADMIN')")
    public ResponseEntity<ApiResponse<List<NotificacionResponse>>> getNoLeidas() {
        return ResponseEntity.ok(ApiResponse.success(notificacionService.getNoLeidas()));
    }

    @GetMapping("/conteo")
    @PreAuthorize("hasAnyRole('DOCTORA','ENFERMERA','ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getCount() {
        return ResponseEntity.ok(ApiResponse.success(Map.of("noLeidas", notificacionService.countNoLeidas())));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('DOCTORA','ENFERMERA','ADMIN')")
    public ResponseEntity<ApiResponse<List<NotificacionResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(notificacionService.getAll()));
    }

    @PatchMapping("/{id}/leer")
    @PreAuthorize("hasAnyRole('DOCTORA','ENFERMERA','ADMIN')")
    public ResponseEntity<ApiResponse<NotificacionResponse>> marcarLeida(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(notificacionService.marcarLeida(id), "Marcada como leída"));
    }

    @PatchMapping("/leer-todas")
    @PreAuthorize("hasAnyRole('DOCTORA','ENFERMERA','ADMIN')")
    public ResponseEntity<ApiResponse<Void>> marcarTodasLeidas() {
        notificacionService.marcarTodasLeidas();
        return ResponseEntity.ok(ApiResponse.success(null, "Todas marcadas como leídas"));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('DOCTORA','ENFERMERA','ADMIN')")
    public ResponseEntity<ApiResponse<NotificacionResponse>> crear(@Valid @RequestBody NotificacionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(notificacionService.crear(request), "Notificación creada"));
    }
}