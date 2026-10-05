package com.medicalerp.tratamiento.service;

import com.medicalerp.agenda.dto.SlotDisponibilidad;
import com.medicalerp.agenda.engine.AvailabilityEngine;
import com.medicalerp.agenda.enums.SlotEstado;
import com.medicalerp.agenda.entity.Agenda;
import com.medicalerp.agenda.entity.Bloqueo;
import com.medicalerp.agenda.entity.Disponibilidad;
import com.medicalerp.agenda.repository.AgendaRepository;
import com.medicalerp.agenda.repository.BloqueoRepository;
import com.medicalerp.agenda.repository.DisponibilidadRepository;
import com.medicalerp.cita.entity.Cita;
import com.medicalerp.cita.repository.CitaRepository;
import com.medicalerp.common.exception.ResourceNotFoundException;
import com.medicalerp.tratamiento.dto.HorarioDisponible;
import com.medicalerp.tratamiento.dto.SugerenciaCitaResponse;
import com.medicalerp.tratamiento.entity.ProtocoloClinico;
import com.medicalerp.tratamiento.entity.SesionTratamiento;
import com.medicalerp.tratamiento.entity.Tratamiento;
import com.medicalerp.tratamiento.repository.SesionTratamientoRepository;
import com.medicalerp.tratamiento.repository.TratamientoRepository;
import com.medicalerp.common.util.BusinessTime;
import com.medicalerp.seguridad.entity.Usuario;
import com.medicalerp.seguridad.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/**
 * SugerenciaCita Service
 * Calcula en tiempo real la proxima cita recomendada usando AvailabilityEngine
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SugerenciaCitaService {

    private final TratamientoRepository tratamientoRepository;
    private final SesionTratamientoRepository sesionRepository;
    private final AgendaRepository agendaRepository;
    private final DisponibilidadRepository disponibilidadRepository;
    private final BloqueoRepository bloqueoRepository;
    private final CitaRepository citaRepository;
    private final UsuarioRepository usuarioRepository;
    private final ProtocoloClinicoService protocoloService;
    private final AvailabilityEngine availabilityEngine;

    public SugerenciaCitaResponse sugerir(Long tratamientoId) {
        Tratamiento tratamiento = tratamientoRepository.findById(tratamientoId)
                .orElseThrow(() -> new ResourceNotFoundException("Tratamiento", tratamientoId));

        ProtocoloClinico protocolo = protocoloService.findByTratamientoId(tratamientoId);

        if (protocolo.getFrecuenciaDias() == null) {
            return null;
        }

        SesionTratamiento ultimaSesion = sesionRepository.findUltimaByTratamientoId(tratamientoId)
                .orElse(null);

        LocalDate fechaMinima;
        if (ultimaSesion != null) {
            fechaMinima = ultimaSesion.getFecha().toLocalDate().plusDays(protocolo.getFrecuenciaDias());
        } else {
            // Si permiteInicioInmediato es true, puede iniciar hoy
            // Si es false, debe esperar al menos 1 día
            if (Boolean.TRUE.equals(protocolo.getPermiteInicioInmediato())) {
                fechaMinima = LocalDate.now(BusinessTime.ZONE);
            } else {
                fechaMinima = LocalDate.now(BusinessTime.ZONE).plusDays(1);
            }
        }

        if (fechaMinima.isBefore(LocalDate.now(BusinessTime.ZONE))) {
            fechaMinima = LocalDate.now(BusinessTime.ZONE);
        }

        int duracionSesion = protocolo.getDuracionSesionMinutos() != null ? protocolo.getDuracionSesionMinutos() : 60;

        if (tratamiento.getUsuarioAsignadoId() == null) {
            return SugerenciaCitaResponse.builder()
                    .fechaRecomendada(fechaMinima)
                    .horariosDisponibles(List.of())
                    .frecuenciaDias(protocolo.getFrecuenciaDias())
                    .notasProtocolo(protocolo.getNotasProtocolo())
                    .build();
        }

        Agenda agenda = agendaRepository.findByUsuarioId(tratamiento.getUsuarioAsignadoId())
                .orElse(null);

        if (agenda == null) {
            return SugerenciaCitaResponse.builder()
                    .fechaRecomendada(fechaMinima)
                    .horariosDisponibles(List.of())
                    .frecuenciaDias(protocolo.getFrecuenciaDias())
                    .notasProtocolo(protocolo.getNotasProtocolo())
                    .build();
        }

        List<Disponibilidad> disponibilidades = disponibilidadRepository.findByAgendaId(agenda.getId());
        List<Bloqueo> bloqueos = bloqueoRepository.findByAgendaId(agenda.getId());
        List<Cita> citasExistentes = citaRepository.findListByUsuarioId(tratamiento.getUsuarioAsignadoId());

        Usuario usuario = usuarioRepository.findById(tratamiento.getUsuarioAsignadoId()).orElse(null);

        List<SlotDisponibilidad> slots = availabilityEngine.calcularSlotsSemana(
                agenda, disponibilidades, bloqueos, citasExistentes,
                fechaMinima, fechaMinima.plusDays(7), duracionSesion);

        List<HorarioDisponible> horarios = slots.stream()
                .filter(s -> SlotEstado.DISPONIBLE.equals(s.getEstado()))
                .map(s -> HorarioDisponible.builder()
                        .hora(s.getInicio())
                        .usuarioId(tratamiento.getUsuarioAsignadoId())
                        .usuarioNombre(usuario != null ? usuario.getNombre() : null)
                        .duracionMinutos(duracionSesion)
                        .build())
                .toList();

        return SugerenciaCitaResponse.builder()
                .fechaRecomendada(fechaMinima)
                .horariosDisponibles(horarios)
                .frecuenciaDias(protocolo.getFrecuenciaDias())
                .notasProtocolo(protocolo.getNotasProtocolo())
                .build();
    }

}
