package com.medicalerp.paciente.dto.consentimiento;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConsentimientoFirmaRequest {

    @NotBlank(message = "La imagen de firma es requerida")
    private String firmaImagen;

    @Size(max = 45, message = "La IP no puede exceder 45 caracteres")
    private String ipAddress;

    @Size(max = 500, message = "El user agent no puede exceder 500 caracteres")
    private String userAgent;

    private Long tratamientoId;

    private Long consultaId;
}
