package com.medicalerp.tarea.repository;

import com.medicalerp.tarea.entity.Tarea;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TareaRepository extends JpaRepository<Tarea, Long> {

    List<Tarea> findByDestinoRolAndEstadoOrderByCreatedAtDesc(String destinoRol, String estado);

    List<Tarea> findByDestinoRolAndClinicaIdAndEstadoOrderByCreatedAtDesc(String destinoRol, Long clinicaId, String estado);

    List<Tarea> findByClinicaIdAndEstadoOrderByCreatedAtDesc(Long clinicaId, String estado);

    long countByDestinoRolAndEstado(String destinoRol, String estado);

    long countByDestinoRolAndClinicaIdAndEstado(String destinoRol, Long clinicaId, String estado);
}
