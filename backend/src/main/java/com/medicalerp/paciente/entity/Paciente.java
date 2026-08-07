package com.medicalerp.paciente.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Patient Entity (DOM-PAC-001)
 */
@Entity
@Table(name = "pacientes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Paciente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "clinica_id")
    private Long clinicaId;

    @Column(name = "apellido_paterno", nullable = false, length = 255)
    private String apellidoPaterno;

    @Column(name = "apellido_materno", length = 255)
    private String apellidoMaterno;

    @Column(name = "nombres", nullable = false, length = 255)
    private String nombres;

    @Column(name = "dni", unique = true, length = 20)
    private String dni;

    @Column(name = "tipo_documento", length = 20)
    @Builder.Default
    private String tipoDocumento = "dni";

    @Column(name = "telefono", length = 50)
    private String telefono;

    @Column(name = "email", length = 255)
    private String email;

    @Column(name = "fecha_nacimiento")
    private LocalDate fechaNacimiento;

    @Column(name = "sexo", length = 10)
    private String sexo;

    @Column(name = "estado_civil", length = 50)
    private String estadoCivil;

    @Column(name = "direccion_linea1", length = 255)
    private String direccionLinea1;

    @Column(name = "direccion_linea2", length = 255)
    private String direccionLinea2;

    @Column(name = "ciudad", length = 100)
    private String ciudad;

    @Column(name = "estado_provincia", length = 100)
    private String estadoProvincia;

    @Column(name = "codigo_postal", length = 20)
    private String codigoPostal;

    @Column(name = "direccion_pais", length = 2)
    private String direccionPais;

    @Column(name = "lugar_nacimiento", length = 255)
    private String lugarNacimiento;

    @Column(name = "lugar_procedencia", length = 255)
    private String lugarProcedencia;

    @Column(name = "grado_instruccion", length = 255)
    private String gradoInstruccion;

    @Column(name = "ocupacion", length = 255)
    private String ocupacion;

    @Column(name = "nombre_acompanante", length = 255)
    private String nombreAcompanante;

    @Column(name = "contacto_emergencia", length = 255)
    private String contactoEmergencia;

    @Column(name = "telefono_emergencia", length = 50)
    private String telefonoEmergencia;

    @Column(name = "parentesco_emergencia", length = 100)
    private String parentescoEmergencia;

    @Column(name = "alergias", columnDefinition = "TEXT")
    private String alergias;

    @Column(name = "antecedentes_personales", columnDefinition = "TEXT")
    private String antecedentesPersonales;

    @Column(name = "antecedentes_familiares", columnDefinition = "TEXT")
    private String antecedentesFamiliares;

    @Column(name = "estado", length = 20)
    @Builder.Default
    private String estado = "activo";

    @Column(name = "pais", length = 2)
    @Builder.Default
    private String pais = "PE";

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public String getNombreCompleto() {
        return String.format("%s %s, %s", apellidoPaterno, apellidoMaterno, nombres);
    }

}
