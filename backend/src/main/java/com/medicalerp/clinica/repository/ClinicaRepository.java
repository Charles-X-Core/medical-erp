package com.medicalerp.clinica.repository;

import com.medicalerp.clinica.entity.Clinica;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ClinicaRepository extends JpaRepository<Clinica, Long> {
    Optional<Clinica> findByPais(String pais);
}
