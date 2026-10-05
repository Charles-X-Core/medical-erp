package com.medicalerp.consulta.repository;

import com.medicalerp.consulta.entity.Consulta;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ConsultaRepository extends JpaRepository<Consulta, Long> {

    Page<Consulta> findByHistoriaId(Long historiaId, Pageable pageable);

    List<Consulta> findByHistoriaId(Long historiaId);

    Page<Consulta> findByCitaId(Long citaId, Pageable pageable);

    @Query("SELECT c FROM Consulta c WHERE c.historia.paciente.id = :pacienteId ORDER BY c.fecha DESC")
    List<Consulta> findByPacienteId(@Param("pacienteId") Long pacienteId);

    @Query("SELECT c FROM Consulta c WHERE c.historia.paciente.id = :pacienteId AND c.signosVitales IS NOT NULL AND c.signosVitales <> '' ORDER BY c.fecha DESC")
    List<Consulta> findConSignosVitalesByPacienteId(@Param("pacienteId") Long pacienteId);

}
