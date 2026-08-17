package com.medicalerp.contacto.mapper;

import com.medicalerp.contacto.dto.MensajeContactoRequest;
import com.medicalerp.contacto.dto.MensajeContactoResponse;
import com.medicalerp.contacto.entity.MensajeContacto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

/**
 * MensajeContacto Mapper (MapStruct)
 */
@Mapper(componentModel = "spring")
public interface MensajeContactoMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "estado", ignore = true)
    @Mapping(target = "ipAddress", ignore = true)
    @Mapping(target = "userAgent", ignore = true)
    @Mapping(target = "readAt", ignore = true)
    @Mapping(target = "repliedAt", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    MensajeContacto toEntity(MensajeContactoRequest request);

    MensajeContactoResponse toResponse(MensajeContacto entity);

    List<MensajeContactoResponse> toResponseList(List<MensajeContacto> entities);

}
