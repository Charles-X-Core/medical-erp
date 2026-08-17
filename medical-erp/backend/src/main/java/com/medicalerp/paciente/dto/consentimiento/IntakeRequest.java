package com.medicalerp.paciente.dto.consentimiento;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IntakeRequest {

    private PacienteRegistroRapidoRequest paciente;
    private java.util.List<ConsentimientoIntakeRequest> consentimientos;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PacienteRegistroRapidoRequest {

        @jakarta.validation.constraints.NotBlank(message = "El apellido paterno es requerido")
        private String apellidoPaterno;

        private String apellidoMaterno;

        @jakarta.validation.constraints.NotBlank(message = "Los nombres son requeridos")
        private String nombres;

        @jakarta.validation.constraints.NotBlank(message = "El ID es requerido")
        @jakarta.validation.constraints.Size(min = 8, max = 20, message = "El ID debe tener entre 8 y 20 caracteres")
        private String licenciaConducir;
        private String telefono;

        @jakarta.validation.constraints.Email(message = "El email no es valido")
        private String email;

        private java.time.LocalDate fechaNacimiento;
        private String sexo;

        private String direccionLinea1;
        private String direccionLinea2;
        private String ciudad;
        private String estadoProvincia;
        private String codigoPostal;
        private String direccionPais;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ConsentimientoIntakeRequest {

        @jakarta.validation.constraints.NotBlank(message = "El tipo de consentimiento es requerido")
        private String tipo;

        private String firmaImagen;
        private String version;
        private Long tratamientoId;
        private Long consultaId;
    }
}
