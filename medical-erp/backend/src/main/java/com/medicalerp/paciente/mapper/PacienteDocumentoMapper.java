package com.medicalerp.paciente.mapper;

import com.medicalerp.paciente.dto.PacienteDocumentoRequest;
import com.medicalerp.paciente.dto.PacienteDocumentoResponse;
import com.medicalerp.paciente.entity.PacienteDocumento;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface PacienteDocumentoMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "paciente", ignore = true)
    @Mapping(target = "clinicaId", ignore = true)
    @Mapping(target = "deletedAt", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    PacienteDocumento toEntity(PacienteDocumentoRequest request);

    @Mapping(target = "pacienteId", source = "paciente.id")
    PacienteDocumentoResponse toResponse(PacienteDocumento entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "paciente", ignore = true)
    @Mapping(target = "clinicaId", ignore = true)
    @Mapping(target = "deletedAt", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntity(@MappingTarget PacienteDocumento entity, PacienteDocumentoRequest request);
}
