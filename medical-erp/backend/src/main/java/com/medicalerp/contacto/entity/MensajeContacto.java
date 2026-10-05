package com.medicalerp.contacto.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

/**
 * MensajeContacto Entity (DOM-CON-002)
 * Stores contact form submissions from landing page
 */
@Entity
@Table(name = "mensajes_contacto")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MensajeContacto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nombre", nullable = false, length = 255)
    private String nombre;

    @Column(name = "email", nullable = false, length = 255)
    private String email;

    @Column(name = "telefono", length = 50)
    private String telefono;

    @Column(name = "asunto", length = 255)
    private String asunto;

    @Column(name = "mensaje", nullable = false, columnDefinition = "TEXT")
    private String mensaje;

    @Column(name = "estado", length = 20)
    @Builder.Default
    private String estado = "pendiente";

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "user_agent", length = 500)
    private String userAgent;

    @Column(name = "read_at")
    private Instant readAt;

    @Column(name = "replied_at")
    private Instant repliedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

}
