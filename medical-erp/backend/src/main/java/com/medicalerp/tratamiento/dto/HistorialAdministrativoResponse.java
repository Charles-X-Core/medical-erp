package com.medicalerp.tratamiento.dto;

import com.medicalerp.tratamiento.enums.TipoCambioAdministrativo;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Historial Administrativo Response DTO (DOM-TRAT-007)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HistorialAdministrativoResponse {

    private Long id;
    private Long tratamientoId;
    private Long clinicaId;
    private TipoCambioAdministrativo tipoCambio;
    private String campoModificado;
    private String valorAnterior;
    private String valorNuevo;
    private String motivo;
    private Long usuarioId;
    private String usuarioNombre;
    private Instant createdAt;

}
