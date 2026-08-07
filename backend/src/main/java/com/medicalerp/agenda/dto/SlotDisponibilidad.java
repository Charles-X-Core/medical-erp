package com.medicalerp.agenda.dto;

import com.medicalerp.agenda.enums.SlotEstado;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * Slot de disponibilidad calculado por AvailabilityEngine
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SlotDisponibilidad {

    private LocalDate fecha;
    private LocalTime inicio;
    private LocalTime fin;
    private SlotEstado estado;
    private String descripcion;
    private Integer duracionDisponible;

}
