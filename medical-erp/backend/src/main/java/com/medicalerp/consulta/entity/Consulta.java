package com.medicalerp.consulta.entity;

import com.medicalerp.historia.entity.HistoriaClinica;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.time.LocalDateTime;

/**
 * Consulta Entity (DOM-CON-001)
 */
@Entity
@Table(name = "consultas")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Consulta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "historia_id", nullable = false)
    private HistoriaClinica historia;

    @Column(name = "cita_id")
    private Long citaId;

    @Column(name = "tratamiento_id")
    private Long tratamientoId;

    @Column(name = "fecha", nullable = false)
    private LocalDateTime fecha;

    @Column(name = "motivo", nullable = false, length = 500)
    private String motivo;

    @Column(name = "motivo_inicial", length = 500)
    private String motivoInicial;

    @Column(name = "tiempo_enfermedad", length = 255)
    private String tiempoEnfermedad;

    @Column(name = "signos_sintomas", columnDefinition = "TEXT")
    private String signosSintomas;

    @Column(name = "relato_cronologico", columnDefinition = "TEXT")
    private String relatoCronologico;

    @Column(name = "signos_vitales", columnDefinition = "TEXT")
    private String signosVitales; // JSON serialized

    @Column(name = "examen_clinico_general", columnDefinition = "TEXT")
    private String examenClinicoGeneral;

    @Column(name = "diagnostico_lista", columnDefinition = "TEXT")
    private String diagnosticoLista; // JSON serialized

    @Column(name = "plan_tratamiento", columnDefinition = "TEXT")
    private String planTratamiento; // JSON serialized

    @Column(name = "notas", columnDefinition = "TEXT")
    private String notas;

    @Column(name = "firmado")
    @Builder.Default
    private Boolean firmado = false;

    @Column(name = "firmado_at")
    private Instant firmadoAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private java.time.Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private java.time.Instant updatedAt;

}
