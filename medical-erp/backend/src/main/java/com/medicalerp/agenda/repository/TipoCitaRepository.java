package com.medicalerp.agenda.repository;

import com.medicalerp.agenda.entity.TipoCita;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TipoCitaRepository extends JpaRepository<TipoCita, Long> {

    Optional<TipoCita> findByNombre(String nombre);

    List<TipoCita> findByActivoTrue();

    List<TipoCita> findByActivoTrueAndUsuarioIsNull();

    List<TipoCita> findByActivoTrueAndUsuarioIdOrUsuarioIsNull(Long usuarioId);

    @Query("SELECT CASE WHEN COUNT(t) > 0 THEN true ELSE false END FROM TipoCita t WHERE t.nombre = :nombre AND (t.usuario.id = :usuarioId OR t.usuario IS NULL)")
    boolean existsByNombreForUser(@Param("nombre") String nombre, @Param("usuarioId") Long usuarioId);

    boolean existsByNombre(String nombre);

}
