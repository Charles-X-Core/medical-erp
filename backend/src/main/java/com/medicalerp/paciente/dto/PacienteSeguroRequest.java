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
public class PacienteSeguroRequest {

    private Long id;

    @NotBlank(message = "El tipo de seguro es requerido")
    @Size(max = 50, message = "El tipo de seguro no puede exceder 50 caracteres")
    private String tipoSeguro;

    @NotBlank(message = "El provider es requerido")
    @Size(max = 255, message = "El provider no puede exceder 255 caracteres")
    private String provider;

    @NotBlank(message = "El número de póliza es requerido")
    @Size(max = 100, message = "El número de póliza no puede exceder 100 caracteres")
    private String policyNumber;

    @Size(max = 100, message = "El número de grupo no puede exceder 100 caracteres")
    private String groupNumber;

    private LocalDate fechaInicio;

    private LocalDate fechaFin;

    private Boolean activo;
}
