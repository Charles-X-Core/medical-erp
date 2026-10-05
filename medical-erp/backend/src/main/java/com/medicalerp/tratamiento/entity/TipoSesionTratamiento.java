package com.medicalerp.tratamiento.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

/**
 * TipoSesionTratamiento Entity (DOM-TRAT-005)
 * Catalogo de tipos de sesion de tratamiento
 */
@Entity
@Table(name = "tipos_sesion_tratamiento")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TipoSesionTratamiento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "clinica_id", nullable = false)
    private Long clinicaId;

    @Column(name = "codigo", nullable = false, length = 20)
    private String codigo;

    @Column(name = "nombre", nullable = false, length = 100)
    private String nombre;

    @Column(name = "descripcion", length = 500)
    private String descripcion;

    @Column(name = "duracion_minutos", nullable = false)
    @Builder.Default
    private Integer duracionMinutos = 60;

    @Column(name = "requiere_protocolo")
    @Builder.Default
    private Boolean requiereProtocolo = false;

    @Column(name = "activo")
    @Builder.Default
    private Boolean activo = true;

    @Column(name = "orden")
    @Builder.Default
    private Integer orden = 0;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

}
