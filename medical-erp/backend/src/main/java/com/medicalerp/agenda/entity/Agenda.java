package com.medicalerp.agenda.entity;

import com.medicalerp.seguridad.entity.Usuario;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Agenda Entity (DOM-AGE-001)
 */
@Entity
@Table(name = "agendas")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Agenda {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false, unique = true)
    private Usuario usuario;

    @Column(name = "nombre", nullable = false, length = 255)
    @Builder.Default
    private String nombre = "Mi Agenda";

    @OneToMany(mappedBy = "agenda", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Disponibilidad> disponibilidades = new ArrayList<>();

    @OneToMany(mappedBy = "agenda", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Bloqueo> bloqueos = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

}
