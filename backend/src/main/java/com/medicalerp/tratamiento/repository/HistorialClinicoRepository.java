package com.medicalerp.tratamiento.repository;

import com.medicalerp.tratamiento.entity.HistorialClinico;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HistorialClinicoRepository extends JpaRepository<HistorialClinico, Long> {

    List<HistorialClinico> findByTratamientoIdOrderByCreatedAtDesc(Long tratamientoId);

    List<HistorialClinico> findByClinicaId(Long clinicaId);

}
