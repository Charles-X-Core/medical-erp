package com.medicalerp.tratamiento.entity;

import com.medicalerp.tratamiento.enums.EstadoTratamiento;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

/**
 * Tratamiento Entity (DOM-TRAT-001)
 * Agregado raiz del modulo de tratamiento
 */
@Entity
@Table(name = "tratamientos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Tratamiento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "clinica_id", nullable = false)
    private Long clinicaId;

    @Column(name = "paciente_id", nullable = false)
    private Long pacienteId;

    @Column(name = "historia_clinica_id")
    private Long historiaClinicaId;

    @Column(name = "consulta_origen_id")
    private Long consultaOrigenId;

    @Column(name = "tipo_tratamiento", nullable = false, length = 100)
    private String tipoTratamiento;

    @Column(name = "diagnostico_inicial", columnDefinition = "TEXT")
    private String diagnosticoInicial;

    @Column(name = "objetivo", nullable = false, columnDefinition = "TEXT")
    private String objetivo;

    @Column(name = "fecha_inicio")
    private LocalDate fechaInicio;

    @Column(name = "fecha_fin")
    private LocalDate fechaFin;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false, length = 30)
    @Builder.Default
    private EstadoTratamiento estado = EstadoTratamiento.PENDIENTE;

    @Column(name = "sesiones_planeadas", nullable = false)
    @Builder.Default
    private Integer sesionesPlaneadas = 1;

    @Column(name = "sesiones_realizadas", nullable = false)
    @Builder.Default
    private Integer sesionesRealizadas = 0;

    @Column(name = "costo_estimado", precision = 10, scale = 2)
    private BigDecimal costoEstimado;

    @Column(name = "costo_total", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal costoTotal = BigDecimal.ZERO;

    @Column(name = "modo_costo", length = 20)
    private String modoCosto;

    @Column(name = "observaciones", columnDefinition = "TEXT")
    private String observaciones;

    @Column(name = "resultado_final", columnDefinition = "TEXT")
    private String resultadoFinal;

    @Column(name = "motivo_cancelacion", length = 500)
    private String motivoCancelacion;

    @Column(name = "motivo_pausa", length = 500)
    private String motivoPausa;

    @Column(name = "requiere_medicacion")
    @Builder.Default
    private Boolean requiereMedicacion = false;

    @Column(name = "usuario_asignado_id")
    private Long usuarioAsignadoId;

    @Version
    @Column(name = "version")
    @Builder.Default
    private Integer version = 0;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    @Transient
    public Integer getSesionesRestantes() {
        if (sesionesPlaneadas == null || sesionesRealizadas == null) {
            return 0;
        }
        int restantes = sesionesPlaneadas - sesionesRealizadas;
        return restantes < 0 ? 0 : restantes;
    }

}
