package com.medicalerp.cita.mapper;

import com.medicalerp.cita.dto.CitaRequest;
import com.medicalerp.cita.dto.CitaResponse;
import com.medicalerp.cita.entity.Cita;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import java.time.LocalDate;
import java.time.LocalTime;

@Mapper(componentModel = "spring")
public interface CitaMapper {

    @Mapping(target = "pacienteId", source = "paciente.id")
    @Mapping(target = "pacienteNombre", expression = "java(getPacienteNombre(cita))")
    @Mapping(target = "usuarioId", source = "usuario.id")
    @Mapping(target = "usuarioNombre", expression = "java(getUsuarioNombre(cita))")
    @Mapping(target = "tipoCitaId", source = "tipoCita.id")
    @Mapping(target = "tipoCitaNombre", expression = "java(getTipoCitaNombre(cita))")
    CitaResponse toResponse(Cita cita);

    default String getPacienteNombre(Cita cita) {
        if (cita.getPaciente() == null) return null;
        return cita.getPaciente().getApellidoPaterno() + " " + cita.getPaciente().getNombres();
    }

    default String getUsuarioNombre(Cita cita) {
        if (cita.getUsuario() == null) return null;
        return cita.getUsuario().getNombre();
    }

    default String getTipoCitaNombre(Cita cita) {
        if (cita.getTipoCita() == null) return null;
        return cita.getTipoCita().getNombre();
    }

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "paciente", ignore = true)
    @Mapping(target = "usuario", ignore = true)
    @Mapping(target = "tipoCita", ignore = true)
    @Mapping(target = "estado", ignore = true)
    @Mapping(target = "consultaId", ignore = true)
    @Mapping(target = "motivoEditado", ignore = true)
    @Mapping(target = "asistioConfirmedAt", ignore = true)
    @Mapping(target = "canceladoAt", ignore = true)
    @Mapping(target = "canceladoMotivo", ignore = true)
    @Mapping(target = "reprogramadaDe", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "fechaHora", ignore = true)
    Cita toEntity(CitaRequest request);

    default void setFechaHora(Cita cita, LocalDate fecha, LocalTime hora) {
        if (fecha != null && hora != null) {
            cita.setFechaHora(fecha.atTime(hora));
        } else if (fecha != null) {
            cita.setFechaHora(fecha.atStartOfDay());
        }
    }

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "paciente", ignore = true)
    @Mapping(target = "usuario", ignore = true)
    @Mapping(target = "tipoCita", ignore = true)
    @Mapping(target = "estado", ignore = true)
    @Mapping(target = "consultaId", ignore = true)
    @Mapping(target = "motivoEditado", ignore = true)
    @Mapping(target = "asistioConfirmedAt", ignore = true)
    @Mapping(target = "canceladoAt", ignore = true)
    @Mapping(target = "canceladoMotivo", ignore = true)
    @Mapping(target = "reprogramadaDe", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "fechaHora", ignore = true)
    void updateEntity(@MappingTarget Cita entity, CitaRequest request);

}
