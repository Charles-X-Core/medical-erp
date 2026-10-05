package com.medicalerp.paciente.entity;

import com.medicalerp.paciente.entity.consentimiento.ConsentTemplate;
import com.medicalerp.paciente.enums.EstadoConsentimientoDocumento;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Where;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "paciente_consentimientos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Where(clause = "deleted_at IS NULL")
public class PacienteConsentimiento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "paciente_id", nullable = false)
    private Paciente paciente;

    @Column(name = "clinica_id", nullable = false)
    private Long clinicaId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_id")
    private ConsentTemplate template;

    @Column(name = "tipo", nullable = false, length = 50)
    private String tipo;

    @Column(name = "aceptado")
    @Builder.Default
    private Boolean aceptado = false;

    @Column(name = "fecha")
    private LocalDate fecha;

    @Column(name = "version", length = 20)
    private String version;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "user_agent", length = 500)
    private String userAgent;

    @Column(name = "paciente_snapshot", columnDefinition = "TEXT")
    private String pacienteSnapshot;

    @Column(name = "firma_fecha")
    private Instant firmaFecha;

    @Column(name = "storage_path", length = 500)
    private String storagePath;

    @Column(name = "nombre_archivo", length = 255)
    private String nombreArchivo;

    @Column(name = "hash_documento", length = 64)
    private String hashDocumento;

    @Column(name = "tamano_archivo")
    private Integer tamanoArchivo;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado_documento", nullable = false, length = 20)
    @Builder.Default
    private EstadoConsentimientoDocumento estadoDocumento = EstadoConsentimientoDocumento.BORRADOR;

    @Column(name = "tratamiento_id")
    private Long tratamientoId;

    @Column(name = "consulta_id")
    private Long consultaId;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
