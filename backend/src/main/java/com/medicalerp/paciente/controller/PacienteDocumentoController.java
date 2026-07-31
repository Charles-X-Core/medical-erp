package com.medicalerp.paciente.controller;

import com.medicalerp.common.dto.ApiResponse;
import com.medicalerp.paciente.dto.PacienteDocumentoRequest;
import com.medicalerp.paciente.dto.PacienteDocumentoResponse;
import com.medicalerp.paciente.service.PacienteDocumentoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/pacientes/{pacienteId}/documentos")
@RequiredArgsConstructor
public class PacienteDocumentoController {

    private final PacienteDocumentoService documentoService;

    @PostMapping
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ENFERMERA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PacienteDocumentoResponse>> create(
            @PathVariable Long pacienteId,
            @Valid @RequestBody PacienteDocumentoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(documentoService.create(pacienteId, request), "Documento creado exitosamente"));
    }

    @GetMapping
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ENFERMERA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<PacienteDocumentoResponse>>> getByPaciente(
            @PathVariable Long pacienteId) {
        return ResponseEntity.ok(ApiResponse.success(documentoService.getByPacienteId(pacienteId)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ENFERMERA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PacienteDocumentoResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(documentoService.getById(id)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PacienteDocumentoResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody PacienteDocumentoRequest request) {
        return ResponseEntity.ok(ApiResponse.success(documentoService.update(id, request), "Documento actualizado"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        documentoService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
