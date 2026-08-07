package com.medicalerp.agenda.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * TipoCita Entity (DOM-AGE-001)
 */
@Entity
@Table(name = "tipos_cita")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TipoCita {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nombre", nullable = false, unique = true, length = 100)
    private String nombre;

    @Column(name = "duracion_minutos")
    @Builder.Default
    private Integer duracionMinutos = 30;

    @Column(name = "buffer_minutos")
    @Builder.Default
    private Integer bufferMinutos = 0;

    @Column(name = "prioridad_default", length = 20)
    @Builder.Default
    private String prioridadDefault = "NORMAL";

    @Column(name = "requiere_tratamiento")
    @Builder.Default
    private Boolean requiereTratamiento = false;

    @Column(name = "descripcion", length = 255)
    private String descripcion;

    @Column(name = "activo")
    @Builder.Default
    private Boolean activo = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

}
