package com.medicalerp.timeline.mapper;

import com.medicalerp.timeline.dto.TimelineEvent;
import com.medicalerp.timeline.enums.TimelineTipo;
import org.springframework.stereotype.Component;

/**
 * TimelineMapper
 * Convierte entidades de otros módulos en eventos del Timeline
 * Refleja el estado REAL de cada entidad, no un estado inventado
 */
@Component
public class TimelineMapper {

    public TimelineEvent fromConsulta(com.medicalerp.consulta.entity.Consulta consulta) {
        return TimelineEvent.builder()
                .id(consulta.getId())
                .tipo(TimelineTipo.CONSULTA)
                .estadoOriginal("REGISTRADA")
                .fecha(consulta.getFecha())
                .titulo("Consulta: " + consulta.getMotivo())
                .descripcion(consulta.getDiagnosticoLista())
                .referenciaId(consulta.getId())
                .build();
    }

    public TimelineEvent fromTratamiento(com.medicalerp.tratamiento.entity.Tratamiento tratamiento) {
        return TimelineEvent.builder()
                .id(tratamiento.getId())
                .tipo(TimelineTipo.TRATAMIENTO)
                .estadoOriginal(tratamiento.getEstado().name())
                .fecha(tratamiento.getCreatedAt())
                .titulo("Tratamiento: " + tratamiento.getTipoTratamiento())
                .descripcion(tratamiento.getObjetivo())
                .referenciaId(tratamiento.getId())
                .build();
    }

    public TimelineEvent fromSesion(com.medicalerp.tratamiento.entity.SesionTratamiento sesion) {
        return TimelineEvent.builder()
                .id(sesion.getId())
                .tipo(TimelineTipo.SESION)
                .estadoOriginal("REGISTRADA")
                .fecha(sesion.getFecha())
                .titulo("Sesión #" + sesion.getNumeroSesion())
                .descripcion(sesion.getMotivoVisita())
                .referenciaId(sesion.getId())
                .build();
    }

    public TimelineEvent fromCita(com.medicalerp.cita.entity.Cita cita) {
        return TimelineEvent.builder()
                .id(cita.getId())
                .tipo(TimelineTipo.CITA)
                .estadoOriginal(cita.getEstado())
                .fecha(cita.getCreatedAt())
                .titulo("Cita" + (cita.getTipoCita() != null ? ": " + cita.getTipoCita().getNombre() : ""))
                .descripcion(cita.getMotivo())
                .referenciaId(cita.getId())
                .build();
    }

}
