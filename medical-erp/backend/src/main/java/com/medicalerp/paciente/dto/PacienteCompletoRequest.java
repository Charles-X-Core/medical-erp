package com.medicalerp.paciente.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PacienteCompletoRequest {

    @Valid
    private PacienteRequest paciente;

    @Valid
    @Size(max = 10, message = "Máximo 10 documentos")
    private List<PacienteDocumentoRequest> documentos;

    @Valid
    @Size(max = 5, message = "Máximo 5 seguros")
    private List<PacienteSeguroRequest> seguros;

    @Valid
    @Size(max = 10, message = "Máximo 10 consentimientos")
    private List<PacienteConsentimientoRequest> consentimientos;
}
