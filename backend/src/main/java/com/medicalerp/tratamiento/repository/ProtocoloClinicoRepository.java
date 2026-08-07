package com.medicalerp.tratamiento.repository;

import com.medicalerp.tratamiento.entity.ProtocoloClinico;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProtocoloClinicoRepository extends JpaRepository<ProtocoloClinico, Long> {

    Optional<ProtocoloClinico> findByTratamientoId(Long tratamientoId);

    boolean existsByTratamientoId(Long tratamientoId);

}
