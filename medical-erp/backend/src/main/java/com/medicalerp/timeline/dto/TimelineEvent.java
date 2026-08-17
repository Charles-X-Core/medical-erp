package com.medicalerp.timeline.dto;

import com.medicalerp.timeline.enums.TimelineTipo;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Evento individual del Timeline
 * Refleja el estado REAL de cada entidad, no un estado inventado
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TimelineEvent {

    private Long id;
    private TimelineTipo tipo;
    private String estadoOriginal;
    private LocalDateTime fecha;
    private String titulo;
    private String descripcion;
    private Long referenciaId;

}
