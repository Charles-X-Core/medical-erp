package com.medicalerp.tratamiento.repository;

import com.medicalerp.tratamiento.entity.TipoSesionTratamiento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TipoSesionTratamientoRepository extends JpaRepository<TipoSesionTratamiento, Long> {

    List<TipoSesionTratamiento> findByClinicaIdAndActivoTrueOrderByOrden(Long clinicaId);

    Optional<TipoSesionTratamiento> findByClinicaIdAndCodigo(Long clinicaId, String codigo);

}
