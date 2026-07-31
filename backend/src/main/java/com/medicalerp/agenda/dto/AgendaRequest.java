package com.medicalerp.agenda.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Agenda Request DTO (DOM-AGE-001)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AgendaRequest {

    @NotNull(message = "El usuario es requerido")
    private Long usuarioId;

    @NotBlank(message = "El nombre es requerido")
    private String nombre;

    private List<DisponibilidadRequest> disponibilidades;

}
