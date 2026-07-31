package com.medicalerp.agenda.repository;

import com.medicalerp.agenda.entity.Agenda;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AgendaRepository extends JpaRepository<Agenda, Long> {

    Optional<Agenda> findByUsuarioId(Long usuarioId);

    boolean existsByUsuarioId(Long usuarioId);

}
