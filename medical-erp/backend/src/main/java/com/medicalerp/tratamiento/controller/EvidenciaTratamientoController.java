package com.medicalerp.tratamiento.controller;

import com.medicalerp.common.dto.ApiResponse;
import com.medicalerp.tratamiento.dto.EvidenciaTratamientoResponse;
import com.medicalerp.tratamiento.enums.TipoEvidencia;
import com.medicalerp.tratamiento.service.EvidenciaTratamientoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/evidencias")
@RequiredArgsConstructor
public class EvidenciaTratamientoController {

    private final EvidenciaTratamientoService evidenciaService;

    @GetMapping("/paciente/{pacienteId}")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getByPaciente(
            @PathVariable Long pacienteId) {
        return ResponseEntity.ok(ApiResponse.success(
                evidenciaService.findByPacienteIdGroupedByTratamiento(pacienteId)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<EvidenciaTratamientoResponse>> getById(
            @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(evidenciaService.findById(id)));
    }

    @GetMapping("/file/**")
    public ResponseEntity<byte[]> getFile(HttpServletRequest request) {
        String fileName = extractFileName(request, "/api/v1/evidencias/file/");
        return serveFile(fileName, "inline");
    }

    @GetMapping("/download/**")
    public ResponseEntity<byte[]> downloadFile(HttpServletRequest request) {
        String fileName = extractFileName(request, "/api/v1/evidencias/download/");
        return serveFile(fileName, "attachment");
    }

    private ResponseEntity<byte[]> serveFile(String fileName, String disposition) {
        if (fileName == null || fileName.isBlank()) {
            return ResponseEntity.notFound().build();
        }
        try {
            Path filePath = evidenciaService.getFilePath(fileName);
            byte[] bytes = Files.readAllBytes(filePath);
            String contentType = Files.probeContentType(filePath);
            if (contentType == null) contentType = "application/octet-stream";

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_TYPE, contentType)
                    .header(HttpHeaders.CONTENT_DISPOSITION, disposition + "; filename=\"" + fileName + "\"")
                    .body(bytes);
        } catch (IOException e) {
            return ResponseEntity.notFound().build();
        }
    }

    private String extractFileName(HttpServletRequest request, String prefix) {
        String uri = request.getRequestURI();
        if (uri.startsWith(prefix)) {
            return java.net.URLDecoder.decode(uri.substring(prefix.length()), java.nio.charset.StandardCharsets.UTF_8);
        }
        return null;
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        evidenciaService.eliminar(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Evidencia eliminada"));
    }

    @PostMapping("/sesion/{sesionId}")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<EvidenciaTratamientoResponse>>> uploadBatch(
            @PathVariable Long sesionId,
            @RequestParam("tipo") TipoEvidencia tipo,
            @RequestParam(value = "descripcion", required = false) String descripcion,
            @RequestParam("files") MultipartFile[] files) {
        return ResponseEntity.ok(ApiResponse.success(
                evidenciaService.subirBatch(sesionId, tipo, descripcion, files),
                "Evidencias subidas exitosamente"));
    }

    @PostMapping("/tratamiento/{tratamientoId}")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<EvidenciaTratamientoResponse>>> uploadBatchTratamiento(
            @PathVariable Long tratamientoId,
            @RequestParam("tipo") TipoEvidencia tipo,
            @RequestParam(value = "descripcion", required = false) String descripcion,
            @RequestParam("files") MultipartFile[] files) {
        return ResponseEntity.ok(ApiResponse.success(
                evidenciaService.subirBatchTratamiento(tratamientoId, tipo, descripcion, files),
                "Evidencias subidas exitosamente"));
    }

    @PostMapping("/{id}/enviar-paciente")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> sendToPatient(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String asunto = body.getOrDefault("asunto", "Evidencia clínica - Optimal Health NOW");
        String mensaje = body.getOrDefault("mensaje", "");
        evidenciaService.enviarAPaciente(id, asunto, mensaje);
        return ResponseEntity.ok(ApiResponse.success(null, "Evidencia enviada al paciente"));
    }
}
