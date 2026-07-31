package com.medicalerp.consulta.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Diagnostico Value Object (DOM-CON-001)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Diagnostico {

    private String codigo;
    private String descripcion;
    private Boolean principal;

}
