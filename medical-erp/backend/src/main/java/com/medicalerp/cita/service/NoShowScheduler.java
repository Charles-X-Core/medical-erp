package com.medicalerp.cita.service;

import com.medicalerp.cita.entity.Cita;
import com.medicalerp.cita.repository.CitaRepository;
import com.medicalerp.common.util.BusinessTime;
import com.medicalerp.notificacion.dto.NotificacionRequest;
import com.medicalerp.notificacion.service.NotificacionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class NoShowScheduler {

    private final CitaRepository citaRepository;
    private final NotificacionService notificacionService;

    /** Estados que pueden marcar no_show: la doctora no confirmó e inició la atención a tiempo */
    private static final List<String> ESTADOS_NO_SHOW = List.of(
            "solicitada", "pendiente", "programada", "confirmada", "asistio", "llegada"
    );

    /**
     * Every 5 minutes, mark citations from today as no_show if:
     * 1. They are in an active state (not started, not cancelled, not completed)
     * 2. Their start time (fechaHora) + duration + 40% margin has passed
     *    and the doctor did NOT start attention (no 'en_atencion' + inicioAtencion).
     *
     * The 40% margin is counted from the START time, not the end, so a late patient
     * still has a window to be attended before the citation is locked.
     */
    @Scheduled(fixedRate = 300000)
    @Transactional
    public void marcarNoShows() {
        LocalDate today = LocalDate.now(BusinessTime.ZONE);
        Instant now = Instant.now();

        // Get all active citas for today
        LocalDateTime inicio = today.atStartOfDay();
        LocalDateTime fin = today.plusDays(1).atStartOfDay();
        List<Cita> activas = citaRepository.findActivasByRangoFecha(inicio, fin, ESTADOS_NO_SHOW);

        int marked = 0;
        for (Cita cita : activas) {
            if (cita.getFechaHora() == null || cita.getHora() == null) continue;

            // Ventana desde la HORA DE INICIO: fechaHora + duracion + 40% de la duracion
            int duracion = cita.getDuracionMinutos() != null ? cita.getDuracionMinutos() : 30;
            int margen = (int) Math.round(duracion * 0.4);
            Instant cutoff = BusinessTime.toInstant(cita.getFechaHora().plusMinutes(duracion + margen));

            if (now.isAfter(cutoff)) {
                try {
                    cita.setEstado("no_show");
                    citaRepository.save(cita);

                    // Send in-app notification to assigned doctor
                    // Using crearSistema() instead of crear() because the scheduler runs
                    // without an authenticated user. crearSistema() runs in a separate
                    // transaction (REQUIRES_NEW) so notification failures don't roll back
                    // the no_show status change.
                    if (cita.getUsuario() != null) {
                        try {
                            NotificacionRequest notif = NotificacionRequest.builder()
                                    .tipo("NO_SHOW")
                                    .titulo("Paciente no asistió")
                                    .mensaje(String.format("%s no asistió a su cita de las %s",
                                            cita.getPaciente().getNombreCompleto(),
                                            cita.getHora().toString().substring(0, 5)))
                                    .referenciaTipo("CITA")
                                    .referenciaId(cita.getId())
                                    .build();
                            notificacionService.crearSistema(cita.getUsuario().getId(), notif);
                        } catch (Exception e) {
                            log.error("Error sending no-show notification for cita {}: {}", cita.getId(), e.getMessage());
                        }
                    }

                    log.info("Auto-marked no_show: cita {} ({}) a las {} (cutoff: {}, now: {})",
                            cita.getId(),
                            cita.getPaciente().getNombreCompleto(),
                            cita.getHora(),
                            BusinessTime.toLocalDateTime(cutoff).toLocalTime(),
                            BusinessTime.toLocalDateTime(now).toLocalTime());
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
