package com.medicalerp.paciente.mapper;

import com.medicalerp.paciente.dto.PacienteConsentimientoRequest;
import com.medicalerp.paciente.dto.PacienteConsentimientoResponse;
import com.medicalerp.paciente.entity.PacienteConsentimiento;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface PacienteConsentimientoMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "paciente", ignore = true)
    @Mapping(target = "clinicaId", ignore = true)
    @Mapping(target = "deletedAt", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    PacienteConsentimiento toEntity(PacienteConsentimientoRequest request);

    @Mapping(target = "pacienteId", source = "paciente.id")
    PacienteConsentimientoResponse toResponse(PacienteConsentimiento entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "paciente", ignore = true)
    @Mapping(target = "clinicaId", ignore = true)
    @Mapping(target = "deletedAt", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    void updateEntity(@MappingTarget PacienteConsentimiento entity, PacienteConsentimientoRequest request);
}
