package com.medicalerp.paciente.mapper;

import com.medicalerp.paciente.dto.PacienteRequest;
import com.medicalerp.paciente.dto.PacienteResponse;
import com.medicalerp.paciente.entity.Paciente;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface PacienteMapper {

    Paciente toEntity(PacienteRequest request);

    PacienteResponse toResponse(Paciente entity);

    void updateEntity(@MappingTarget Paciente entity, PacienteRequest request);

}
