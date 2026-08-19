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

    @Column(name = "fecha_hora", nullable = false)
    private LocalDateTime fechaHora;

    @Column(name = "prioridad", length = 20)
    @Builder.Default
    private String prioridad = "NORMAL";

    @Column(name = "duracion_minutos")
    @Builder.Default
    private Integer duracionMinutos = 30;

    @Column(name = "motivo", length = 500)
    private String motivo;

    @Column(name = "tratamiento_id")
    private Long tratamientoId;

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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "solicitada_por")
    private Usuario solicitadaPor;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Transient
    public LocalDate getFecha() {
        return fechaHora != null ? fechaHora.toLocalDate() : null;
    }

    public void setFecha(LocalDate fecha) {
        if (fechaHora == null) {
            fechaHora = fecha.atStartOfDay();
        } else {
            fechaHora = fecha.atTime(fechaHora.toLocalTime());
        }
    }

    @Transient
    public LocalTime getHora() {
        return fechaHora != null ? fechaHora.toLocalTime() : null;
    }

    public void setHora(LocalTime hora) {
        if (fechaHora == null) {
            fechaHora = LocalDateTime.of(LocalDate.now(), hora);
        } else {
            fechaHora = fechaHora.toLocalDate().atTime(hora);
        }
    }

    public void setFechaHora(LocalDateTime fechaHora) {
        this.fechaHora = fechaHora;
    }

}
