package com.medicalerp.paciente.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Patient Request DTO (DOM-PAC-001)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PacienteRequest {

    @NotBlank(message = "El apellido paterno es requerido")
    @Size(max = 255, message = "El apellido paterno no puede exceder 255 caracteres")
    private String apellidoPaterno;

    @Size(max = 255, message = "El apellido materno no puede exceder 255 caracteres")
    private String apellidoMaterno;

    @NotBlank(message = "Los nombres son requeridos")
    @Size(max = 255, message = "Los nombres no pueden exceder 255 caracteres")
    private String nombres;

    @Size(max = 20, message = "El DNI no puede exceder 20 caracteres")
    private String dni;

    @Size(max = 20, message = "El tipo de documento no puede exceder 20 caracteres")
    private String tipoDocumento;

    @Size(max = 50, message = "El teléfono no puede exceder 50 caracteres")
    private String telefono;

    @Email(message = "El email no es válido")
    @Size(max = 255, message = "El email no puede exceder 255 caracteres")
    private String email;

    private LocalDate fechaNacimiento;

    @Size(max = 10, message = "El sexo no puede exceder 10 caracteres")
    private String sexo;

    @Size(max = 50, message = "El estado civil no puede exceder 50 caracteres")
    private String estadoCivil;

    @Size(max = 255, message = "La dirección línea 1 no puede exceder 255 caracteres")
    private String direccionLinea1;

    @Size(max = 255, message = "La dirección línea 2 no puede exceder 255 caracteres")
    private String direccionLinea2;

    @Size(max = 100, message = "La ciudad no puede exceder 100 caracteres")
    private String ciudad;

    @Size(max = 100, message = "El estado/provincia no puede exceder 100 caracteres")
    private String estadoProvincia;

    @Size(max = 20, message = "El código postal no puede exceder 20 caracteres")
    private String codigoPostal;

    @Size(max = 2, message = "El país no puede exceder 2 caracteres")
    private String direccionPais;

    @Size(max = 255, message = "El lugar de nacimiento no puede exceder 255 caracteres")
    private String lugarNacimiento;

    @Size(max = 255, message = "El lugar de procedencia no puede exceder 255 caracteres")
    private String lugarProcedencia;

    @Size(max = 255, message = "El grado de instrucción no puede exceder 255 caracteres")
    private String gradoInstruccion;

    @Size(max = 255, message = "La ocupación no puede exceder 255 caracteres")
    private String ocupacion;

    @Size(max = 255, message = "El nombre del acompañante no puede exceder 255 caracteres")
    private String nombreAcompanante;

    @Size(max = 255, message = "El contacto de emergencia no puede exceder 255 caracteres")
    private String contactoEmergencia;

    @Size(max = 50, message = "El teléfono de emergencia no puede exceder 50 caracteres")
    private String telefonoEmergencia;

    @Size(max = 100, message = "El parentesco de emergencia no puede exceder 100 caracteres")
    private String parentescoEmergencia;

    private String alergias;

    private String antecedentesPersonales;

    private String antecedentesFamiliares;

}
