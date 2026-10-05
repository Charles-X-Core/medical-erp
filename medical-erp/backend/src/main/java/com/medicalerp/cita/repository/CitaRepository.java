package com.medicalerp.cita.repository;

import com.medicalerp.cita.entity.Cita;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface CitaRepository extends JpaRepository<Cita, Long> {

    @Query("SELECT c FROM Cita c WHERE c.fechaHora >= :inicio AND c.fechaHora < :fin")
    Page<Cita> findByRangoFecha(@Param("inicio") LocalDateTime inicio, @Param("fin") LocalDateTime fin, Pageable pageable);

    Page<Cita> findByEstado(String estado, Pageable pageable);

    Page<Cita> findByPacienteId(Long pacienteId, Pageable pageable);

    Page<Cita> findByUsuarioId(Long usuarioId, Pageable pageable);

    @Query("SELECT c FROM Cita c LEFT JOIN FETCH c.paciente LEFT JOIN FETCH c.usuario LEFT JOIN FETCH c.tipoCita WHERE c.fechaHora >= :inicio AND c.fechaHora < :fin AND c.estado <> :estado")
    List<Cita> findByRangoFechaAndEstadoNot(@Param("inicio") LocalDateTime inicio, @Param("fin") LocalDateTime fin, @Param("estado") String estado);

    @Query("SELECT c FROM Cita c LEFT JOIN FETCH c.paciente LEFT JOIN FETCH c.usuario LEFT JOIN FETCH c.tipoCita WHERE c.fechaHora >= :inicio AND c.fechaHora < :fin AND c.estado NOT IN ('cancelada', 'completada')")
    List<Cita> findActivasByRangoFecha(@Param("inicio") LocalDateTime inicio, @Param("fin") LocalDateTime fin);

    @Query("SELECT c FROM Cita c LEFT JOIN FETCH c.paciente LEFT JOIN FETCH c.usuario LEFT JOIN FETCH c.tipoCita WHERE c.usuario.id = :usuarioId AND c.fechaHora >= :inicio AND c.fechaHora < :fin AND c.estado NOT IN ('cancelada', 'completada')")
    List<Cita> findActivasByUsuarioAndRangoFecha(@Param("usuarioId") Long usuarioId, @Param("inicio") LocalDateTime inicio, @Param("fin") LocalDateTime fin);

    @Query(value = "SELECT COUNT(*) FROM citas c WHERE c.usuario_id = :usuarioId AND c.fecha_hora >= :inicio AND c.fecha_hora < :fin " +
           "AND c.estado NOT IN ('cancelada', 'completada') " +
           "AND c.id != :excludeId " +
           "AND (TIME(c.fecha_hora) < :horaFin AND :hora < ADDTIME(TIME(c.fecha_hora), SEC_TO_TIME(c.duracion_minutos * 60)))",
           nativeQuery = true)
    Long countConflictingCita(
            @Param("usuarioId") Long usuarioId,
            @Param("inicio") LocalDateTime inicio,
            @Param("fin") LocalDateTime fin,
            @Param("hora") LocalTime hora,
            @Param("horaFin") LocalTime horaFin,
            @Param("excludeId") Long excludeId);

    @Query("SELECT c FROM Cita c WHERE c.paciente.id = :pacienteId AND c.fechaHora >= :inicio AND c.fechaHora < :fin AND c.estado <> :estado")
    Optional<Cita> findByPacienteIdAndRangoFechaAndEstadoNot(
            @Param("pacienteId") Long pacienteId,
            @Param("inicio") LocalDateTime inicio,
            @Param("fin") LocalDateTime fin,
            @Param("estado") String estado);

    @Query("SELECT c FROM Cita c LEFT JOIN FETCH c.paciente LEFT JOIN FETCH c.usuario LEFT JOIN FETCH c.tipoCita WHERE c.fechaHora >= :fechaInicio AND c.estado NOT IN ('cancelada', 'completada') ORDER BY c.fechaHora")
    List<Cita> findProximas(@Param("fechaInicio") LocalDateTime fechaInicio);

    @Query("SELECT c FROM Cita c LEFT JOIN FETCH c.paciente LEFT JOIN FETCH c.usuario LEFT JOIN FETCH c.tipoCita WHERE c.usuario.id = :usuarioId AND c.fechaHora >= :inicio AND c.fechaHora < :fin AND c.estado <> :estado")
    List<Cita> findByUsuarioIdAndRangoFechaAndEstadoNot(
            @Param("usuarioId") Long usuarioId,
            @Param("inicio") LocalDateTime inicio,
            @Param("fin") LocalDateTime fin,
            @Param("estado") String estado);

    @Query("SELECT c FROM Cita c LEFT JOIN FETCH c.paciente LEFT JOIN FETCH c.usuario LEFT JOIN FETCH c.tipoCita WHERE c.usuario.id = :usuarioId AND c.fechaHora >= :fechaInicio AND c.estado NOT IN ('cancelada', 'completada') ORDER BY c.fechaHora")
    List<Cita> findProximasByUsuarioId(@Param("usuarioId") Long usuarioId, @Param("fechaInicio") LocalDateTime fechaInicio);

    @Query("SELECT c FROM Cita c WHERE c.usuario.id = :usuarioId AND c.fechaHora >= :inicio AND c.fechaHora < :fin")
    List<Cita> findByUsuarioIdAndRangoFecha(@Param("usuarioId") Long usuarioId, @Param("inicio") LocalDateTime inicio, @Param("fin") LocalDateTime fin);

    @Query("SELECT c FROM Cita c LEFT JOIN FETCH c.paciente LEFT JOIN FETCH c.usuario LEFT JOIN FETCH c.tipoCita WHERE c.usuario.id = :usuarioId")
    List<Cita> findListByUsuarioId(@Param("usuarioId") Long usuarioId);

    @Query("SELECT c FROM Cita c LEFT JOIN FETCH c.paciente LEFT JOIN FETCH c.usuario LEFT JOIN FETCH c.tipoCita WHERE c.usuario.id = :usuarioId AND c.fechaHora >= :inicio AND c.fechaHora < :fin AND c.estado NOT IN ('cancelada', 'completada')")
    List<Cita> findByUsuarioIdAndRangoFechaActivas(
            @Param("usuarioId") Long usuarioId,
            @Param("inicio") LocalDateTime inicio,
            @Param("fin") LocalDateTime fin);

    @Query("SELECT c FROM Cita c LEFT JOIN FETCH c.paciente LEFT JOIN FETCH c.usuario LEFT JOIN FETCH c.tipoCita WHERE c.fechaHora >= :inicio AND c.fechaHora < :fin AND c.estado NOT IN ('cancelada', 'completada')")
    List<Cita> findActivasByRangoFechaActivas(
            @Param("inicio") LocalDateTime inicio,
            @Param("fin") LocalDateTime fin);

    @Query("SELECT c FROM Cita c LEFT JOIN FETCH c.paciente LEFT JOIN FETCH c.usuario LEFT JOIN FETCH c.tipoCita WHERE c.fechaHora >= :inicio AND c.fechaHora < :fin " +
           "AND c.estado IN :estados")
    List<Cita> findActivasByRangoFecha(@Param("inicio") LocalDateTime inicio, @Param("fin") LocalDateTime fin, @Param("estados") List<String> estados);

    /**
     * Citas de un paciente en un rango de fechas con los estados indicados.
     * Se usa para bloquear la atencion instantanea (walk-in) cuando el paciente
     * ya tiene una cita viva: en ese caso debe usarse "Atencion con cita".
     */
    @Query("SELECT c FROM Cita c WHERE c.paciente.id = :pacienteId " +
           "AND c.fechaHora >= :inicio AND c.fechaHora < :fin " +
           "AND c.estado IN :estados ORDER BY c.fechaHora")
    List<Cita> findByPacienteIdAndRangoFechaAndEstadoIn(
            @Param("pacienteId") Long pacienteId,
            @Param("inicio") LocalDateTime inicio,
            @Param("fin") LocalDateTime fin,
            @Param("estados") List<String> estados);

}
