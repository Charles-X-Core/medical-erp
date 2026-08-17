package com.medicalerp.paciente.controller.consentimiento;

import com.medicalerp.common.dto.ApiResponse;
import com.medicalerp.paciente.dto.consentimiento.ConsentTemplateRequest;
import com.medicalerp.paciente.dto.consentimiento.ConsentTemplateResponse;
import com.medicalerp.paciente.service.consentimiento.ConsentTemplateService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.nio.file.Path;
import java.util.List;

@RestController
@RequestMapping("/api/v1/consentimientos/templates")
@RequiredArgsConstructor
public class ConsentTemplateController {

    private final ConsentTemplateService templateService;

    @GetMapping
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ENFERMERA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<ConsentTemplateResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(templateService.getByClinica()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ENFERMERA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ConsentTemplateResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(templateService.getById(id)));
    }

    @PostMapping
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ConsentTemplateResponse>> create(
            @Valid @ModelAttribute ConsentTemplateRequest request) {
        return ResponseEntity.status(org.springframework.http.HttpStatus.CREATED)
                .body(ApiResponse.success(templateService.create(request),
                        "Template creado exitosamente"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ConsentTemplateResponse>> update(
            @PathVariable Long id,
            @Valid @ModelAttribute ConsentTemplateRequest request) {
        return ResponseEntity.ok(ApiResponse.success(templateService.update(id, request),
                "Template actualizado exitosamente"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        templateService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/archivo")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ENFERMERA') or hasRole('ADMIN')")
    public ResponseEntity<Resource> downloadTemplate(@PathVariable Long id) {
        try {
            Path filePath = templateService.getTemplateFilePath(id);
            Resource resource = new UrlResource(filePath.toUri());

            if (!resource.exists()) {
                return ResponseEntity.notFound().build();
            }

            return ResponseEntity.ok()
                    .contentType(MediaType.TEXT_HTML)
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "inline; filename=\"template_" + id + ".html\"")
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
}
