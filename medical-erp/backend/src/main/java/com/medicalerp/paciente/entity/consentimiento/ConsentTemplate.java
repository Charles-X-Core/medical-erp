package com.medicalerp.paciente.entity.consentimiento;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.Where;

import java.time.LocalDateTime;

@Entity
@Table(name = "consent_templates",
       uniqueConstraints = @UniqueConstraint(columnNames = {"clinica_id", "codigo", "version"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Where(clause = "deleted_at IS NULL")
public class ConsentTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "clinica_id", nullable = false)
    private Long clinicaId;

    @Column(name = "codigo", nullable = false, length = 50)
    private String codigo;

    @Column(name = "version", nullable = false, length = 20)
    private String version;

    @Column(name = "titulo", nullable = false, length = 255)
    private String titulo;

    @Column(name = "storage_path", nullable = false, length = 500)
    private String storagePath;

    @Column(name = "mime_type", length = 100)
    @Builder.Default
    private String mimeType = "text/html";

    @Column(name = "variables_requeridas", columnDefinition = "TEXT")
    private String variablesRequeridas;

    @Column(name = "variables_version", length = 20)
    @Builder.Default
    private String variablesVersion = "1.0";

    @Column(name = "requiere_firma")
    @Builder.Default
    private Boolean requiereFirma = true;

    @Column(name = "requiere_fecha")
    @Builder.Default
    private Boolean requiereFecha = true;

    @Column(name = "activo")
    @Builder.Default
    private Boolean activo = true;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
