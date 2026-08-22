package com.medicalerp.documento.controller;

import com.medicalerp.common.dto.ApiResponse;
import com.medicalerp.common.util.SecurityUtils;
import com.medicalerp.documento.dto.DocumentoRequest;
import com.medicalerp.documento.dto.DocumentoResponse;
import com.medicalerp.documento.service.DocumentoService;
import com.medicalerp.seguridad.entity.Usuario;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.nio.file.Path;

/**
 * Documento Controller (API-002)
 * Handles document creation, signing, and PDF download
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/documentos")
@RequiredArgsConstructor
public class DocumentoController {

    private final DocumentoService documentoService;
    private final SecurityUtils securityUtils;

    @PostMapping
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<DocumentoResponse>> create(
            @Valid @RequestBody DocumentoRequest request) {
        Long currentUserId = securityUtils.getCurrentUserId();
        // Create a lightweight user reference (will be resolved in service)
        Usuario usuario = new Usuario();
        usuario.setId(currentUserId);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(
                        documentoService.create(request, usuario),
                        "Documento creado exitosamente"));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<DocumentoResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(documentoService.getById(id)));
    }

    @GetMapping("/paciente/{pacienteId}")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Page<DocumentoResponse>>> getByPaciente(
            @PathVariable Long pacienteId,
            @RequestParam(required = false) String tipo,
            Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(
                documentoService.getByPaciente(pacienteId, tipo, pageable)));
    }

    @GetMapping("/{id}/pdf")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<Resource> downloadPdf(@PathVariable Long id) {
        try {
            Path pdfPath = documentoService.getPdfPath(id);
            Resource resource = new UrlResource(pdfPath.toUri());

            if (!resource.exists()) {
                return ResponseEntity.notFound().build();
            }

            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_PDF)
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "inline; filename=\"documento_" + id + ".pdf\"")
                    .body(resource);

        } catch (Exception e) {
            log.error("Error downloading PDF for document {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PatchMapping("/{id}/firmar")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<DocumentoResponse>> firmar(
            @PathVariable Long id,
            @RequestBody FirmaRequest request) {
        Long currentUserId = securityUtils.getCurrentUserId();
        Usuario usuario = new Usuario();
        usuario.setId(currentUserId);

        return ResponseEntity.ok(ApiResponse.success(
                documentoService.firmar(id, request.getFirmaImagen(), usuario),
                "Documento firmado exitosamente"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        documentoService.delete(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Inner DTO for signature request
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FirmaRequest {
        private String firmaImagen;
    }

}
