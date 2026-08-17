package com.medicalerp.consulta.mapper;

import com.medicalerp.common.util.JsonMapperHelper;
import com.medicalerp.common.valueobject.SignosVitales;
import com.medicalerp.consulta.dto.*;
import com.medicalerp.consulta.entity.Consulta;
import org.mapstruct.*;

import java.util.List;

/**
 * Consulta Mapper with JSON conversion for complex fields
 */
@Mapper(componentModel = "spring")
public interface ConsultaMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "historia", ignore = true)
    @Mapping(target = "signosVitales", source = "signosVitales", qualifiedByName = "toJson")
    @Mapping(target = "diagnosticoLista", source = "diagnosticoLista", qualifiedByName = "toJson")
    @Mapping(target = "planTratamiento", source = "planTratamiento", qualifiedByName = "toJson")
    @Mapping(target = "firmado", ignore = true)
    @Mapping(target = "firmadoAt", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Consulta toEntity(ConsultaRequest request, @Context JsonMapperHelper jsonHelper);

    @Mapping(target = "historiaId", source = "historia.id")
    @Mapping(target = "pacienteId", expression = "java(getPacienteId(consulta))")
    @Mapping(target = "pacienteNombre", expression = "java(getPacienteNombre(consulta))")
    @Mapping(target = "signosVitales", source = "signosVitales", qualifiedByName = "fromJsonSignos")
    @Mapping(target = "diagnosticoLista", source = "diagnosticoLista", qualifiedByName = "fromJsonDiagnosticos")
    @Mapping(target = "planTratamiento", source = "planTratamiento", qualifiedByName = "fromJsonPlan")
    ConsultaResponse toResponse(Consulta consulta, @Context JsonMapperHelper jsonHelper);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "historia", ignore = true)
    @Mapping(target = "signosVitales", source = "signosVitales", qualifiedByName = "toJson")
    @Mapping(target = "diagnosticoLista", source = "diagnosticoLista", qualifiedByName = "toJson")
    @Mapping(target = "planTratamiento", source = "planTratamiento", qualifiedByName = "toJson")
    @Mapping(target = "firmado", ignore = true)
    @Mapping(target = "firmadoAt", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntity(@MappingTarget Consulta entity, ConsultaRequest request, @Context JsonMapperHelper jsonHelper);

    default Long getPacienteId(Consulta consulta) {
        if (consulta.getHistoria() == null || consulta.getHistoria().getPaciente() == null) return null;
        return consulta.getHistoria().getPaciente().getId();
    }

    default String getPacienteNombre(Consulta consulta) {
        if (consulta.getHistoria() == null || consulta.getHistoria().getPaciente() == null) return null;
        return consulta.getHistoria().getPaciente().getApellidoPaterno() + " " + consulta.getHistoria().getPaciente().getNombres();
    }

    @Named("toJson")
    default String toJson(Object value, @Context JsonMapperHelper jsonHelper) {
        return jsonHelper.toJson(value);
    }

    @Named("fromJsonSignos")
    default SignosVitales fromJsonSignos(String json, @Context JsonMapperHelper jsonHelper) {
        return jsonHelper.fromJson(json, SignosVitales.class);
    }

    @Named("fromJsonDiagnosticos")
    default List<Diagnostico> fromJsonDiagnosticos(String json, @Context JsonMapperHelper jsonHelper) {
        return jsonHelper.fromJsonList(json, Diagnostico.class);
    }

    @Named("fromJsonPlan")
    default PlanTratamiento fromJsonPlan(String json, @Context JsonMapperHelper jsonHelper) {
        return jsonHelper.fromJson(json, PlanTratamiento.class);
    }

}
