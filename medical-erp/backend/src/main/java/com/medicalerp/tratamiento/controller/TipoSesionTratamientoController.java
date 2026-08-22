package com.medicalerp.tratamiento.controller;

import com.medicalerp.common.dto.ApiResponse;
import com.medicalerp.tratamiento.dto.TipoSesionTratamientoResponse;
import com.medicalerp.tratamiento.service.TipoSesionTratamientoService;
import com.medicalerp.common.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * TipoSesionTratamiento Controller (API-TRAT-005)
 * Catalogo de tipos de sesion
 */
@RestController
@RequestMapping("/api/v1/tipos-sesion-tratamiento")
@RequiredArgsConstructor
public class TipoSesionTratamientoController {

    private final TipoSesionTratamientoService service;
    private final SecurityUtils securityUtils;

    @GetMapping
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<TipoSesionTratamientoResponse>>> listar() {
        Long clinicaId = securityUtils.getCurrentClinicaId();
        return ResponseEntity.ok(ApiResponse.success(service.findAllByClinica(clinicaId)));
    }

}
