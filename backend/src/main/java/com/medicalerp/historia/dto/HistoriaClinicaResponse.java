package com.medicalerp.historia.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Historia Clinica Response DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HistoriaClinicaResponse {

    private Long id;
    private Long pacienteId;
    private String pacienteNombre;
    private String numeroHistoria;
    private String alergiaMedicamentos;
    private String cardiopatiasPersonales;
    private String cardiopatiasFamiliares;
    private String diabetesPersonal;
    private String diabetesFamiliar;
    private String hepatitis;
    private String otrasEnfermedades;
    private String observaciones;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

}
