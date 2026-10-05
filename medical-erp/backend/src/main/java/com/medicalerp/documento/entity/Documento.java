package com.medicalerp.documento.entity;

import com.medicalerp.paciente.entity.Paciente;
import com.medicalerp.seguridad.entity.Usuario;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

/**
 * Documento Entity (DOM-DOC-001)
 */
@Entity
@Table(name = "documentos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Documento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "paciente_id", nullable = false)
    private Paciente paciente;

    @Column(name = "cita_id")
    private Long citaId;

    @Column(name = "consulta_id")
    private Long consultaId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Column(name = "tipo", nullable = false, length = 50)
    private String tipo;

    @Column(name = "titulo", nullable = false, length = 255)
    private String titulo;

    @Column(name = "archivo_ruta", nullable = false, length = 500)
    private String archivoRuta;

    @Column(name = "archivo_nombre", nullable = false, length = 255)
    private String archivoNombre;

    @Column(name = "hash_sha256", length = 64)
    private String hashSha256;

    @Column(name = "firma_imagen", columnDefinition = "TEXT")
    private String firmaImagen;

    @Column(name = "firmado")
    @Builder.Default
    private Boolean firmado = false;

    @Column(name = "firmado_at")
    private Instant firmadoAt;

    @Column(name = "estado", length = 20)
    @Builder.Default
    private String estado = "borrador";

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

}
