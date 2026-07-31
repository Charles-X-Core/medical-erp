package com.medicalerp.agenda.mapper;

import com.medicalerp.agenda.dto.*;
import com.medicalerp.agenda.entity.Agenda;
import com.medicalerp.agenda.entity.Disponibilidad;
import com.medicalerp.agenda.entity.Bloqueo;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface AgendaMapper {

    @Mapping(target = "usuarioId", source = "usuario.id")
    @Mapping(target = "usuarioNombre", source = "usuario.nombre")
    @Mapping(target = "disponibilidades", expression = "java(mapDisponibilidades(agenda.getDisponibilidades()))")
    @Mapping(target = "bloqueos", expression = "java(mapBloqueos(agenda.getBloqueos()))")
    AgendaResponse toResponse(Agenda agenda);

    List<DisponibilidadResponse> mapDisponibilidades(List<Disponibilidad> disponibilidades);

    List<BloqueoResponse> mapBloqueos(List<Bloqueo> bloqueos);

    DisponibilidadResponse toResponse(Disponibilidad disponibilidad);

    BloqueoResponse toResponse(Bloqueo bloqueo);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "agenda", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Disponibilidad toEntity(DisponibilidadRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "agenda", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Bloqueo toEntity(BloqueoRequest request);

}
