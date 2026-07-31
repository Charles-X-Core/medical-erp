package com.medicalerp.cita.repository;

import com.medicalerp.cita.entity.Cita;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface CitaRepository extends JpaRepository<Cita, Long> {

    Page<Cita> findByFecha(LocalDate fecha, Pageable pageable);

    Page<Cita> findByEstado(String estado, Pageable pageable);

    Page<Cita> findByPacienteId(Long pacienteId, Pageable pageable);

    Page<Cita> findByUsuarioId(Long usuarioId, Pageable pageable);

    List<Cita> findByFechaAndEstadoNot(LocalDate fecha, String estado);

    @Query("SELECT c FROM Cita c WHERE c.fecha = :fecha AND c.estado NOT IN ('cancelada', 'completada')")
    List<Cita> findActivasByFecha(@Param("fecha") LocalDate fecha);

    @Query("SELECT c FROM Cita c WHERE c.usuario.id = :usuarioId AND c.fecha = :fecha AND c.estado NOT IN ('cancelada', 'completada')")
    List<Cita> findActivasByUsuarioAndFecha(@Param("usuarioId") Long usuarioId, @Param("fecha") LocalDate fecha);

    @Query(value = "SELECT COUNT(*) FROM citas c WHERE c.usuario_id = :usuarioId AND c.fecha = :fecha " +
           "AND c.estado NOT IN ('cancelada', 'completada') " +
           "AND (c.hora < :horaFin AND :hora < ADDTIME(c.hora, CONCAT(c.duracion_minutos, ':0')))",
           nativeQuery = true)
    Long countConflictingCita(
            @Param("usuarioId") Long usuarioId,
            @Param("fecha") LocalDate fecha,
            @Param("hora") LocalTime hora,
            @Param("horaFin") LocalTime horaFin);

    Optional<Cita> findByPacienteIdAndFechaAndEstadoNot(Long pacienteId, LocalDate fecha, String estado);

    @Query("SELECT c FROM Cita c WHERE c.fecha >= :fecha AND c.estado NOT IN ('cancelada', 'completada') ORDER BY c.fecha, c.hora")
    List<Cita> findProximas(@Param("fecha") LocalDate fecha);

}
