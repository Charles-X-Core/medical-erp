package com.medicalerp.timeline.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Respuesta del Timeline del paciente
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TimelineResponse {

    private Long pacienteId;
    private String pacienteNombre;
    private List<TimelineEvent> eventos;

}
