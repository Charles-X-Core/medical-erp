package com.medicalerp.tratamiento.mapper;

import com.medicalerp.tratamiento.dto.EvidenciaTratamientoResponse;
import com.medicalerp.tratamiento.entity.EvidenciaTratamiento;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface EvidenciaTratamientoMapper {

    EvidenciaTratamientoResponse toResponse(EvidenciaTratamiento entity);

}
