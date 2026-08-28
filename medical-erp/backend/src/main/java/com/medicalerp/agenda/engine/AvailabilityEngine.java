package com.medicalerp.agenda.engine;

import com.medicalerp.agenda.dto.SlotDisponibilidad;
import com.medicalerp.agenda.enums.SlotEstado;
import com.medicalerp.agenda.entity.Agenda;
import com.medicalerp.agenda.entity.Bloqueo;
import com.medicalerp.agenda.entity.Disponibilidad;
import com.medicalerp.cita.entity.Cita;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Motor de cálculo de disponibilidad para slots de Agenda.
 * Entrada → Cálculo → Salida (motor puro, sin persistencia)
 */
@Component
@RequiredArgsConstructor
public class AvailabilityEngine {

    /**
     * Calcula slots disponibles para una fecha específica.
     */
    public List<SlotDisponibilidad> calcularSlots(
            Agenda agenda,
            List<Disponibilidad> disponibilidades,
            List<Bloqueo> bloqueos,
            List<Cita> citasExistentes,
            LocalDate fecha,
            Integer duracionSesion) {
        return calcularSlots(agenda, disponibilidades, bloqueos, citasExistentes, fecha, duracionSesion, false);
    }

    /**
     * Calcula slots disponibles para una fecha específica, con opción de filtrar solo DISPONIBLE.
     */
    public List<SlotDisponibilidad> calcularSlots(
            Agenda agenda,
            List<Disponibilidad> disponibilidades,
            List<Bloqueo> bloqueos,
            List<Cita> citasExistentes,
            LocalDate fecha,
            Integer duracionSesion,
            boolean soloDisponibles) {

        List<SlotDisponibilidad> slots = new ArrayList<>();

        for (Disponibilidad disp : disponibilidades) {
            LocalTime cursor = disp.getHoraInicio();
            LocalTime finDisponibilidad = disp.getHoraFin();

            while (!cursor.plusMinutes(duracionSesion).isAfter(finDisponibilidad)) {
                LocalTime slotFin = cursor.plusMinutes(duracionSesion);
                LocalDateTime slotInicioDateTime = fecha.atTime(cursor);
                LocalDateTime slotFinDateTime = fecha.atTime(slotFin);

                SlotInfo info = calcularEstado(
                        slotInicioDateTime, slotFinDateTime,
                        bloqueos, citasExistentes, duracionSesion);

                if (!soloDisponibles || SlotEstado.DISPONIBLE.equals(info.estado)) {
                    slots.add(SlotDisponibilidad.builder()
                            .fecha(fecha)
                            .inicio(cursor)
                            .fin(slotFin)
                            .estado(info.estado)
                            .descripcion(info.descripcion)
                            .duracionDisponible(duracionSesion)
                            .build());
                }

                cursor = cursor.plusMinutes(duracionSesion);
            }
        }

        return slots;
    }

    /**
     * Calcula slots disponibles para una semana completa.
     */
    public List<SlotDisponibilidad> calcularSlotsSemana(
            Agenda agenda,
            List<Disponibilidad> disponibilidades,
            List<Bloqueo> bloqueos,
            List<Cita> citasExistentes,
            LocalDate inicioSemana,
            LocalDate finSemana,
            Integer duracionSesion) {
        return calcularSlotsSemana(agenda, disponibilidades, bloqueos, citasExistentes, inicioSemana, finSemana, duracionSesion, false);
    }

    /**
     * Calcula slots disponibles para una semana completa, con opción de filtrar solo DISPONIBLE.
     */
    public List<SlotDisponibilidad> calcularSlotsSemana(
            Agenda agenda,
            List<Disponibilidad> disponibilidades,
            List<Bloqueo> bloqueos,
            List<Cita> citasExistentes,
            LocalDate inicioSemana,
            LocalDate finSemana,
            Integer duracionSesion,
            boolean soloDisponibles) {

        List<SlotDisponibilidad> todosLosSlots = new ArrayList<>();
        LocalDate fecha = inicioSemana;

        while (!fecha.isAfter(finSemana)) {
            int diaSemana = fecha.getDayOfWeek().getValue() % 7;
            List<Disponibilidad> dispDia = disponibilidades.stream()
                    .filter(d -> d.getDiaSemana() == diaSemana)
                    .toList();

            if (!dispDia.isEmpty()) {
                List<SlotDisponibilidad> slots = calcularSlots(
                        agenda, dispDia, bloqueos, citasExistentes, fecha, duracionSesion, soloDisponibles);
                todosLosSlots.addAll(slots);
            }

            fecha = fecha.plusDays(1);
        }

        return todosLosSlots;
    }

    /**
     * Encuentra el primer slot disponible a partir de una fecha/hora.
     */
    public SlotDisponibilidad encontrarPrimerSlot(
            Agenda agenda,
            List<Disponibilidad> disponibilidades,
            List<Bloqueo> bloqueos,
            List<Cita> citasExistentes,
            LocalDate fechaInicio,
            Integer duracionSesion,
            int diasMaximos) {

        LocalDate fecha = fechaInicio;
        for (int i = 0; i < diasMaximos; i++) {
            int diaSemana = fecha.getDayOfWeek().getValue() % 7;
            List<Disponibilidad> dispDia = disponibilidades.stream()
                    .filter(d -> d.getDiaSemana() == diaSemana)
                    .toList();

            if (!dispDia.isEmpty()) {
                List<SlotDisponibilidad> slots = calcularSlots(
                        agenda, dispDia, bloqueos, citasExistentes, fecha, duracionSesion);

                for (SlotDisponibilidad slot : slots) {
                    if (SlotEstado.DISPONIBLE.equals(slot.getEstado())) {
                        return slot;
                    }
                }
            }

            fecha = fecha.plusDays(1);
        }

        return null;
    }

    /**
     * Calcula el estado de un slot basado en bloqueos y citas existentes.
     */
    private SlotInfo calcularEstado(
            LocalDateTime inicio,
            LocalDateTime fin,
            List<Bloqueo> bloqueos,
            List<Cita> citasExistentes,
            Integer duracionSesion) {

        // Check Bloqueos
        for (Bloqueo bloqueo : bloqueos) {
            if (inicio.isBefore(bloqueo.getFechaFin()) && fin.isAfter(bloqueo.getFechaInicio())) {
                String motivo = bloqueo.getMotivo() != null ? bloqueo.getMotivo() : "Horario bloqueado";
                return new SlotInfo(SlotEstado.BLOQUEADO, motivo);
            }
        }

        // Check Citas existentes
        for (Cita cita : citasExistentes) {
            LocalDateTime citaInicio = cita.getFecha().atTime(cita.getHora());
            LocalDateTime citaFin = citaInicio.plusMinutes(cita.getDuracionMinutos());
            if (inicio.isBefore(citaFin) && fin.isAfter(citaInicio)) {
                String paciente = cita.getPaciente() != null
                        ? cita.getPaciente().getNombres() + " " + cita.getPaciente().getApellidoPaterno()
                        : "Ocupado";
                return new SlotInfo(SlotEstado.OCUPADO, "Paciente " + paciente);
            }
        }

        // Check Buffer (15 min antes de cada cita)
        for (Cita cita : citasExistentes) {
            LocalDateTime bufferInicio = cita.getFecha().atTime(cita.getHora()).minusMinutes(15);
            LocalDateTime bufferFin = cita.getFecha().atTime(cita.getHora());
            if (inicio.isBefore(bufferFin) && fin.isAfter(bufferInicio)) {
                return new SlotInfo(SlotEstado.EN_BUFFER, "Preparación antes de cita");
            }
        }

        return new SlotInfo(SlotEstado.DISPONIBLE, null);
    }

    /**
     * Clase interna para retornar estado + descripción
     */
    private static class SlotInfo {
        final SlotEstado estado;
        final String descripcion;

        SlotInfo(SlotEstado estado, String descripcion) {
            this.estado = estado;
            this.descripcion = descripcion;
        }
    }

}
