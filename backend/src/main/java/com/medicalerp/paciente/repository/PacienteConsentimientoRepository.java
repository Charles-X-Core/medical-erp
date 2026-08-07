package com.medicalerp.paciente.repository;

import com.medicalerp.paciente.entity.PacienteConsentimiento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PacienteConsentimientoRepository extends JpaRepository<PacienteConsentimiento, Long> {

    List<PacienteConsentimiento> findByPacienteIdAndClinicaId(Long pacienteId, Long clinicaId);

    Optional<PacienteConsentimiento> findByIdAndClinicaId(Long id, Long clinicaId);

    List<PacienteConsentimiento> findByPacienteIdAndClinicaIdAndTratamientoId(
            Long pacienteId, Long clinicaId, Long tratamientoId);

    @Modifying
    @Query("UPDATE PacienteConsentimiento c SET c.deletedAt = CURRENT_TIMESTAMP " +
           "WHERE c.paciente.id = :pacienteId AND c.deletedAt IS NULL")
    void softDeleteByPacienteId(@Param("pacienteId") Long pacienteId);
}
