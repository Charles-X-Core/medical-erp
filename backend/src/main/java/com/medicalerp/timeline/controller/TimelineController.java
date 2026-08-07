package com.medicalerp.timeline.controller;

import com.medicalerp.common.dto.ApiResponse;
import com.medicalerp.timeline.dto.TimelineResponse;
import com.medicalerp.timeline.service.TimelineService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Timeline Controller
 * Proyección cronológica de eventos del paciente
 */
@RestController
@RequestMapping("/api/v1/timeline")
@RequiredArgsConstructor
public class TimelineController {

    private final TimelineService timelineService;

    @GetMapping("/paciente/{pacienteId}")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ENFERMERA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<TimelineResponse>> getTimeline(@PathVariable Long pacienteId) {
        return ResponseEntity.ok(ApiResponse.success(timelineService.getTimeline(pacienteId)));
    }

}
