package com.medicalerp.paciente.mapper.consentimiento;

import com.medicalerp.paciente.dto.consentimiento.ConsentTemplateRequest;
import com.medicalerp.paciente.dto.consentimiento.ConsentTemplateResponse;
import com.medicalerp.paciente.entity.consentimiento.ConsentTemplate;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface ConsentTemplateMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "clinicaId", ignore = true)
    @Mapping(target = "storagePath", ignore = true)
    @Mapping(target = "activo", ignore = true)
    @Mapping(target = "deletedAt", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    ConsentTemplate toEntity(ConsentTemplateRequest request);

    ConsentTemplateResponse toResponse(ConsentTemplate entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "clinicaId", ignore = true)
    @Mapping(target = "storagePath", ignore = true)
    @Mapping(target = "activo", ignore = true)
    @Mapping(target = "deletedAt", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntity(@MappingTarget ConsentTemplate entity, ConsentTemplateRequest request);
}
