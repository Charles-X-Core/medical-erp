package com.medicalerp.historia.mapper;

import com.medicalerp.historia.dto.HistoriaClinicaRequest;
import com.medicalerp.historia.dto.HistoriaClinicaResponse;
import com.medicalerp.historia.entity.HistoriaClinica;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface HistoriaClinicaMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "paciente", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    HistoriaClinica toEntity(HistoriaClinicaRequest request);

    @Mapping(target = "pacienteId", source = "paciente.id")
    @Mapping(target = "pacienteNombre", expression = "java(getPacienteNombre(historia))")
    HistoriaClinicaResponse toResponse(HistoriaClinica historia);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "paciente", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntity(@MappingTarget HistoriaClinica entity, HistoriaClinicaRequest request);

    default String getPacienteNombre(HistoriaClinica historia) {
        if (historia.getPaciente() == null) return null;
        return historia.getPaciente().getApellidoPaterno() + " " + historia.getPaciente().getNombres();
    }

}
