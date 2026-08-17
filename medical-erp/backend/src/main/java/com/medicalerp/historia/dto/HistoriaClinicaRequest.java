package com.medicalerp.historia.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Historia Clinica Request DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HistoriaClinicaRequest {

    @NotNull(message = "El paciente es requerido")
    private Long pacienteId;

    private String numeroHistoria;
    private String alergiaMedicamentos;
    private String cardiopatiasPersonales;
    private String cardiopatiasFamiliares;
    private String diabetesPersonal;
    private String diabetesFamiliar;
    private String hepatitis;
    private String propensionHemorragias;
    private String complicacionesAnestesia;
    private String presionArterialMedicacion;
    private String enfermedadActualMedicacion;
    private String otrasEnfermedades;
    private String observaciones;

}
