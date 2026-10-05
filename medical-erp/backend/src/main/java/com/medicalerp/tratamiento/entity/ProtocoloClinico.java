package com.medicalerp.tratamiento.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

/**
 * ProtocoloClinico Entity (DOM-TRAT-002)
 * Protocolo clinico asociado a un tratamiento (obligatorio para el negocio)
 */
@Entity
@Table(name = "protocolos_clinicos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProtocoloClinico {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tratamiento_id", nullable = false, unique = true)
    private Long tratamientoId;

    @Column(name = "clinica_id", nullable = false)
    private Long clinicaId;

    @Column(name = "frecuencia_dias")
    private Integer frecuenciaDias;

    @Column(name = "duracion_sesion_minutos")
    @Builder.Default
    private Integer duracionSesionMinutos = 60;

    @Column(name = "notas_protocolo", columnDefinition = "TEXT")
    private String notasProtocolo;

    @Column(name = "permite_inicio_inmediato")
    @Builder.Default
    private Boolean permiteInicioInmediato = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

}
