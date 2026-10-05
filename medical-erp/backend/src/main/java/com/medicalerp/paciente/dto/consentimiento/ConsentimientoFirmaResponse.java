package com.medicalerp.paciente.dto.consentimiento;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConsentimientoFirmaResponse {

    private Boolean firmado;
    private Long consentimientoId;
    private String hashDocumento;
    private String nombreArchivo;
    private Instant firmaFecha;
}
