package com.medicalerp.paciente.mapper;

import com.medicalerp.paciente.dto.PacienteSeguroRequest;
import com.medicalerp.paciente.dto.PacienteSeguroResponse;
import com.medicalerp.paciente.entity.PacienteSeguro;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface PacienteSeguroMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "paciente", ignore = true)
    @Mapping(target = "clinicaId", ignore = true)
    @Mapping(target = "deletedAt", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    PacienteSeguro toEntity(PacienteSeguroRequest request);

    @Mapping(target = "pacienteId", source = "paciente.id")
    PacienteSeguroResponse toResponse(PacienteSeguro entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "paciente", ignore = true)
    @Mapping(target = "clinicaId", ignore = true)
    @Mapping(target = "deletedAt", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntity(@MappingTarget PacienteSeguro entity, PacienteSeguroRequest request);
}
