package com.medicalerp.paciente.controller;

import com.medicalerp.paciente.dto.ImportResult;
import com.medicalerp.paciente.service.PacienteImportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/pacientes/import")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('DOCTORA','ADMIN')")
public class PacienteImportController {

    private final PacienteImportService importService;

    @PostMapping("/csv")
    public ResponseEntity<ImportResult> importCsv(@RequestParam("file") MultipartFile file) {
        ImportResult result = importService.importCsv(file);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/excel")
    public ResponseEntity<ImportResult> importExcel(@RequestParam("file") MultipartFile file) {
        ImportResult result = importService.importExcel(file);
        return ResponseEntity.ok(result);
    }
}
