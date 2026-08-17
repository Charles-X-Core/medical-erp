package com.medicalerp.tratamiento.repository;

import com.medicalerp.tratamiento.entity.Tratamiento;
import com.medicalerp.tratamiento.enums.EstadoTratamiento;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TratamientoRepository extends JpaRepository<Tratamiento, Long> {

    Page<Tratamiento> findByClinicaId(Long clinicaId, Pageable pageable);

    Page<Tratamiento> findByClinicaIdAndEstado(Long clinicaId, EstadoTratamiento estado, Pageable pageable);

    List<Tratamiento> findByPacienteIdAndEstadoIn(Long pacienteId, List<EstadoTratamiento> estados);

    long countByPacienteIdAndTipoTratamientoAndEstadoIn(Long pacienteId, String tipoTratamiento, List<EstadoTratamiento> estados);

    Page<Tratamiento> findByClinicaIdAndPacienteId(Long clinicaId, Long pacienteId, Pageable pageable);

    List<Tratamiento> findByClinicaIdAndEstado(Long clinicaId, EstadoTratamiento estado);

    @Query("SELECT t FROM Tratamiento t WHERE t.clinicaId = :clinicaId AND t.estado = com.medicalerp.tratamiento.enums.EstadoTratamiento.EN_CURSO AND t.sesionesRealizadas >= t.sesionesPlaneadas")
    List<Tratamiento> findActivosConLimiteAlcanzado(@Param("clinicaId") Long clinicaId);

    @Query("SELECT t FROM Tratamiento t WHERE t.clinicaId = :clinicaId AND t.estado = com.medicalerp.tratamiento.enums.EstadoTratamiento.PENDIENTE")
    List<Tratamiento> findPendientesDeInicio(@Param("clinicaId") Long clinicaId);

    @Query("SELECT t FROM Tratamiento t WHERE t.clinicaId = :clinicaId AND (" +
           "LOWER(t.tipoTratamiento) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(t.objetivo) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<Tratamiento> searchByClinicaId(@Param("clinicaId") Long clinicaId, @Param("query") String query, Pageable pageable);

}
