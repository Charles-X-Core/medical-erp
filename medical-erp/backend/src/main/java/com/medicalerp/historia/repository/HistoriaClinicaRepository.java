package com.medicalerp.historia.repository;

import com.medicalerp.historia.entity.HistoriaClinica;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface HistoriaClinicaRepository extends JpaRepository<HistoriaClinica, Long> {

    Optional<HistoriaClinica> findByPacienteId(Long pacienteId);

    List<HistoriaClinica> findAllByPacienteId(Long pacienteId);

    boolean existsByPacienteId(Long pacienteId);

    Page<HistoriaClinica> findAll(Pageable pageable);

}
