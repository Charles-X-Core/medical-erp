package com.medicalerp.membresia.controller;

import com.medicalerp.common.dto.ApiResponse;
import com.medicalerp.common.util.SecurityUtils;
import com.medicalerp.membresia.dto.MembresiaRequest;
import com.medicalerp.membresia.dto.MembresiaResponse;
import com.medicalerp.membresia.service.MembresiaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/membresias")
@RequiredArgsConstructor
public class MembresiaController {

    private final MembresiaService membresiaService;
    private final SecurityUtils securityUtils;

    @GetMapping("/paciente/{pacienteId}")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<MembresiaResponse>>> getByPaciente(@PathVariable Long pacienteId) {
        Long clinicaId = securityUtils.getCurrentClinicaId();
        return ResponseEntity.ok(ApiResponse.success(membresiaService.getByPacienteId(pacienteId, clinicaId)));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<MembresiaResponse>> create(@Valid @RequestBody MembresiaRequest request) {
        Long clinicaId = securityUtils.getCurrentClinicaId();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(membresiaService.create(request, clinicaId), "Membresía creada exitosamente"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<MembresiaResponse>> update(@PathVariable Long id, @Valid @RequestBody MembresiaRequest request) {
        Long clinicaId = securityUtils.getCurrentClinicaId();
        return ResponseEntity.ok(ApiResponse.success(membresiaService.update(id, request, clinicaId), "Membresía actualizada"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        membresiaService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Membresía eliminada"));
    }
}
