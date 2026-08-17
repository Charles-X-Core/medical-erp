package com.medicalerp.tratamiento.mapper;

import com.medicalerp.tratamiento.dto.TipoSesionTratamientoResponse;
import com.medicalerp.tratamiento.entity.TipoSesionTratamiento;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface TipoSesionTratamientoMapper {

    TipoSesionTratamientoResponse toResponse(TipoSesionTratamiento entity);

}
