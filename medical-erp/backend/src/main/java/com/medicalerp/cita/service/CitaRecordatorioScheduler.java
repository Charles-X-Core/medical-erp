package com.medicalerp.cita.service;

import com.medicalerp.cita.entity.Cita;
import com.medicalerp.cita.repository.CitaRepository;
import com.medicalerp.common.util.BusinessTime;
import com.medicalerp.contacto.service.EmailService;
import com.medicalerp.notificacion.dto.NotificacionRequest;
import com.medicalerp.notificacion.service.NotificacionService;
import com.medicalerp.paciente.entity.Paciente;
import com.medicalerp.seguridad.entity.Usuario;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Envía recordatorio de cita 1 hora y 30 minutos antes del horario de la cita,
 * tanto por email (paciente y doctora) como por notificación in-app al doctor,
 * y un aviso al paciente para confirmar su asistencia.
 *
 * Solo envía una vez por cita por umbral (60min / 30min) por instancia en ejecución,
 * y únicamente para citas del día de hoy que no estén canceladas/completadas.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class CitaRecordatorioScheduler {

    private final CitaRepository citaRepository;
    private final EmailService emailService;
    private final NotificacionService notificacionService;

    /** Claves "citaId:umbral" a las que ya se les envió recordatorio (protección en memoria). */
    private final Set<String> notificadas = ConcurrentHashMap.newKeySet();

    /**
     * Cada minuto, revisa las citas activas de hoy y envía recordatorio según el
     * tiempo restante (60 y 30 minutos antes).
     */
    @Scheduled(fixedRate = 60000)
    public void enviarRecordatorios() {
        try {
            LocalDate today = LocalDate.now(BusinessTime.ZONE);
            Instant now = Instant.now();

            List<Cita> citas = citaRepository.findActivasByRangoFecha(
                    today.atStartOfDay(), today.plusDays(1).atStartOfDay());
            int enviados = 0;

            for (Cita cita : citas) {
                if (cita.getFechaHora() == null || cita.getFechaHora().isBefore(BusinessTime.toLocalDateTime(now))) continue;

                long minutosFaltan = Duration.between(now, BusinessTime.toInstant(cita.getFechaHora())).toMinutes();
                Paciente paciente = cita.getPaciente();
                Usuario doctora = cita.getUsuario();
                if (paciente == null) continue;

                // Umbral 60 minutos
                if (minutosFaltan <= 60 && minutosFaltan > 30 && notificadas.add(cita.getId() + ":60")) {
                    enviarRecordatorioEnvio(cita, paciente, doctora, 60, minutosFaltan, now);
                    enviados++;
                }
                // Umbral 30 minutos (se repite el aviso, más cercano)
                else if (minutosFaltan <= 30 && minutosFaltan > 0 && notificadas.add(cita.getId() + ":30")) {
                    enviarRecordatorioEnvio(cita, paciente, doctora, 30, minutosFaltan, now);
                    enviados++;
                }
            }

            if (enviados > 0) {
                log.info("CitaRecordatorioScheduler envió {} recordatorio(s)", enviados);
            }
        } catch (Exception e) {
            log.error("Error en CitaRecordatorioScheduler: {}", e.getMessage());
        }
    }

    private void enviarRecordatorioEnvio(Cita cita, Paciente paciente, Usuario doctora,
                                         int umbral, long minutosFaltan, Instant now) {
        try {
            String fecha = cita.getFechaHora().toLocalDate().toString();
            String hora = cita.getFechaHora().toLocalTime().toString().substring(0, 5);
            String pacienteNombre = paciente.getNombreCompleto();
            String doctoraNombre = doctora != null ? doctora.getNombre() : "Doctora";
            String tipoCitaNombre = cita.getTipoCita() != null ? cita.getTipoCita().getNombre()
                    : (cita.getMotivo() != null ? cita.getMotivo() : "Consulta");

            // Recordatorio por email al paciente
            if (paciente.getEmail() != null && !paciente.getEmail().isBlank()) {
                emailService.sendRecordatorioCita(
                        paciente.getEmail(), pacienteNombre, fecha, hora, doctoraNombre, tipoCitaNombre);
            }

            // Recordatorio por email a la doctora
            if (doctora != null && doctora.getEmail() != null && !doctora.getEmail().isBlank()) {
                emailService.sendRecordatorioCitaDoctora(
                        doctora.getEmail(), doctoraNombre, pacienteNombre, fecha, hora, tipoCitaNombre);
            }

            // Notificación in-app al doctor
            if (doctora != null) {
                notificacionService.crearSistema(doctora.getId(), NotificacionRequest.builder()
                        .usuarioDestinoId(doctora.getId())
                        .tipo("RECORDATORIO_CITA")
                        .titulo("Cita en " + umbral + " min - " + doctoraNombre)
                        .mensaje(String.format("%s tiene una cita en ~%d min (%s a las %s - %s)",
                                pacienteNombre, minutosFaltan, fecha, hora, tipoCitaNombre))
                        .referenciaTipo("CITA")
                        .referenciaId(cita.getId())
                        .build());
            }

            log.info("Recordatorio {} min enviado para cita {} ({} a las {})", umbral, cita.getId(), pacienteNombre, hora);
        } catch (Exception e) {
            log.error("Error enviando recordatorio {} min para cita {}: {}", umbral, cita.getId(), e.getMessage());
        }
    }
}
