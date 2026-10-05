package com.medicalerp.paciente.controller;

import com.medicalerp.auditoria.service.AccessLogService;
import com.medicalerp.common.dto.ApiResponse;
import com.medicalerp.common.util.JsonMapperHelper;
import com.medicalerp.common.util.SecurityUtils;
import com.medicalerp.common.valueobject.SignosVitales;
import com.medicalerp.consulta.entity.Consulta;
import com.medicalerp.consulta.repository.ConsultaRepository;
import com.medicalerp.paciente.dto.PacienteCompletoRequest;
import com.medicalerp.paciente.dto.PacienteRequest;
import com.medicalerp.paciente.dto.PacienteResponse;
import com.medicalerp.paciente.dto.consentimiento.IntakeRequest;
import com.medicalerp.paciente.dto.consentimiento.IntakeResponse;
import com.medicalerp.paciente.entity.Paciente;
import com.medicalerp.paciente.repository.PacienteRepository;
import com.medicalerp.paciente.service.PacienteService;
import com.medicalerp.tratamiento.entity.SesionTratamiento;
import com.medicalerp.tratamiento.repository.SesionTratamientoRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Patient Controller (API-002)
 */
@RestController
@RequestMapping("/api/v1/pacientes")
@RequiredArgsConstructor
public class PacienteController {

    private final PacienteService pacienteService;
    private final AccessLogService accessLogService;
    private final SecurityUtils securityUtils;
    private final ConsultaRepository consultaRepository;
    private final SesionTratamientoRepository sesionTratamientoRepository;
    private final PacienteRepository pacienteRepository;
    private final JsonMapperHelper jsonHelper;

    @PostMapping
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PacienteResponse>> create(@Valid @RequestBody PacienteRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(pacienteService.create(request), "Paciente creado exitosamente"));
    }

    @PostMapping("/full")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PacienteResponse>> createCompleto(
            @Valid @RequestBody PacienteCompletoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(pacienteService.createCompleto(request), "Paciente creado exitosamente"));
    }

    @GetMapping
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Page<PacienteResponse>>> getAll(Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(pacienteService.getAll(pageable)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PacienteResponse>> getById(
            @PathVariable Long id,
            HttpServletRequest httpRequest) {
        PacienteResponse response = pacienteService.getById(id);
        accessLogService.log(
                securityUtils.getCurrentClinicaId(),
                "VIEW",
                "PACIENTE",
                id,
                securityUtils.getCurrentUserEmail(),
                httpRequest.getRemoteAddr(),
                httpRequest.getHeader("User-Agent")
        );
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PacienteResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody PacienteRequest request) {
        return ResponseEntity.ok(ApiResponse.success(pacienteService.update(id, request), "Paciente actualizado"));
    }

    @PutMapping("/full/{id}")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PacienteResponse>> updateCompleto(
            @PathVariable Long id,
            @Valid @RequestBody PacienteCompletoRequest request) {
        return ResponseEntity.ok(ApiResponse.success(pacienteService.updateCompleto(id, request), "Paciente actualizado"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        pacienteService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/activate")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<Void> activate(@PathVariable Long id) {
        pacienteService.activate(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/buscar")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Page<PacienteResponse>>> search(
            @RequestParam String q,
            Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(pacienteService.search(q, pageable)));
    }

    @GetMapping("/estado/{estado}")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Page<PacienteResponse>>> getByEstado(
            @PathVariable String estado,
            Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(pacienteService.getByEstado(estado, pageable)));
    }

    @PostMapping("/intake")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<IntakeResponse>> intake(
            @Valid @RequestBody IntakeRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(pacienteService.intake(request),
                        "Intake completado exitosamente"));
    }

    @PatchMapping("/{id}/signos-vitales")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PacienteResponse>> updateSignosVitales(
            @PathVariable Long id,
            @RequestBody com.medicalerp.paciente.dto.SignosVitalesPacienteRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                pacienteService.updateSignosVitales(id, request), "Signos vitales actualizados"));
    }

    @GetMapping("/{id}/ultimos-signos-vitales")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getUltimosSignosVitales(
            @PathVariable Long id) {
        Map<String, Object> result = new HashMap<>();
        result.put("peso", null);
        result.put("talla", null);
        result.put("fecha", null);
        result.put("fuente", null);

        // Buscar en consultas más recientes con signos vitales
        List<Consulta> consultas = consultaRepository.findConSignosVitalesByPacienteId(id);
        LocalDateTime fechaConsulta = null;
        String svConsultaJson = null;

        if (!consultas.isEmpty()) {
            Consulta ultima = consultas.get(0);
            fechaConsulta = ultima.getFecha();
            svConsultaJson = ultima.getSignosVitales();
        }

        // Buscar en sesiones de tratamiento más recientes con signos vitales
        List<SesionTratamiento> sesiones = sesionTratamientoRepository.findConSignosVitalesByPacienteId(id);
        LocalDateTime fechaSesion = null;
        String svSesionJson = null;

        if (!sesiones.isEmpty()) {
            SesionTratamiento ultima = sesiones.get(0);
            fechaSesion = ultima.getFecha();
            svSesionJson = ultima.getSignosVitales();
        }

        // Usar la más reciente de ambas fuentes
        String svJson = null;
        String fuente = null;
        if (fechaConsulta != null && fechaSesion != null) {
            if (fechaConsulta.isAfter(fechaSesion)) {
                svJson = svConsultaJson;
                fuente = "consulta";
            } else {
                svJson = svSesionJson;
                fuente = "sesion";
            }
        } else if (fechaConsulta != null) {
            svJson = svConsultaJson;
            fuente = "consulta";
        } else if (fechaSesion != null) {
            svJson = svSesionJson;
            fuente = "sesion";
        }

        if (svJson != null && !svJson.isBlank()) {
            try {
                SignosVitales sv = jsonHelper.fromJson(svJson, SignosVitales.class);
                result.put("peso", sv.getPeso());
                result.put("talla", sv.getTalla());
                result.put("fecha", fechaConsulta != null && fechaConsulta.isAfter(fechaSesion != null ? fechaSesion : LocalDateTime.MIN)
                        ? fechaConsulta : fechaSesion);
                result.put("fuente", fuente);
            } catch (Exception e) {
                // ignore parse errors
            }
        }

        // También incluir peso/talla del entity del paciente como fallback
        Paciente paciente = pacienteRepository.findById(id).orElse(null);
        if (paciente != null) {
            result.put("pesoEntity", paciente.getPeso());
            result.put("estaturaEntity", paciente.getEstatura());
        }

        return ResponseEntity.ok(ApiResponse.success(result));
    }

}
