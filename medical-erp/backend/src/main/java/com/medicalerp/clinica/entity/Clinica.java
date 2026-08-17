package com.medicalerp.clinica.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "clinicas")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Clinica {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nombre", nullable = false, length = 255)
    private String nombre;

    @Column(name = "pais", nullable = false, length = 2)
    private String pais;

    @Column(name = "timezone", length = 50)
    @Builder.Default
    private String timezone = "America/Lima";

    @Column(name = "moneda", length = 3)
    @Builder.Default
    private String moneda = "PEN";

    @Column(name = "activa")
    @Builder.Default
    private Boolean activa = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
