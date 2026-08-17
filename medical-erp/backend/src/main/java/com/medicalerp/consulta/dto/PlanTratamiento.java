package com.medicalerp.consulta.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Plan de Tratamiento Value Object (DOM-CON-001)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlanTratamiento {

    private List<Medicamento> medicamentos;
    private String indicaciones;

}
