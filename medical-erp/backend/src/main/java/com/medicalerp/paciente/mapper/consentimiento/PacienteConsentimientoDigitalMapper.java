package com.medicalerp.paciente.mapper.consentimiento;

import com.medicalerp.paciente.dto.PacienteConsentimientoResponse;
import com.medicalerp.paciente.entity.PacienteConsentimiento;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface PacienteConsentimientoDigitalMapper {

    @Mapping(target = "pacienteId", source = "paciente.id")
    @Mapping(target = "templateId", source = "template.id")
    PacienteConsentimientoResponse toResponse(PacienteConsentimiento entity);
}
