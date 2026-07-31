package com.medicalerp.agenda.repository;

import com.medicalerp.agenda.entity.Disponibilidad;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DisponibilidadRepository extends JpaRepository<Disponibilidad, Long> {

    List<Disponibilidad> findByAgendaId(Long agendaId);

    List<Disponibilidad> findByAgendaIdAndDiaSemana(Long agendaId, Integer diaSemana);

    void deleteByAgendaId(Long agendaId);

}
