package com.medicalerp.contratopwa.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContratoPwaResponse {
    private Long sessionId;
    private String token;
    private String status;
    private String pacienteNombre;
    private Long pacienteId;
    private Long consentimientoId;
    private String htmlContent;
    private String mensaje;
    private String contratoStoragePath;
}
