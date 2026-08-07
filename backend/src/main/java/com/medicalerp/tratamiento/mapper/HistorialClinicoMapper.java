package com.medicalerp.tratamiento.mapper;

import com.medicalerp.tratamiento.dto.HistorialClinicoResponse;
import com.medicalerp.tratamiento.entity.HistorialClinico;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface HistorialClinicoMapper {

    @Mapping(target = "usuarioNombre", ignore = true)
    HistorialClinicoResponse toResponse(HistorialClinico entity);

}
