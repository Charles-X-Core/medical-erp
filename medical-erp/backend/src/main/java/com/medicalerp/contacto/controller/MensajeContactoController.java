package com.medicalerp.contacto.controller;

import com.medicalerp.common.dto.ApiResponse;
import com.medicalerp.contacto.dto.MensajeContactoRequest;
import com.medicalerp.contacto.dto.MensajeContactoResponse;
import com.medicalerp.contacto.service.MensajeContactoService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * MensajeContacto Controller (API-002, DOM-CON-002)
 * Public POST endpoint for landing page contact form
 * Authenticated endpoints for admin to manage messages
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/contact")
@RequiredArgsConstructor
public class MensajeContactoController {

    private final MensajeContactoService service;

    /**
     * PUBLIC: Submit contact form from landing page
     * No authentication required — accessible by anyone
     */
    @PostMapping
    public ResponseEntity<ApiResponse<MensajeContactoResponse>> create(
            @Valid @RequestBody MensajeContactoRequest request,
            HttpServletRequest httpRequest) {
        log.info("Contact form submitted from IP={}", httpRequest.getRemoteAddr());

        MensajeContactoResponse response = service.create(request, httpRequest);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Mensaje enviado exitosamente. Nos pondremos en contacto pronto."));
    }

    /**
     * List all contact messages (admin only)
     * Filter by estado: pendiente, leido, respondido
     */
    @GetMapping("/messages")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Page<MensajeContactoResponse>>> getAll(
            @RequestParam(required = false) String estado,
            Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(service.findAll(estado, pageable)));
    }

    /**
     * Get single message by ID
     */
    @GetMapping("/messages/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<MensajeContactoResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(service.findById(id)));
    }

    /**
     * Mark message as read
     */
    @PatchMapping("/messages/{id}/leido")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<MensajeContactoResponse>> marcarLeido(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(
                service.marcarLeido(id),
                "Mensaje marcado como leído"));
    }

    /**
     * Mark message as replied
     */
    @PatchMapping("/messages/{id}/respondido")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<MensajeContactoResponse>> marcarRespondido(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(
                service.marcarRespondido(id),
                "Mensaje marcado como respondido"));
    }

    /**
     * Soft delete message (admin only)
     */
    @DeleteMapping("/messages/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

}
