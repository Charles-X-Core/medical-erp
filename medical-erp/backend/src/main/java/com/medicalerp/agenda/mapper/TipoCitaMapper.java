package com.medicalerp.agenda.mapper;

import com.medicalerp.agenda.dto.TipoCitaRequest;
import com.medicalerp.agenda.dto.TipoCitaResponse;
import com.medicalerp.agenda.entity.TipoCita;
import org.mapstruct.*;

@Mapper(componentModel = "spring")
public interface TipoCitaMapper {

    @Mapping(target = "duracionTotal", expression = "java(entity.getDuracionMinutos() + entity.getBufferMinutos())")
    TipoCitaResponse toResponse(TipoCita entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "activo", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    TipoCita toEntity(TipoCitaRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "activo", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntity(@MappingTarget TipoCita entity, TipoCitaRequest request);

}
