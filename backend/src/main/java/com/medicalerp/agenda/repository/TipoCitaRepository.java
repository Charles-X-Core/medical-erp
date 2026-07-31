package com.medicalerp.agenda.repository;

import com.medicalerp.agenda.entity.TipoCita;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TipoCitaRepository extends JpaRepository<TipoCita, Long> {

    Optional<TipoCita> findByNombre(String nombre);

    List<TipoCita> findByActivoTrue();

    boolean existsByNombre(String nombre);

}
