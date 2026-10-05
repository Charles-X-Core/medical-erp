package com.medicalerp.tratamiento.repository;

import com.medicalerp.tratamiento.entity.SesionTratamiento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SesionTratamientoRepository extends JpaRepository<SesionTratamiento, Long> {

    List<SesionTratamiento> findByTratamientoIdOrderByNumeroSesion(Long tratamientoId);

    Optional<SesionTratamiento> findByTratamientoIdAndNumeroSesion(Long tratamientoId, Integer numeroSesion);

    @Query("SELECT s FROM SesionTratamiento s WHERE s.tratamientoId = :tratamientoId AND s.numeroSesion = (SELECT MAX(s2.numeroSesion) FROM SesionTratamiento s2 WHERE s2.tratamientoId = :tratamientoId)")
    Optional<SesionTratamiento> findUltimaByTratamientoId(@Param("tratamientoId") Long tratamientoId);

    List<SesionTratamiento> findByClinicaId(Long clinicaId);

    @Query("SELECT COUNT(s) FROM SesionTratamiento s WHERE s.tratamientoId = :tratamientoId")
    int countByTratamientoId(@Param("tratamientoId") Long tratamientoId);

    List<SesionTratamiento> findByTratamientoIdIn(List<Long> tratamientoIds);

    @Query("SELECT s FROM SesionTratamiento s JOIN Tratamiento t ON s.tratamientoId = t.id WHERE t.pacienteId = :pacienteId AND s.signosVitales IS NOT NULL AND s.signosVitales <> '' ORDER BY s.fecha DESC")
    List<SesionTratamiento> findConSignosVitalesByPacienteId(@Param("pacienteId") Long pacienteId);

}
