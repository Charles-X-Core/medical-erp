package com.medicalerp.agenda.repository;

import com.medicalerp.agenda.entity.Bloqueo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface BloqueoRepository extends JpaRepository<Bloqueo, Long> {

    List<Bloqueo> findByAgendaId(Long agendaId);

    @Query("SELECT b FROM Bloqueo b WHERE b.agenda.id = :agendaId AND " +
           "((b.fechaInicio <= :fin AND b.fechaFin >= :inicio))")
    List<Bloqueo> findOverlapping(
            @Param("agendaId") Long agendaId,
            @Param("inicio") LocalDateTime inicio,
            @Param("fin") LocalDateTime fin);

}
