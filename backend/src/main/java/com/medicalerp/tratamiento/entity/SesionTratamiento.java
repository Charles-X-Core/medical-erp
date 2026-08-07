package com.medicalerp.tratamiento.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * SesionTratamiento Entity (DOM-TRAT-003)
 * Sesion individual de un tratamiento
 */
@Entity
@Table(name = "sesiones_tratamiento")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SesionTratamiento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tratamiento_id", nullable = false)
    private Long tratamientoId;

    @Column(name = "cita_id")
    private Long citaId;

    @Column(name = "clinica_id", nullable = false)
    private Long clinicaId;

    @Column(name = "tipo_sesion_id", nullable = false)
    private Long tipoSesionId;

    @Column(name = "numero_sesion", nullable = false)
    private Integer numeroSesion;

    @Column(name = "fecha", nullable = false)
    private LocalDateTime fecha;

    @Column(name = "motivo_visita", length = 500)
    private String motivoVisita;

    @Column(name = "signos_vitales", columnDefinition = "JSON")
    private String signosVitales;

    @Column(name = "procedimiento_realizado", columnDefinition = "TEXT")
    private String procedimientoRealizado;

    @Column(name = "medicamentos", length = 1000)
    private String medicamentos;

    @Column(name = "dosis", length = 500)
    private String dosis;

    @Column(name = "observaciones", columnDefinition = "TEXT")
    private String observaciones;

    @Column(name = "evolucion", columnDefinition = "TEXT")
    private String evolucion;

    @Column(name = "costo_sesion", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal costoSesion = BigDecimal.ZERO;

    @Column(name = "requiere_cita")
    @Builder.Default
    private Boolean requiereCita = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

}
