package com.medicalerp.paciente.repository;

import com.medicalerp.paciente.entity.Paciente;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface PacienteRepository extends JpaRepository<Paciente, Long> {

    Optional<Paciente> findByLicenciaConducir(String licenciaConducir);

    boolean existsByLicenciaConducir(String licenciaConducir);

    Optional<Paciente> findByIdAndClinicaId(Long id, Long clinicaId);

    Page<Paciente> findByClinicaId(Long clinicaId, Pageable pageable);

    Page<Paciente> findByClinicaIdAndEstado(Long clinicaId, String estado, Pageable pageable);

    @Query("SELECT p FROM Paciente p WHERE p.clinicaId = :clinicaId AND (" +
           "LOWER(p.nombres) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(p.apellidoPaterno) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(p.apellidoMaterno) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "p.licenciaConducir LIKE CONCAT('%', :query, '%'))")
    Page<Paciente> searchByClinicaId(@Param("clinicaId") Long clinicaId, @Param("query") String query, Pageable pageable);

    @Query("SELECT p FROM Paciente p WHERE " +
           "LOWER(p.nombres) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(p.apellidoPaterno) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(p.apellidoMaterno) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "p.licenciaConducir LIKE CONCAT('%', :query, '%')")
    Page<Paciente> search(@Param("query") String query, Pageable pageable);

    Page<Paciente> findByEstado(String estado, Pageable pageable);

    long countByClinicaIdAndCreatedAtGreaterThanEqual(Long clinicaId, LocalDateTime desde);

}
