package com.medicalerp.contratopwa.controller;

import com.medicalerp.common.dto.ApiResponse;
import com.medicalerp.common.util.SecurityUtils;
import com.medicalerp.contratopwa.dto.ContratoPwaRequest;
import com.medicalerp.contratopwa.dto.ContratoPwaResponse;
import com.medicalerp.contratopwa.service.ContratoPwaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/contrato-pwa")
@RequiredArgsConstructor
public class ContratoPwaController {

    private final ContratoPwaService contratoPwaService;
    private final SecurityUtils securityUtils;

    @PostMapping("/enviar")
    @PreAuthorize("hasRole('ENFERMERA') or hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ContratoPwaResponse>> enviar(
            @Valid @RequestBody ContratoPwaRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                contratoPwaService.enviar(request.getPacienteId(), request.getTemplateCode()),
                "Contrato enviado a tablet"));
    }

    @GetMapping("/siguiente")
    @PreAuthorize("hasRole('ENFERMERA') or hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ContratoPwaResponse>> siguiente() {
        Long clinicaId = securityUtils.getCurrentClinicaId();
        return ResponseEntity.ok(ApiResponse.success(
                contratoPwaService.getSiguiente(clinicaId)));
    }

    @GetMapping("/render")
    @PreAuthorize("hasRole('ENFERMERA') or hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ContratoPwaResponse>> render(
            @RequestParam String token) {
        return ResponseEntity.ok(ApiResponse.success(
                contratoPwaService.render(token)));
    }

    @PostMapping("/firmar")
    @PreAuthorize("hasRole('ENFERMERA') or hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ContratoPwaResponse>> firmar(
            @Valid @RequestBody ContratoPwaRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                contratoPwaService.firmar(request.getToken(), request.getFirmaImagen()),
                "Contrato firmado exitosamente"));
    }

    @GetMapping("/status")
    @PreAuthorize("hasRole('ENFERMERA') or hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ContratoPwaResponse>> status(
            @RequestParam String token) {
        return ResponseEntity.ok(ApiResponse.success(
                contratoPwaService.getStatus(token)));
    }
}
