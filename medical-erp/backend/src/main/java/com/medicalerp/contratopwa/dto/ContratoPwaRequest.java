package com.medicalerp.contratopwa.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContratoPwaRequest {
    @NotNull(message = "pacienteId es requerido")
    private Long pacienteId;

    @NotBlank(message = "templateCode es requerido")
    private String templateCode;

    private String firmaImagen;

    private String token;
}
