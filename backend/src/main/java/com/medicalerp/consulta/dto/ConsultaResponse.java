package com.medicalerp.consulta.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

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
    private LocalDateTime fecha;
    private String motivo;
    private String tiempoEnfermedad;
    private String signosSintomas;
    private String relatoCronologico;
    private SignosVitales signosVitales;
    private String examenClinicoGeneral;
    private List<Diagnostico> diagnosticoLista;
    private PlanTratamiento planTratamiento;
    private String notas;
    private Boolean firmado;
    private LocalDateTime firmadoAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

}
