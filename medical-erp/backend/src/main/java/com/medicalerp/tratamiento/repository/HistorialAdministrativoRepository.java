package com.medicalerp.tratamiento.repository;

import com.medicalerp.tratamiento.entity.HistorialAdministrativo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HistorialAdministrativoRepository extends JpaRepository<HistorialAdministrativo, Long> {

    List<HistorialAdministrativo> findByTratamientoIdOrderByCreatedAtDesc(Long tratamientoId);

    List<HistorialAdministrativo> findByClinicaId(Long clinicaId);

}
