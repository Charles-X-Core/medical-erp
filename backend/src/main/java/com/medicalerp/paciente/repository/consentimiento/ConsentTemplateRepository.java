package com.medicalerp.paciente.repository.consentimiento;

import com.medicalerp.paciente.entity.consentimiento.ConsentTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConsentTemplateRepository extends JpaRepository<ConsentTemplate, Long> {

    List<ConsentTemplate> findByClinicaIdAndActivoTrue(Long clinicaId);

    Optional<ConsentTemplate> findByIdAndClinicaId(Long id, Long clinicaId);

    Optional<ConsentTemplate> findByClinicaIdAndCodigoAndVersion(Long clinicaId, String codigo, String version);

    boolean existsByClinicaIdAndCodigoAndVersion(Long clinicaId, String codigo, String version);

    @Modifying
    @Query("UPDATE ConsentTemplate t SET t.deletedAt = CURRENT_TIMESTAMP " +
           "WHERE t.clinicaId = :clinicaId AND t.deletedAt IS NULL")
    void softDeleteByClinicaId(@Param("clinicaId") Long clinicaId);
}
