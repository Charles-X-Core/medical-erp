package com.medicalerp.receta.controller;

import com.medicalerp.common.dto.ApiResponse;
import com.medicalerp.receta.dto.RecetaRequest;
import com.medicalerp.receta.dto.RecetaResponse;
import com.medicalerp.receta.service.RecetaService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/recetas")
@RequiredArgsConstructor
public class RecetaController {

    private final RecetaService recetaService;

    @PostMapping
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<RecetaResponse>> create(@Valid @RequestBody RecetaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(recetaService.create(request), "Receta creada exitosamente"));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<RecetaResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(recetaService.getById(id)));
    }

    @GetMapping("/paciente/{pacienteId}")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<RecetaResponse>>> getByPaciente(@PathVariable Long pacienteId) {
        return ResponseEntity.ok(ApiResponse.success(recetaService.getByPaciente(pacienteId)));
    }

    @GetMapping("/sesion/{sesionId}")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<RecetaResponse>>> getBySesion(@PathVariable Long sesionId) {
        return ResponseEntity.ok(ApiResponse.success(recetaService.getBySesion(sesionId)));
    }

    @GetMapping("/tratamiento/{tratamientoId}")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<RecetaResponse>>> getByTratamiento(@PathVariable Long tratamientoId) {
        return ResponseEntity.ok(ApiResponse.success(recetaService.getByTratamiento(tratamientoId)));
    }

    @GetMapping("/{id}/pdf")
    public ResponseEntity<byte[]> downloadPdf(@PathVariable Long id) {
        return recetaService.getPdf(id);
    }

    @PostMapping("/{id}/enviar")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> enviarPorEmail(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String asunto = body.getOrDefault("asunto", "Receta Médica - Optimal Health NOW");
        String mensaje = body.getOrDefault("mensaje", "");
        recetaService.enviarPorEmail(id, asunto, mensaje);
        return ResponseEntity.ok(ApiResponse.success(null, "Receta enviada por email al paciente"));
    }
}
