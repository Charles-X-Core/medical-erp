package com.medicalerp.documento.mapper;

import com.medicalerp.documento.dto.DocumentoRequest;
import com.medicalerp.documento.dto.DocumentoResponse;
import com.medicalerp.documento.entity.Documento;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface DocumentoMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "paciente", ignore = true)
    @Mapping(target = "usuario", ignore = true)
    @Mapping(target = "archivoRuta", ignore = true)
    @Mapping(target = "hashSha256", ignore = true)
    @Mapping(target = "firmado", ignore = true)
    @Mapping(target = "firmadoAt", ignore = true)
    @Mapping(target = "estado", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Documento toEntity(DocumentoRequest request);

    @Mapping(target = "pacienteId", source = "paciente.id")
    @Mapping(target = "pacienteNombre", expression = "java(getPacienteNombre(documento))")
    @Mapping(target = "usuarioId", source = "usuario.id")
    @Mapping(target = "usuarioNombre", expression = "java(getUsuarioNombre(documento))")
    DocumentoResponse toResponse(Documento documento);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "paciente", ignore = true)
    @Mapping(target = "usuario", ignore = true)
    @Mapping(target = "archivoRuta", ignore = true)
    @Mapping(target = "hashSha256", ignore = true)
    @Mapping(target = "firmado", ignore = true)
    @Mapping(target = "firmadoAt", ignore = true)
    @Mapping(target = "estado", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntity(@MappingTarget Documento entity, DocumentoRequest request);

    default String getPacienteNombre(Documento documento) {
        if (documento.getPaciente() == null) return null;
        return documento.getPaciente().getApellidoPaterno() + " " + documento.getPaciente().getNombres();
    }

    default String getUsuarioNombre(Documento documento) {
        if (documento.getUsuario() == null) return null;
        return documento.getUsuario().getNombre();
    }

}
