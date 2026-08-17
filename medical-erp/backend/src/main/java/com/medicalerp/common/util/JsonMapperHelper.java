package com.medicalerp.common.util;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Helper generico para serializacion/deserializacion JSON.
 * Reutilizado por ConsultaMapper y SesionTratamientoMapper.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JsonMapperHelper {

    private final ObjectMapper objectMapper;

    public String toJson(Object value) {
        if (value == null) return null;
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException e) {
            log.error("Error serializing to JSON", e);
            return null;
        }
    }

    public <T> T fromJson(String json, Class<T> clazz) {
        if (json == null || json.isBlank()) return null;
        try {
            return objectMapper.readValue(json, clazz);
        } catch (JsonProcessingException e) {
            log.error("Error deserializing JSON", e);
            return null;
        }
    }

    public <T> List<T> fromJsonList(String json, Class<T> elementClass) {
        if (json == null || json.isBlank()) return null;
        try {
            return objectMapper.readValue(json,
                    objectMapper.getTypeFactory().constructCollectionType(List.class, elementClass));
        } catch (JsonProcessingException e) {
            log.error("Error deserializing JSON list", e);
            return null;
        }
    }

}
