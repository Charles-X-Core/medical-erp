package com.medicalerp.contratopwa.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContratoPwaRequest {
    private Long pacienteId;

    private String templateCode;

    private String firmaImagen;

    private String token;

    private String htmlContent;
}
