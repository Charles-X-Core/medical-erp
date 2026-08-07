package com.medicalerp.tratamiento.mapper;

import com.medicalerp.tratamiento.dto.ProtocoloClinicoRequest;
import com.medicalerp.tratamiento.dto.ProtocoloClinicoResponse;
import com.medicalerp.tratamiento.entity.ProtocoloClinico;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface ProtocoloClinicoMapper {

    ProtocoloClinicoResponse toResponse(ProtocoloClinico entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "tratamientoId", ignore = true)
    @Mapping(target = "clinicaId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    ProtocoloClinico toEntity(ProtocoloClinicoRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "tratamientoId", ignore = true)
    @Mapping(target = "clinicaId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntity(@MappingTarget ProtocoloClinico entity, ProtocoloClinicoRequest request);

}
