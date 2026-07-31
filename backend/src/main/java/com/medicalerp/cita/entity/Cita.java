package com.medicalerp.cita.entity;

import com.medicalerp.agenda.entity.TipoCita;
import com.medicalerp.paciente.entity.Paciente;
import com.medicalerp.seguridad.entity.Usuario;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * Cita Entity (DOM-CIT-001)
 */
@Entity
@Table(name = "citas")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Cita {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "paciente_id", nullable = false)
    private Paciente paciente;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tipo_cita_id")
    private TipoCita tipoCita;

    @Column(name = "fecha", nullable = false)
    private LocalDate fecha;

    @Column(name = "hora", nullable = false)
    private LocalTime hora;

    @Column(name = "duracion_minutos")
    @Builder.Default
    private Integer duracionMinutos = 30;

    @Column(name = "motivo", nullable = false, length = 500)
    private String motivo;

    @Column(name = "motivo_editado", length = 500)
    private String motivoEditado;

    @Column(name = "estado", length = 20)
    @Builder.Default
    private String estado = "pendiente";

    @Column(name = "consulta_id")
    private Long consultaId;

    @Column(name = "notas", columnDefinition = "TEXT")
    private String notas;

    @Column(name = "asistio_confirmed_at")
    private LocalDateTime asistioConfirmedAt;

    @Column(name = "cancelado_at")
    private LocalDateTime canceladoAt;

    @Column(name = "cancelado_motivo", length = 500)
    private String canceladoMotivo;

    @Column(name = "reprogramada_de")
    private Long reprogramadaDe;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

}
