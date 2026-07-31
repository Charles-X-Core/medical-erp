package com.medicalerp.agenda.mapper;

import com.medicalerp.agenda.dto.TipoCitaRequest;
import com.medicalerp.agenda.dto.TipoCitaResponse;
import com.medicalerp.agenda.entity.TipoCita;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface TipoCitaMapper {

    TipoCita toEntity(TipoCitaRequest request);

    TipoCitaResponse toResponse(TipoCita entity);

    void updateEntity(@MappingTarget TipoCita entity, TipoCitaRequest request);

}
