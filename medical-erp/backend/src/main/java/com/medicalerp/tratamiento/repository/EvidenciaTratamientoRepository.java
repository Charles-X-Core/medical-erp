package com.medicalerp.tratamiento.repository;

import com.medicalerp.tratamiento.entity.EvidenciaTratamiento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EvidenciaTratamientoRepository extends JpaRepository<EvidenciaTratamiento, Long> {

    List<EvidenciaTratamiento> findBySesionId(Long sesionId);

    List<EvidenciaTratamiento> findByTratamientoIdAndSesionIdIsNull(Long tratamientoId);

    List<EvidenciaTratamiento> findByClinicaId(Long clinicaId);

}
