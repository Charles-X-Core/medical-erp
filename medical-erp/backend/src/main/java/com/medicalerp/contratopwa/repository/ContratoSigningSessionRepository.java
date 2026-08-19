package com.medicalerp.contratopwa.repository;

import com.medicalerp.contratopwa.entity.ContratoSigningSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ContratoSigningSessionRepository extends JpaRepository<ContratoSigningSession, Long> {

    Optional<ContratoSigningSession> findBySigningToken(String signingToken);

    Optional<ContratoSigningSession> findBySigningTokenAndClinicaId(String signingToken, Long clinicaId);

    Optional<ContratoSigningSession> findFirstByClinicaIdAndStatusOrderByCreatedAtAsc(Long clinicaId, String status);

    boolean existsByClinicaIdAndPacienteIdAndStatus(Long clinicaId, Long pacienteId, String status);

    List<ContratoSigningSession> findByPacienteIdAndClinicaIdAndStatus(Long pacienteId, Long clinicaId, String status);
}
