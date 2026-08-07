package com.medicalerp.paciente.controller.consentimiento;

import com.medicalerp.common.dto.ApiResponse;
import com.medicalerp.paciente.dto.consentimiento.ConsentimientoFirmaRequest;
import com.medicalerp.paciente.dto.consentimiento.ConsentimientoFirmaResponse;
import com.medicalerp.paciente.dto.consentimiento.ConsentimientoRenderResponse;
import com.medicalerp.paciente.service.consentimiento.ConsentimientoSignService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/consentimientos")
@RequiredArgsConstructor
public class PacienteConsentimientoDigitalController {

    private final ConsentimientoSignService signService;

    @GetMapping("/templates/{templateId}/render")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ENFERMERA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ConsentimientoRenderResponse>> render(
            @PathVariable Long templateId,
            @RequestParam Long pacienteId) {
        return ResponseEntity.ok(ApiResponse.success(
                signService.render(templateId, pacienteId)));
    }

    @PostMapping("/templates/{templateId}/firmar")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ENFERMERA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ConsentimientoFirmaResponse>> firmar(
            @PathVariable Long templateId,
            @RequestParam Long pacienteId,
            @Valid @RequestBody ConsentimientoFirmaRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                signService.firmar(templateId, pacienteId, request),
                "Consentimiento firmado exitosamente"));
    }

    @GetMapping("/{id}/pdf")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ENFERMERA') or hasRole('ADMIN')")
    public ResponseEntity<Resource> downloadPdf(@PathVariable Long id) {
        byte[] pdfBytes = signService.loadPdf(id);
        String nombreArchivo = signService.getNombreArchivo(id);

        ByteArrayResource resource = new ByteArrayResource(pdfBytes);

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + nombreArchivo + "\"")
                .contentLength(pdfBytes.length)
                .body(resource);
    }

    @GetMapping("/{id}/verificar")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ENFERMERA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ConsentimientoSignService.VerificacionResult>> verificar(
            @PathVariable Long id) {
        ConsentimientoSignService.VerificacionResult result = signService.verificar(id);
        return ResponseEntity.ok(ApiResponse.success(result));
    }
}
