package com.medicalerp.paciente.repository;

import com.medicalerp.paciente.entity.PacienteDocumento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PacienteDocumentoRepository extends JpaRepository<PacienteDocumento, Long> {

    List<PacienteDocumento> findByPacienteIdAndClinicaId(Long pacienteId, Long clinicaId);

    Optional<PacienteDocumento> findByIdAndClinicaId(Long id, Long clinicaId);

    boolean existsByNumeroDocumentoAndTipoDocumentoAndClinicaIdAndIdNot(
            String numeroDocumento, String tipoDocumento, Long clinicaId, Long id);

    boolean existsByNumeroDocumentoAndTipoDocumentoAndClinicaId(
            String numeroDocumento, String tipoDocumento, Long clinicaId);

    @Modifying
    @Query("UPDATE PacienteDocumento d SET d.deletedAt = CURRENT_TIMESTAMP " +
           "WHERE d.paciente.id = :pacienteId AND d.deletedAt IS NULL")
    void softDeleteByPacienteId(@Param("pacienteId") Long pacienteId);
}
