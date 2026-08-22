package com.medicalerp.cita.service;

import com.medicalerp.cita.entity.Cita;
import com.medicalerp.cita.repository.CitaRepository;
import com.medicalerp.notificacion.dto.NotificacionRequest;
import com.medicalerp.notificacion.service.NotificacionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class NoShowScheduler {

    private final CitaRepository citaRepository;
    private final NotificacionService notificacionService;

    /** Estados que pueden marcar no_show: paciente no llegó ni fue atendido */
    private static final List<String> ESTADOS_NO_SHOW = List.of(
            "solicitada", "pendiente", "programada", "confirmada"
    );

    private static final int BUFFER_MINUTES = 30;

    /**
     * Every 5 minutes, mark citations from today as no_show if:
     * 1. They are in an active state (not started, not cancelled, not completed)
     * 2. Their scheduled time + duration + 30min buffer has passed
     *
     * Note: 'asistio' and 'llegada' are excluded — the patient arrived,
     * so this is NOT a no-show even if the doctor hasn't started yet.
     */
    @Scheduled(fixedRate = 300000)
    @Transactional
    public void marcarNoShows() {
        LocalDate today = LocalDate.now();
        LocalDateTime now = LocalDateTime.now();

        // Get all active citas for today
        List<Cita> activas = citaRepository.findActivasByFecha(today, ESTADOS_NO_SHOW);

        int marked = 0;
        for (Cita cita : activas) {
            if (cita.getFechaHora() == null || cita.getHora() == null) continue;

            // Correct cutoff: start time + duration + buffer
            int duracion = cita.getDuracionMinutos() != null ? cita.getDuracionMinutos() : 30;
            LocalDateTime finCita = cita.getFechaHora().plusMinutes(duracion);
            LocalDateTime cutoff = finCita.plusMinutes(BUFFER_MINUTES);

            if (now.isAfter(cutoff)) {
                try {
                    cita.setEstado("no_show");
                    citaRepository.save(cita);

                    // Send in-app notification to assigned doctor
                    if (cita.getUsuario() != null) {
                        try {
                            NotificacionRequest notif = NotificacionRequest.builder()
                                    .usuarioDestinoId(cita.getUsuario().getId())
                                    .tipo("NO_SHOW")
                                    .titulo("Paciente no asistió")
                                    .mensaje(String.format("%s no asistió a su cita de las %s",
                                            cita.getPaciente().getNombreCompleto(),
                                            cita.getHora().toString().substring(0, 5)))
                                    .referenciaTipo("CITA")
                                    .referenciaId(cita.getId())
                                    .build();
                            notificacionService.crear(notif);
                        } catch (Exception e) {
                            log.error("Error sending no-show notification for cita {}: {}", cita.getId(), e.getMessage());
                        }
                    }

                    log.info("Auto-marked no_show: cita {} ({}) a las {} (fin: {}, cutoff: {}, now: {})",
                            cita.getId(),
                            cita.getPaciente().getNombreCompleto(),
                            cita.getHora(),
                            finCita.toLocalTime(),
                            cutoff.toLocalTime(),
                            now.toLocalTime());
                    marked++;
                } catch (Exception e) {
                    log.error("Error marking no_show for cita {}: {}", cita.getId(), e.getMessage());
                }
            }
        }

        if (marked > 0) {
            log.info("NoShow scheduler: marked {} citations as no_show", marked);
        }
    }
}
