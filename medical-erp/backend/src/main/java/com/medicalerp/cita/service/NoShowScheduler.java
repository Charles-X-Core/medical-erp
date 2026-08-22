package com.medicalerp.cita.service;

import com.medicalerp.cita.entity.Cita;
import com.medicalerp.cita.repository.CitaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class NoShowScheduler {

    private final CitaRepository citaRepository;

    private static final List<String> ESTADOS_NO_SHOW = List.of(
            "solicitada", "pendiente", "programada", "confirmada", "asistio", "llegada"
    );

    /**
     * Every 5 minutes, mark citations from today as no_show if:
     * 1. They are in an active state (not started, not cancelled, not completed)
     * 2. Their scheduled time + duration + 30min buffer has passed
     */
    @Scheduled(fixedRate = 300000)
    @Transactional
    public void marcarNoShows() {
        LocalDate today = LocalDate.now();
        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(30);

        List<Cita> pasadas = citaRepository.findPasadasSinAccion(today, cutoff);

        for (Cita cita : pasadas) {
            try {
                cita.setEstado("no_show");
                citaRepository.save(cita);
                log.info("Auto-marked no_show: cita {} ({}) at {}",
                        cita.getId(),
                        cita.getPaciente().getNombreCompleto(),
                        cita.getHora());
            } catch (Exception e) {
                log.error("Error marking no_show for cita {}: {}", cita.getId(), e.getMessage());
            }
        }

        if (!pasadas.isEmpty()) {
            log.info("NoShow scheduler: marked {} citations as no_show", pasadas.size());
        }
    }
}
