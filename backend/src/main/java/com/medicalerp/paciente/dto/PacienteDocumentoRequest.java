package com.medicalerp.paciente.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PacienteDocumentoRequest {

    private Long id;

    @NotBlank(message = "El tipo de documento es requerido")
    @Size(max = 30, message = "El tipo de documento no puede exceder 30 caracteres")
    private String tipoDocumento;

    @NotBlank(message = "El número de documento es requerido")
    @Size(max = 50, message = "El número de documento no puede exceder 50 caracteres")
    private String numeroDocumento;

    @Size(max = 2, message = "El país de emisión no puede exceder 2 caracteres")
    private String paisEmision;

    private LocalDate fechaVencimiento;

    private Boolean esPrincipal;
}
