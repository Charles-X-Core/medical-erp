package com.medicalerp.tratamiento.entity;

import com.medicalerp.tratamiento.enums.TipoEvidencia;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * EvidenciaTratamiento Entity (DOM-TRAT-004)
 * Evidencia (fotos, PDFs, laboratorios, videos, etc.) de una sesion
 */
@Entity
@Table(name = "evidencias_tratamiento")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EvidenciaTratamiento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "sesion_id", nullable = false)
    private Long sesionId;

    @Column(name = "clinica_id", nullable = false)
    private Long clinicaId;

    @Column(name = "tipo", nullable = false, length = 30)
    @Enumerated(EnumType.STRING)
    private TipoEvidencia tipo;

    @Column(name = "archivo_ruta", nullable = false, length = 500)
    private String archivoRuta;

    @Column(name = "archivo_nombre", nullable = false, length = 255)
    private String archivoNombre;

    @Column(name = "archivo_mime_type", length = 100)
    private String archivoMimeType;

    @Column(name = "archivo_tamano")
    private Long archivoTamano;

    @Column(name = "descripcion", length = 500)
    private String descripcion;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

}
