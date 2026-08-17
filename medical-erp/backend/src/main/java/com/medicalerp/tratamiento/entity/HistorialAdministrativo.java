package com.medicalerp.tratamiento.entity;

import com.medicalerp.tratamiento.enums.TipoCambioAdministrativo;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * HistorialAdministrativo Entity (DOM-TRAT-007)
 * Historial de cambios administrativos de un tratamiento
 */
@Entity
@Table(name = "historial_administrativo")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HistorialAdministrativo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tratamiento_id", nullable = false)
    private Long tratamientoId;

    @Column(name = "clinica_id", nullable = false)
    private Long clinicaId;

    @Column(name = "tipo_cambio", nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    private TipoCambioAdministrativo tipoCambio;

    @Column(name = "campo_modificado", length = 100)
    private String campoModificado;

    @Column(name = "valor_anterior", columnDefinition = "TEXT")
    private String valorAnterior;

    @Column(name = "valor_nuevo", columnDefinition = "TEXT")
    private String valorNuevo;

    @Column(name = "motivo", columnDefinition = "TEXT")
    private String motivo;

    @Column(name = "usuario_id", nullable = false)
    private Long usuarioId;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

}
