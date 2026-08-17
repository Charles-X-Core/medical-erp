package com.medicalerp.notificacion.mapper;

import com.medicalerp.notificacion.dto.NotificacionResponse;
import com.medicalerp.notificacion.entity.Notificacion;
import org.springframework.stereotype.Component;

@Component
public class NotificacionMapper {
    public NotificacionResponse toResponse(Notificacion n) {
        return NotificacionResponse.builder()
                .id(n.getId())
                .usuarioDestinoId(n.getUsuarioDestino().getId())
                .usuarioOrigenId(n.getUsuarioOrigen().getId())
                .usuarioOrigenNombre(n.getUsuarioOrigen().getNombre())
                .tipo(n.getTipo())
                .titulo(n.getTitulo())
                .mensaje(n.getMensaje())
                .referenciaTipo(n.getReferenciaTipo())
                .referenciaId(n.getReferenciaId())
                .leida(n.getLeida())
                .createdAt(n.getCreatedAt())
                .build();
    }
}