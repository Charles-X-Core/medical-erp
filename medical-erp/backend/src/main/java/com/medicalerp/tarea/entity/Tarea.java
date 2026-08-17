package com.medicalerp.tarea.entity;

import com.medicalerp.paciente.entity.Paciente;
import com.medicalerp.seguridad.entity.Usuario;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "tareas")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Tarea {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "clinica_id", nullable = false)
    private Long clinicaId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "origen_usuario_id", nullable = false)
    private Usuario origenUsuario;

    @Column(name = "destino_rol", nullable = false, length = 30)
    private String destinoRol;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "paciente_id")
    private Paciente paciente;

    @Column(name = "tipo", nullable = false, length = 30)
    private String tipo;

    @Column(name = "titulo", nullable = false, length = 255)
    private String titulo;

    @Column(name = "descripcion", columnDefinition = "TEXT")
    private String descripcion;

    @Column(name = "estado", nullable = false, length = 20)
    @Builder.Default
    private String estado = "pendiente";

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
