package com.medicalerp.contratopwa.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "contrato_signing_sessions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContratoSigningSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "clinica_id", nullable = false)
    private Long clinicaId;

    @Column(name = "paciente_id", nullable = false)
    private Long pacienteId;

    @Column(name = "template_code", nullable = false, length = 50)
    private String templateCode;

    @Column(name = "signing_token", nullable = false, unique = true, length = 20)
    private String signingToken;

    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private String status = "PENDIENTE";

    @Column(name = "consentimiento_id")
    private Long consentimientoId;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "signed_at")
    private LocalDateTime signedAt;

    @Column(name = "contrato_storage_path", length = 500)
    private String contratoStoragePath;
}
