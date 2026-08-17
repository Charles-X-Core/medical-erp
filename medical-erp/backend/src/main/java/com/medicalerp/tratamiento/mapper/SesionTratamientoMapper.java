package com.medicalerp.tratamiento.mapper;

import com.medicalerp.common.util.JsonMapperHelper;
import com.medicalerp.common.valueobject.SignosVitales;
import com.medicalerp.tratamiento.dto.SesionTratamientoRequest;
import com.medicalerp.tratamiento.dto.SesionTratamientoResponse;
import com.medicalerp.tratamiento.entity.SesionTratamiento;
import org.mapstruct.*;

@Mapper(componentModel = "spring")
public interface SesionTratamientoMapper {

    @Mapping(target = "tipoSesionNombre", ignore = true)
    @Mapping(target = "evidencias", ignore = true)
    @Mapping(target = "signosVitales", source = "signosVitales", qualifiedByName = "fromJsonSignos")
    SesionTratamientoResponse toResponse(SesionTratamiento entity, @Context JsonMapperHelper jsonHelper);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "tratamientoId", ignore = true)
    @Mapping(target = "clinicaId", ignore = true)
    @Mapping(target = "numeroSesion", ignore = true)
    @Mapping(target = "signosVitales", source = "signosVitales", qualifiedByName = "toJson")
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    SesionTratamiento toEntity(SesionTratamientoRequest request, @Context JsonMapperHelper jsonHelper);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "tratamientoId", ignore = true)
    @Mapping(target = "clinicaId", ignore = true)
    @Mapping(target = "numeroSesion", ignore = true)
    @Mapping(target = "signosVitales", source = "signosVitales", qualifiedByName = "toJson")
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntity(@MappingTarget SesionTratamiento entity, SesionTratamientoRequest request, @Context JsonMapperHelper jsonHelper);

    @Named("toJson")
    default String toJson(Object value, @Context JsonMapperHelper jsonHelper) {
        return jsonHelper.toJson(value);
    }

    @Named("fromJsonSignos")
    default SignosVitales fromJsonSignos(String json, @Context JsonMapperHelper jsonHelper) {
        return jsonHelper.fromJson(json, SignosVitales.class);
    }

}
