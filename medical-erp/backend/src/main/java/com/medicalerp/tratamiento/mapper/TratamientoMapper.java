package com.medicalerp.tratamiento.mapper;

import com.medicalerp.tratamiento.dto.TratamientoRequest;
import com.medicalerp.tratamiento.dto.TratamientoResponse;
import com.medicalerp.tratamiento.entity.Tratamiento;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface TratamientoMapper {

    @Mapping(target = "sesionesRestantes", expression = "java(tratamiento.getSesionesRestantes())")
    @Mapping(target = "pacienteNombre", ignore = true)
    @Mapping(target = "usuarioAsignadoNombre", ignore = true)
    @Mapping(target = "protocolo", ignore = true)
    @Mapping(target = "proximaAccion", ignore = true)
    @Mapping(target = "alertas", ignore = true)
    @Mapping(target = "mensaje", ignore = true)
    TratamientoResponse toResponse(Tratamiento tratamiento);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "clinicaId", ignore = true)
    @Mapping(target = "fechaInicio", ignore = true)
    @Mapping(target = "fechaFin", ignore = true)
    @Mapping(target = "estado", ignore = true)
    @Mapping(target = "sesionesRealizadas", ignore = true)
    @Mapping(target = "costoTotal", ignore = true)
    @Mapping(target = "resultadoFinal", ignore = true)
    @Mapping(target = "motivoCancelacion", ignore = true)
    @Mapping(target = "motivoPausa", ignore = true)
    @Mapping(target = "version", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "deletedAt", ignore = true)
    Tratamiento toEntity(TratamientoRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "clinicaId", ignore = true)
    @Mapping(target = "pacienteId", ignore = true)
    @Mapping(target = "historiaClinicaId", ignore = true)
    @Mapping(target = "consultaOrigenId", ignore = true)
    @Mapping(target = "fechaInicio", ignore = true)
    @Mapping(target = "fechaFin", ignore = true)
    @Mapping(target = "estado", ignore = true)
    @Mapping(target = "sesionesRealizadas", ignore = true)
    @Mapping(target = "costoTotal", ignore = true)
    @Mapping(target = "resultadoFinal", ignore = true)
    @Mapping(target = "motivoCancelacion", ignore = true)
    @Mapping(target = "motivoPausa", ignore = true)
    @Mapping(target = "version", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "deletedAt", ignore = true)
    void updateEntity(@MappingTarget Tratamiento entity, TratamientoRequest request);

}
