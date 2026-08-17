package com.medicalerp.tratamiento.dto;

import com.medicalerp.tratamiento.enums.TipoCambioClinico;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Historial Clinico Response DTO (DOM-TRAT-006)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HistorialClinicoResponse {

    private Long id;
    private Long tratamientoId;
    private Long clinicaId;
    private TipoCambioClinico tipoCambio;
    private String campoModificado;
    private String valorAnterior;
    private String valorNuevo;
    private String motivo;
    private Long usuarioId;
    private String usuarioNombre;
    private LocalDateTime createdAt;

}
