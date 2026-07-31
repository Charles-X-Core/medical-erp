package com.medicalerp.paciente.repository;

import com.medicalerp.paciente.entity.PacienteSeguro;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PacienteSeguroRepository extends JpaRepository<PacienteSeguro, Long> {

    List<PacienteSeguro> findByPacienteIdAndClinicaId(Long pacienteId, Long clinicaId);

    Optional<PacienteSeguro> findByIdAndClinicaId(Long id, Long clinicaId);

    @Modifying
    @Query("UPDATE PacienteSeguro s SET s.deletedAt = CURRENT_TIMESTAMP " +
           "WHERE s.paciente.id = :pacienteId AND s.deletedAt IS NULL")
    void softDeleteByPacienteId(@Param("pacienteId") Long pacienteId);
}
