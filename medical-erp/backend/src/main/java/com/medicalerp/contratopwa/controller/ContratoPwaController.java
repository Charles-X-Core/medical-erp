package com.medicalerp.contratopwa.controller;

import com.medicalerp.common.dto.ApiResponse;
import com.medicalerp.common.exception.ResourceNotFoundException;
import com.medicalerp.common.util.SecurityUtils;
import com.medicalerp.contratopwa.dto.ContratoPwaRequest;
import com.medicalerp.contratopwa.dto.ContratoPwaResponse;
import com.medicalerp.contratopwa.entity.ContratoSigningSession;
import com.medicalerp.contratopwa.repository.ContratoSigningSessionRepository;
import com.medicalerp.contratopwa.service.ContratoPwaService;
import com.medicalerp.contratopwa.service.ContratoStorageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/contrato-pwa")
@RequiredArgsConstructor
public class ContratoPwaController {

    private final ContratoPwaService contratoPwaService;
    private final ContratoStorageService contratoStorageService;
    private final ContratoSigningSessionRepository sessionRepository;
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

    @GetMapping("/preview")
    @PreAuthorize("hasRole('ENFERMERA') or hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ContratoPwaResponse>> preview(
            @RequestParam Long pacienteId,
            @RequestParam String templateCode) {
        return ResponseEntity.ok(ApiResponse.success(
                contratoPwaService.getPreview(pacienteId, templateCode)));
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
                contratoPwaService.firmar(request.getToken(), request.getFirmaImagen(), request.getHtmlContent()),
                "Contrato firmado exitosamente"));
    }

    @GetMapping("/status")
    @PreAuthorize("hasRole('ENFERMERA') or hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ContratoPwaResponse>> status(
            @RequestParam String token) {
        return ResponseEntity.ok(ApiResponse.success(
                contratoPwaService.getStatus(token)));
    }

    @GetMapping("/check")
    @PreAuthorize("hasRole('ENFERMERA') or hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ContratoPwaResponse>> checkFirmado(
            @RequestParam Long pacienteId) {
        return ResponseEntity.ok(ApiResponse.success(
                contratoPwaService.checkFirmado(pacienteId)));
    }

    @GetMapping("/{sessionId}/pdf")
    @PreAuthorize("hasRole('ENFERMERA') or hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<ByteArrayResource> downloadContratoPdf(@PathVariable Long sessionId) {
        ContratoSigningSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Sesión de contrato", sessionId));

        Long clinicaId = securityUtils.getCurrentClinicaId();
        if (!session.getClinicaId().equals(clinicaId)) {
            return ResponseEntity.status(403).build();
        }

        byte[] pdfBytes = contratoStorageService.loadContratoPdf(
                clinicaId, session.getPacienteId(), sessionId);

        ByteArrayResource resource = new ByteArrayResource(pdfBytes);
        String filename = "contrato_" + sessionId + ".pdf";

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + filename + "\"")
                .contentLength(pdfBytes.length)
                .body(resource);
    }
}
