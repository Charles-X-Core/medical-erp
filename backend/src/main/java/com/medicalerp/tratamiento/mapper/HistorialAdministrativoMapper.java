package com.medicalerp.tratamiento.mapper;

import com.medicalerp.tratamiento.dto.HistorialAdministrativoResponse;
import com.medicalerp.tratamiento.entity.HistorialAdministrativo;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface HistorialAdministrativoMapper {

    @Mapping(target = "usuarioNombre", ignore = true)
    HistorialAdministrativoResponse toResponse(HistorialAdministrativo entity);

}
