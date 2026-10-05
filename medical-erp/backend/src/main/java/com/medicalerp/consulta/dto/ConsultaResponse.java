package com.medicalerp.consulta.dto;

import com.medicalerp.common.valueobject.SignosVitales;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Consulta Response DTO (DOM-CON-001)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConsultaResponse {

    private Long id;
    private Long historiaId;
    private Long pacienteId;
    private String pacienteNombre;
    private Long citaId;
    private Long tratamientoId;
    private LocalDateTime fecha;
    private String motivo;
    private String motivoInicial;
    private String tiempoEnfermedad;
    private String signosSintomas;
    private String relatoCronologico;
    private SignosVitales signosVitales;
    private String examenClinicoGeneral;
    private List<Diagnostico> diagnosticoLista;
    private PlanTratamiento planTratamiento;
    private String notas;
    private Boolean firmado;
    private Instant firmadoAt;
    private Instant createdAt;
    private Instant updatedAt;

}
