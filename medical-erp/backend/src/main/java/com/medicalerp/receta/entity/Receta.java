package com.medicalerp.receta.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "recetas")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Receta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "clinica_id", nullable = false)
    private Long clinicaId;

    @Column(name = "paciente_id", nullable = false)
    private Long pacienteId;

    @Column(name = "tratamiento_id")
    private Long tratamientoId;

    @Column(name = "sesion_id")
    private Long sesionId;

    @Column(name = "consulta_id")
    private Long consultaId;

    @Column(nullable = false, length = 200)
    private String medicamento;

    @Column(length = 100)
    private String dosis;

    @Column(length = 100)
    private String frecuencia;

    @Column(length = 100)
    private String duracion;

    @Column(columnDefinition = "TEXT")
    private String indicaciones;

    @Column(nullable = false)
    private Instant fecha;

    @Column(name = "archivo_ruta", length = 500)
    private String archivoRuta;

    @CreationTimestamp
    private Instant createdAt;

    @UpdateTimestamp
    private Instant updatedAt;
}
