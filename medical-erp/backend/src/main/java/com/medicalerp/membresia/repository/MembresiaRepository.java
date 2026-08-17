package com.medicalerp.membresia.repository;

import com.medicalerp.membresia.entity.Membresia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MembresiaRepository extends JpaRepository<Membresia, Long> {

    List<Membresia> findByPacienteIdAndClinicaIdOrderByFechaInicioDesc(Long pacienteId, Long clinicaId);

    List<Membresia> findByPacienteIdOrderByFechaInicioDesc(Long pacienteId);
}
