package com.medicalerp.consulta.mapper;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.medicalerp.consulta.dto.*;
import com.medicalerp.consulta.entity.Consulta;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.mapstruct.*;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Consulta Mapper with JSON conversion for complex fields
 */
@Mapper(componentModel = "spring", uses = ConsultaMapper.JsonMapperHelper.class)
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

    @Slf4j
    @Component
    @RequiredArgsConstructor
    class JsonMapperHelper {
        private final ObjectMapper objectMapper;

        @Named("toJson")
        public String toJson(Object value) {
            if (value == null) return null;
            try {
                return objectMapper.writeValueAsString(value);
            } catch (JsonProcessingException e) {
                log.error("Error serializing to JSON", e);
                return null;
            }
        }

        @Named("fromJsonSignos")
        public SignosVitales fromJsonSignos(String json) {
            return fromJson(json, SignosVitales.class);
        }

        @Named("fromJsonDiagnosticos")
        public List<Diagnostico> fromJsonDiagnosticos(String json) {
            if (json == null || json.isBlank()) return null;
            try {
                return objectMapper.readValue(json, objectMapper.getTypeFactory().constructCollectionType(List.class, Diagnostico.class));
            } catch (JsonProcessingException e) {
                log.error("Error deserializing diagnosticos", e);
                return null;
            }
        }

        @Named("fromJsonPlan")
        public PlanTratamiento fromJsonPlan(String json) {
            return fromJson(json, PlanTratamiento.class);
        }

        private <T> T fromJson(String json, Class<T> clazz) {
            if (json == null || json.isBlank()) return null;
            try {
                return objectMapper.readValue(json, clazz);
            } catch (JsonProcessingException e) {
                log.error("Error deserializing JSON", e);
                return null;
            }
        }
    }

}
