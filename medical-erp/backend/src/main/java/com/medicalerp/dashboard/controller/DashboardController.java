package com.medicalerp.dashboard.controller;

import com.medicalerp.common.dto.ApiResponse;
import com.medicalerp.common.util.SecurityUtils;
import com.medicalerp.dashboard.dto.DashboardPollResponse;
import com.medicalerp.dashboard.dto.DashboardResumenResponse;
import com.medicalerp.dashboard.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Dashboard Controller (API-DASH-001)
 * Resumen operativo por clínica, filtrado por rol.
 */
@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;
    private final SecurityUtils securityUtils;

    @GetMapping("/resumen")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<DashboardResumenResponse>> resumen() {
        Long clinicaId = securityUtils.getCurrentClinicaId();
        Long userId = securityUtils.getCurrentUserId();
        String rol = getCurrentUserRol();
        return ResponseEntity.ok(ApiResponse.success(dashboardService.obtenerResumen(clinicaId, userId, rol)));
    }

    @GetMapping("/poll")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<DashboardPollResponse>> poll() {
        Long clinicaId = securityUtils.getCurrentClinicaId();
        Long userId = securityUtils.getCurrentUserId();
        String rol = getCurrentUserRol();
        return ResponseEntity.ok(ApiResponse.success(dashboardService.obtenerPoll(clinicaId, userId, rol)));
    }

    private String getCurrentUserRol() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return "DOCTORA";
        return auth.getAuthorities().stream()
                .map(a -> a.getAuthority().replace("ROLE_", ""))
                .findFirst()
                .orElse("DOCTORA");
    }

}
