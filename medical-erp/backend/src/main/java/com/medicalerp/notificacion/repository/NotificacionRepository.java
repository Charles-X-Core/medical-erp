package com.medicalerp.notificacion.repository;

import com.medicalerp.notificacion.entity.Notificacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface NotificacionRepository extends JpaRepository<Notificacion, Long> {
    List<Notificacion> findByUsuarioDestinoIdAndLeidaFalseOrderByCreatedAtDesc(Long usuarioDestinoId);
    long countByUsuarioDestinoIdAndLeidaFalse(Long usuarioDestinoId);
    List<Notificacion> findByUsuarioDestinoIdOrderByCreatedAtDesc(Long usuarioDestinoId);

    @Modifying
    @Query("UPDATE Notificacion n SET n.leida = true WHERE n.usuarioDestino.id = :usuarioId AND n.leida = false")
    void markAllAsRead(Long usuarioId);
}