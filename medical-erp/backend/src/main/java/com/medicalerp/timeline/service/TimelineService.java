package com.medicalerp.timeline.service;

import com.medicalerp.cita.entity.Cita;
import com.medicalerp.cita.repository.CitaRepository;
import com.medicalerp.consulta.repository.ConsultaRepository;
import com.medicalerp.historia.entity.HistoriaClinica;
import com.medicalerp.historia.repository.HistoriaClinicaRepository;
import com.medicalerp.paciente.entity.Paciente;
import com.medicalerp.paciente.repository.PacienteRepository;
import com.medicalerp.common.exception.ResourceNotFoundException;
import com.medicalerp.timeline.dto.TimelineEvent;
import com.medicalerp.timeline.dto.TimelineResponse;
import com.medicalerp.timeline.mapper.TimelineMapper;
import com.medicalerp.tratamiento.entity.Tratamiento;
import com.medicalerp.tratamiento.repository.SesionTratamientoRepository;
import com.medicalerp.tratamiento.repository.TratamientoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * TimelineService
 * Proyección cronológica de eventos del paciente
 * No modifica datos, solo consulta repositorios de otros módulos
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TimelineService {

    private final PacienteRepository pacienteRepository;
    private final HistoriaClinicaRepository historiaRepository;
    private final ConsultaRepository consultaRepository;
    private final TratamientoRepository tratamientoRepository;
    private final SesionTratamientoRepository sesionRepository;
    private final CitaRepository citaRepository;
    private final TimelineMapper mapper;

    /**
     * Obtiene el timeline completo de un paciente
     */
    public TimelineResponse getTimeline(Long pacienteId) {
        Paciente paciente = pacienteRepository.findById(pacienteId)
                .orElseThrow(() -> new ResourceNotFoundException("Paciente", pacienteId));

        List<TimelineEvent> eventos = new ArrayList<>();

        // Obtener historias clínicas del paciente
        List<HistoriaClinica> historias = historiaRepository.findAllByPacienteId(pacienteId);

        // Consultas (a través de historias clínicas)
        for (HistoriaClinica historia : historias) {
            consultaRepository.findByHistoriaId(historia.getId())
                    .forEach(c -> eventos.add(mapper.fromConsulta(c)));
        }

        // Tratamientos
        List<Tratamiento> tratamientos = tratamientoRepository.findByPacienteIdAndEstadoIn(
                pacienteId, List.of(
                        com.medicalerp.tratamiento.enums.EstadoTratamiento.PENDIENTE,
                        com.medicalerp.tratamiento.enums.EstadoTratamiento.PROGRAMADO,
                        com.medicalerp.tratamiento.enums.EstadoTratamiento.EN_CURSO,
                        com.medicalerp.tratamiento.enums.EstadoTratamiento.PAUSADO,
                        com.medicalerp.tratamiento.enums.EstadoTratamiento.FINALIZADO,
                        com.medicalerp.tratamiento.enums.EstadoTratamiento.CANCELADO
                ));
        tratamientos.forEach(t -> eventos.add(mapper.fromTratamiento(t)));

        // Sesiones (a través de tratamientos)
        List<Long> tratamientoIds = tratamientos.stream().map(Tratamiento::getId).toList();
        if (!tratamientoIds.isEmpty()) {
            sesionRepository.findByTratamientoIdIn(tratamientoIds)
                    .forEach(s -> eventos.add(mapper.fromSesion(s)));
        }

        // Citas
        Page<Cita> citasPage = citaRepository.findByPacienteId(pacienteId, PageRequest.of(0, 1000));
        citasPage.forEach(c -> eventos.add(mapper.fromCita(c)));

        // Ordenar por fecha descendente
        eventos.sort(Comparator.comparing(TimelineEvent::getFecha).reversed());

        return TimelineResponse.builder()
                .pacienteId(pacienteId)
                .pacienteNombre(paciente.getNombres() + " " + paciente.getApellidoPaterno())
                .eventos(eventos)
                .build();
    }

}
