package com.medicalerp.dashboard.controller;

import com.medicalerp.common.dto.ApiResponse;
import com.medicalerp.common.util.SecurityUtils;
import com.medicalerp.dashboard.dto.DashboardResumenResponse;
import com.medicalerp.dashboard.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Dashboard Controller (API-DASH-001)
 * Resumen operativo por clínica, según rol.
 */
@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;
    private final SecurityUtils securityUtils;

    @GetMapping("/resumen")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ENFERMERA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<DashboardResumenResponse>> resumen() {
        Long clinicaId = securityUtils.getCurrentClinicaId();
        return ResponseEntity.ok(ApiResponse.success(dashboardService.obtenerResumen(clinicaId)));
    }

}
