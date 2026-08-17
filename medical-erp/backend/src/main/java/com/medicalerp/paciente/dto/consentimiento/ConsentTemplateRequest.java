package com.medicalerp.paciente.dto.consentimiento;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.web.multipart.MultipartFile;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConsentTemplateRequest {

    @NotBlank(message = "El codigo del template es requerido")
    private String codigo;

    @NotBlank(message = "La version es requerida")
    private String version;

    @NotBlank(message = "El titulo es requerido")
    private String titulo;

    @NotNull(message = "El archivo del template es requerido")
    private MultipartFile archivoTemplate;

    private String variablesRequeridas;

    private String variablesVersion;

    private Boolean requiereFirma;

    private Boolean requiereFecha;
}
