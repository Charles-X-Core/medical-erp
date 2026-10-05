package com.medicalerp.consulta.dto;

import com.medicalerp.common.valueobject.SignosVitales;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Consulta Request DTO (DOM-CON-001)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConsultaRequest {

    @NotNull(message = "La historia clínica es obligatoria")
    private Long historiaId;

    private Long citaId;

    private Long tratamientoId;

    @NotNull(message = "La fecha es obligatoria")
    private LocalDateTime fecha;

    @NotBlank(message = "El motivo es obligatorio")
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

}
