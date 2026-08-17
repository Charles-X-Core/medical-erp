package com.medicalerp.paciente.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Patient Response DTO (DOM-PAC-001)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PacienteResponse {

    private Long id;
    private Long clinicaId;
    private String apellidoPaterno;
    private String apellidoMaterno;
    private String nombres;
    private String licenciaConducir;
    private String telefono;
    private String email;
    private LocalDate fechaNacimiento;
    private String sexo;
    private String estadoCivil;
    private String direccionLinea1;
    private String direccionLinea2;
    private String ciudad;
    private String estadoProvincia;
    private String codigoPostal;
    private String direccionPais;
    private String lugarNacimiento;
    private String lugarProcedencia;
    private String gradoInstruccion;
    private String ocupacion;
    private String nombreAcompanante;
    private String contactoEmergencia;
    private String telefonoEmergencia;
    private String parentescoEmergencia;
    private String alergias;
    private String antecedentesPersonales;
    private String antecedentesFamiliares;
    private Double peso;
    private Double estatura;
    private String estado;
    private String pais;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private java.util.List<PacienteDocumentoResponse> documentos;
    private java.util.List<PacienteSeguroResponse> seguros;
    private java.util.List<PacienteConsentimientoResponse> consentimientos;

}
