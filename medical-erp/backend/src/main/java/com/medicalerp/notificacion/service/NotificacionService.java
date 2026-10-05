package com.medicalerp.notificacion.service;

import com.medicalerp.common.exception.ResourceNotFoundException;
import com.medicalerp.notificacion.dto.NotificacionRequest;
import com.medicalerp.notificacion.dto.NotificacionResponse;
import com.medicalerp.notificacion.entity.Notificacion;
import com.medicalerp.notificacion.mapper.NotificacionMapper;
import com.medicalerp.notificacion.repository.NotificacionRepository;
import com.medicalerp.seguridad.entity.Usuario;
import com.medicalerp.seguridad.repository.UsuarioRepository;
import com.medicalerp.common.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NotificacionService {
    private final NotificacionRepository notificacionRepository;
    private final UsuarioRepository usuarioRepository;
    private final NotificacionMapper notificacionMapper;
    private final SecurityUtils securityUtils;

    public List<NotificacionResponse> getNoLeidas() {
        Long userId = securityUtils.getCurrentUserId();
        return notificacionRepository.findByUsuarioDestinoIdAndLeidaFalseOrderByCreatedAtDesc(userId)
                .stream().map(notificacionMapper::toResponse).toList();
    }

    public long countNoLeidas() {
        Long userId = securityUtils.getCurrentUserId();
        return notificacionRepository.countByUsuarioDestinoIdAndLeidaFalse(userId);
    }

    public List<NotificacionResponse> getAll() {
        Long userId = securityUtils.getCurrentUserId();
        return notificacionRepository.findByUsuarioDestinoIdOrderByCreatedAtDesc(userId)
                .stream().map(notificacionMapper::toResponse).toList();
    }

    @Transactional
    public NotificacionResponse marcarLeida(Long id) {
        Notificacion n = notificacionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notificacion", id));
        n.setLeida(true);
        return notificacionMapper.toResponse(notificacionRepository.save(n));
    }

    @Transactional
    public void marcarTodasLeidas() {
        Long userId = securityUtils.getCurrentUserId();
        notificacionRepository.markAllAsRead(userId);
    }

    @Transactional
    public NotificacionResponse crear(NotificacionRequest request) {
        Long clinicaId = securityUtils.getCurrentClinicaId();
        Long origenId = securityUtils.getCurrentUserId();

        Usuario destino = usuarioRepository.findById(request.getUsuarioDestinoId())
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", request.getUsuarioDestinoId()));
        Usuario origen = usuarioRepository.findById(origenId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", origenId));

        Notificacion n = Notificacion.builder()
                .clinicaId(clinicaId)
                .usuarioDestino(destino)
                .usuarioOrigen(origen)
                .tipo(request.getTipo())
                .titulo(request.getTitulo())
                .mensaje(request.getMensaje())
                .referenciaTipo(request.getReferenciaTipo())
                .referenciaId(request.getReferenciaId())
                .leida(false)
                .build();
        return notificacionMapper.toResponse(notificacionRepository.save(n));
    }

    /**
     * Crea una notificación in-app con origen de sistema (admin id=1).
     * Pensado para tareas programadas (schedulers) donde no hay usuario autenticado.
     * Usa REQUIRES_NEW para ejecutar en una transacción separada: si la notificación
     * falla, no revierte la transacción del caller (ej. NoShowScheduler).
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public NotificacionResponse crearSistema(Long destinoId, NotificacionRequest request) {
        Long clinicaId = null;
        try {
            clinicaId = securityUtils.getCurrentClinicaId();
        } catch (Exception ignored) {
            // Scheduler context — no authenticated user
        }
        if (clinicaId == null) clinicaId = 1L;

        Usuario destino = usuarioRepository.findById(destinoId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", destinoId));
        Usuario origen = usuarioRepository.findById(1L)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario sistema", 1L));

        Notificacion n = Notificacion.builder()
                .clinicaId(clinicaId)
                .usuarioDestino(destino)
                .usuarioOrigen(origen)
                .tipo(request.getTipo())
                .titulo(request.getTitulo())
                .mensaje(request.getMensaje())
                .referenciaTipo(request.getReferenciaTipo())
                .referenciaId(request.getReferenciaId())
                .leida(false)
                .build();
        return notificacionMapper.toResponse(notificacionRepository.save(n));
    }
}