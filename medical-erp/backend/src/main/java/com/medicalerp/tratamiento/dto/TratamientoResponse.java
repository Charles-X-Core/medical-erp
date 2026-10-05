package com.medicalerp.tratamiento.dto;

import com.medicalerp.tratamiento.enums.EstadoTratamiento;
import com.medicalerp.tratamiento.enums.ProximaAccion;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Instant;
import java.util.List;

/**
 * Tratamiento Response DTO (DOM-TRAT-001)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TratamientoResponse {

    private Long id;
    private Long clinicaId;
    private Long pacienteId;
    private String pacienteNombre;
    private Long historiaClinicaId;
    private Long consultaOrigenId;
    private String tipoTratamiento;
    private String diagnosticoInicial;
    private String objetivo;
    private LocalDate fechaInicio;
    private LocalDate fechaFin;
    private EstadoTratamiento estado;
    private Integer sesionesPlaneadas;
    private Integer sesionesRealizadas;
    private Integer sesionesRestantes;
    private BigDecimal costoEstimado;
    private BigDecimal costoTotal;
    private String modoCosto;
    private String observaciones;
    private String resultadoFinal;
    private String motivoCancelacion;
    private String motivoPausa;
    private Long usuarioAsignadoId;
    private String usuarioAsignadoNombre;
    private Boolean requiereMedicacion;

    private ProtocoloClinicoResponse protocolo;
    private ProximaAccion proximaAccion;
    private List<TratamientoAlertaResponse> alertas;
    private String mensaje;

    private Instant createdAt;
    private Instant updatedAt;

}
