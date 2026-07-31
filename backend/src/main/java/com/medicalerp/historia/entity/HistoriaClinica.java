package com.medicalerp.historia.entity;

import com.medicalerp.paciente.entity.Paciente;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Historia Clinica Entity (DOM-HCL-001)
 */
@Entity
@Table(name = "historias_clinicas")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HistoriaClinica {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "paciente_id", nullable = false, unique = true)
    private Paciente paciente;

    @Column(name = "numero_historia", length = 50)
    private String numeroHistoria;

    @Column(name = "alergia_medicamentos", columnDefinition = "TEXT")
    private String alergiaMedicamentos;

    @Column(name = "cardiopatias_personales", columnDefinition = "TEXT")
    private String cardiopatiasPersonales;

    @Column(name = "cardiopatias_familiares", columnDefinition = "TEXT")
    private String cardiopatiasFamiliares;

    @Column(name = "diabetes_personal", columnDefinition = "TEXT")
    private String diabetesPersonal;

    @Column(name = "diabetes_familiar", columnDefinition = "TEXT")
    private String diabetesFamiliar;

    @Column(name = "hepatitis", columnDefinition = "TEXT")
    private String hepatitis;

    @Column(name = "otras_enfermedades", columnDefinition = "TEXT")
    private String otrasEnfermedades;

    @Column(name = "observaciones", columnDefinition = "TEXT")
    private String observaciones;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

}
