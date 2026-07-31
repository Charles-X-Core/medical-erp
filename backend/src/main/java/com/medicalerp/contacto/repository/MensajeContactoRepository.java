package com.medicalerp.contacto.repository;

import com.medicalerp.contacto.entity.MensajeContacto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * MensajeContacto Repository (DOM-CON-002)
 */
@Repository
public interface MensajeContactoRepository extends JpaRepository<MensajeContacto, Long> {

    Page<MensajeContacto> findByEstado(String estado, Pageable pageable);

    List<MensajeContacto> findByEmail(String email);

    @Query("SELECT COUNT(m) FROM MensajeContacto m WHERE m.ipAddress = :ip AND m.createdAt > :since")
    long countByIpAddressSince(@Param("ip") String ip, @Param("since") LocalDateTime since);

    @Modifying
    @Query("UPDATE MensajeContacto m SET m.estado = :estado, m.readAt = CASE WHEN :estado = 'leido' THEN CURRENT_TIMESTAMP ELSE m.readAt END, m.repliedAt = CASE WHEN :estado = 'respondido' THEN CURRENT_TIMESTAMP ELSE m.repliedAt END WHERE m.id = :id")
    int updateEstado(@Param("id") Long id, @Param("estado") String estado);

}
