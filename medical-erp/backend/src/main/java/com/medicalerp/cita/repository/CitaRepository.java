package com.medicalerp.cita.repository;

import com.medicalerp.cita.entity.Cita;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface CitaRepository extends JpaRepository<Cita, Long> {

    @Query("SELECT c FROM Cita c WHERE FUNCTION('DATE', c.fechaHora) = :fecha")
    Page<Cita> findByFecha(@Param("fecha") LocalDate fecha, Pageable pageable);

    Page<Cita> findByEstado(String estado, Pageable pageable);

    Page<Cita> findByPacienteId(Long pacienteId, Pageable pageable);

    Page<Cita> findByUsuarioId(Long usuarioId, Pageable pageable);

    @Query("SELECT c FROM Cita c WHERE FUNCTION('DATE', c.fechaHora) = :fecha AND c.estado <> :estado")
    List<Cita> findByFechaAndEstadoNot(@Param("fecha") LocalDate fecha, @Param("estado") String estado);

    @Query("SELECT c FROM Cita c WHERE FUNCTION('DATE', c.fechaHora) = :fecha AND c.estado NOT IN ('cancelada', 'completada')")
    List<Cita> findActivasByFecha(@Param("fecha") LocalDate fecha);

    @Query("SELECT c FROM Cita c WHERE c.usuario.id = :usuarioId AND FUNCTION('DATE', c.fechaHora) = :fecha AND c.estado NOT IN ('cancelada', 'completada')")
    List<Cita> findActivasByUsuarioAndFecha(@Param("usuarioId") Long usuarioId, @Param("fecha") LocalDate fecha);

    @Query(value = "SELECT COUNT(*) FROM citas c WHERE c.usuario_id = :usuarioId AND DATE(c.fecha_hora) = :fecha " +
           "AND c.estado NOT IN ('cancelada', 'completada') " +
           "AND c.id != :excludeId " +
           "AND (TIME(c.fecha_hora) < :horaFin AND :hora < ADDTIME(TIME(c.fecha_hora), SEC_TO_TIME(c.duracion_minutos * 60)))",
           nativeQuery = true)
    Long countConflictingCita(
            @Param("usuarioId") Long usuarioId,
            @Param("fecha") LocalDate fecha,
            @Param("hora") LocalTime hora,
            @Param("horaFin") LocalTime horaFin,
            @Param("excludeId") Long excludeId);

    @Query("SELECT c FROM Cita c WHERE c.paciente.id = :pacienteId AND FUNCTION('DATE', c.fechaHora) = :fecha AND c.estado <> :estado")
    Optional<Cita> findByPacienteIdAndFechaAndEstadoNot(
            @Param("pacienteId") Long pacienteId,
            @Param("fecha") LocalDate fecha,
            @Param("estado") String estado);

    @Query("SELECT c FROM Cita c WHERE c.fechaHora >= :fechaInicio AND c.estado NOT IN ('cancelada', 'completada') ORDER BY c.fechaHora")
    List<Cita> findProximas(@Param("fechaInicio") LocalDateTime fechaInicio);

    @Query("SELECT c FROM Cita c WHERE c.usuario.id = :usuarioId AND FUNCTION('DATE', c.fechaHora) = :fecha AND c.estado <> :estado")
    List<Cita> findByFechaAndUsuarioIdAndEstadoNot(
            @Param("usuarioId") Long usuarioId,
            @Param("fecha") LocalDate fecha,
            @Param("estado") String estado);

    @Query("SELECT c FROM Cita c WHERE c.usuario.id = :usuarioId AND c.fechaHora >= :fechaInicio AND c.estado NOT IN ('cancelada', 'completada') ORDER BY c.fechaHora")
    List<Cita> findProximasByUsuarioId(@Param("usuarioId") Long usuarioId, @Param("fechaInicio") LocalDateTime fechaInicio);

    @Query("SELECT c FROM Cita c WHERE c.usuario.id = :usuarioId AND FUNCTION('DATE', c.fechaHora) = :fecha")
    List<Cita> findByUsuarioIdAndFecha(@Param("usuarioId") Long usuarioId, @Param("fecha") LocalDate fecha);

    @Query("SELECT c FROM Cita c WHERE c.usuario.id = :usuarioId")
    List<Cita> findListByUsuarioId(@Param("usuarioId") Long usuarioId);

    @Query("SELECT c FROM Cita c WHERE c.usuario.id = :usuarioId AND FUNCTION('DATE', c.fechaHora) >= :inicio AND FUNCTION('DATE', c.fechaHora) <= :fin AND c.estado NOT IN ('cancelada', 'completada')")
    List<Cita> findByUsuarioIdAndFechaBetween(
            @Param("usuarioId") Long usuarioId,
            @Param("inicio") LocalDate inicio,
            @Param("fin") LocalDate fin);

    @Query("SELECT c FROM Cita c WHERE FUNCTION('DATE', c.fechaHora) >= :inicio AND FUNCTION('DATE', c.fechaHora) <= :fin AND c.estado NOT IN ('cancelada', 'completada')")
    List<Cita> findActivasByFechaBetween(
            @Param("inicio") LocalDate inicio,
            @Param("fin") LocalDate fin);

    @Query("SELECT c FROM Cita c WHERE FUNCTION('DATE', c.fechaHora) = :fecha " +
           "AND c.estado IN ('solicitada','pendiente','programada','confirmada','asistio') " +
           "AND c.fechaHora < :cutoff")
    List<Cita> findPasadasSinAccion(@Param("fecha") LocalDate fecha, @Param("cutoff") LocalDateTime cutoff);

}
