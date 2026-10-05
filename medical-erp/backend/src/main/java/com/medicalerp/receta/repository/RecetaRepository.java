package com.medicalerp.receta.repository;

import com.medicalerp.receta.entity.Receta;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RecetaRepository extends JpaRepository<Receta, Long> {
    List<Receta> findByPacienteIdOrderByFechaDesc(Long pacienteId);
    List<Receta> findBySesionIdOrderByFechaDesc(Long sesionId);
    List<Receta> findByTratamientoIdOrderByFechaDesc(Long tratamientoId);
}
