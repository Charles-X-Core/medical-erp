package com.medicalerp.cita.service;

import com.medicalerp.agenda.entity.Agenda;
import com.medicalerp.agenda.entity.Bloqueo;
import com.medicalerp.agenda.entity.Disponibilidad;
import com.medicalerp.agenda.entity.TipoCita;
import com.medicalerp.agenda.repository.AgendaRepository;
import com.medicalerp.agenda.repository.BloqueoRepository;
import com.medicalerp.agenda.repository.DisponibilidadRepository;
import com.medicalerp.agenda.repository.TipoCitaRepository;
import com.medicalerp.common.exception.BusinessRuleException;
import com.medicalerp.common.exception.ResourceNotFoundException;
import com.medicalerp.common.util.Auditable;
import com.medicalerp.common.util.SecurityUtils;
import com.medicalerp.contacto.service.EmailService;
import com.medicalerp.cita.dto.CitaRequest;
import com.medicalerp.cita.dto.CitaResponse;
import com.medicalerp.cita.entity.Cita;
import com.medicalerp.cita.mapper.CitaMapper;
import com.medicalerp.cita.repository.CitaRepository;
import com.medicalerp.notificacion.dto.NotificacionRequest;
import com.medicalerp.notificacion.service.NotificacionService;
import com.medicalerp.paciente.entity.Paciente;
import com.medicalerp.paciente.repository.PacienteRepository;
import com.medicalerp.seguridad.entity.Usuario;
import com.medicalerp.seguridad.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Arrays;
import java.util.List;

/**
 * Cita Service (DOM-CIT-001)
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CitaService {

    private final CitaRepository citaRepository;
    private final PacienteRepository pacienteRepository;
    private final UsuarioRepository usuarioRepository;
    private final AgendaRepository agendaRepository;
    private final DisponibilidadRepository disponibilidadRepository;
    private final BloqueoRepository bloqueoRepository;
    private final TipoCitaRepository tipoCitaRepository;
    private final CitaMapper citaMapper;
    private final EmailService emailService;
    private final NotificacionService notificacionService;
    private final SecurityUtils securityUtils;

    private static final List<String> ESTADOS_FINALES = Arrays.asList("cancelada", "completada");
    private static final List<String> ESTADOS_MODIFICABLES = Arrays.asList("pendiente", "confirmada", "asistio", "solicitada");
    private static final List<String> ESTADOS_ACTIVOS = Arrays.asList("solicitada", "pendiente", "confirmada", "asistio");

    @Transactional
    @Auditable
    public CitaResponse create(CitaRequest request) {
        validateFechaNoPasada(request.getFecha(), request.getHora());

        Paciente paciente = pacienteRepository.findById(request.getPacienteId())
                .orElseThrow(() -> new ResourceNotFoundException("Paciente", request.getPacienteId()));

        Usuario usuario = null;
        if (request.getUsuarioId() != null) {
            usuario = usuarioRepository.findById(request.getUsuarioId())
                    .orElseThrow(() -> new ResourceNotFoundException("Usuario", request.getUsuarioId()));
        }

        Integer duracion = request.getDuracionMinutos() != null ? request.getDuracionMinutos() : 30;

        // Validate Agenda availability if usuario assigned
        if (usuario != null) {
            validarDisponibilidad(usuario.getId(), request.getFecha(), request.getHora(), duracion);
        }

        Cita cita = citaMapper.toEntity(request);
        cita.setPaciente(paciente);
        cita.setUsuario(usuario);
        cita.setDuracionMinutos(duracion);
        cita.setEstado("pendiente");

        // MapStruct ignores fechaHora (no matching field in CitaRequest), so set it manually
        if (request.getFecha() != null && request.getHora() != null) {
            cita.setFechaHora(request.getFecha().atTime(request.getHora()));
        } else if (request.getFecha() != null) {
            cita.setFechaHora(request.getFecha().atStartOfDay());
        }

        // Set prioridad from TipoCita default if not provided
        if (cita.getPrioridad() == null && request.getTipoCitaId() != null) {
            TipoCita tipoCita = tipoCitaRepository.findById(request.getTipoCitaId()).orElse(null);
            if (tipoCita != null) {
                cita.setPrioridad(tipoCita.getPrioridadDefault());
            }
        }

        // Ensure prioridad has a default value (DB column is NOT NULL)
        if (cita.getPrioridad() == null) {
            cita.setPrioridad("NORMAL");
        }

        // Validate requiereTratamiento
        if (request.getTipoCitaId() != null) {
            TipoCita tipoCita = tipoCitaRepository.findById(request.getTipoCitaId()).orElse(null);
            if (tipoCita != null && Boolean.TRUE.equals(tipoCita.getRequiereTratamiento())) {
                if (request.getTratamientoId() == null) {
                    throw new BusinessRuleException("BR-CIT-006",
                            "Este tipo de cita requiere un tratamiento activo vinculado");
                }
            }
        }

        Cita saved = citaRepository.save(cita);

        // Send notifications (async, don't block the response)
        try {
            notifyCitaCreated(saved, paciente, usuario);
        } catch (Exception e) {
            log.error("Error sending cita notifications: {}", e.getMessage());
        }

        return citaMapper.toResponse(saved);
    }

    @Transactional
    @Auditable
    public CitaResponse createSolicitada(CitaRequest request) {
        if (request.getHora() != null) {
            validateFechaNoPasada(request.getFecha(), request.getHora());
        }

        Paciente paciente = pacienteRepository.findById(request.getPacienteId())
                .orElseThrow(() -> new ResourceNotFoundException("Paciente", request.getPacienteId()));

        Usuario usuario = null;
        if (request.getUsuarioId() != null) {
            usuario = usuarioRepository.findById(request.getUsuarioId())
                    .orElseThrow(() -> new ResourceNotFoundException("Usuario", request.getUsuarioId()));
        }

        Integer duracion = request.getDuracionMinutos() != null ? request.getDuracionMinutos() : 30;

        // Only validate availability if hora is provided (nurse will assign hora later)
        if (usuario != null && request.getHora() != null) {
            validarDisponibilidad(usuario.getId(), request.getFecha(), request.getHora(), duracion);
        }

        Cita cita = citaMapper.toEntity(request);
        cita.setPaciente(paciente);
        cita.setUsuario(usuario);
        cita.setDuracionMinutos(duracion);
        cita.setEstado("solicitada");

        // Set solicitadaPor from current user (the doctora)
        Long currentUserId = securityUtils.getCurrentUserId();
        if (currentUserId != null) {
            Usuario solicitante = usuarioRepository.findById(currentUserId).orElse(null);
            cita.setSolicitadaPor(solicitante);
        }

        if (request.getFecha() != null && request.getHora() != null) {
            cita.setFechaHora(request.getFecha().atTime(request.getHora()));
        } else if (request.getFecha() != null) {
            cita.setFechaHora(request.getFecha().atStartOfDay());
        }

        if (cita.getPrioridad() == null && request.getTipoCitaId() != null) {
            TipoCita tipoCita = tipoCitaRepository.findById(request.getTipoCitaId()).orElse(null);
            if (tipoCita != null) {
                cita.setPrioridad(tipoCita.getPrioridadDefault());
            }
        }

        if (cita.getPrioridad() == null) {
            cita.setPrioridad("NORMAL");
        }

        Cita saved = citaRepository.save(cita);

        try {
            notifySolicitadaCreated(saved, paciente, usuario);
        } catch (Exception e) {
            log.error("Error sending solicitud notifications: {}", e.getMessage());
        }

        return citaMapper.toResponse(saved);
    }

    public CitaResponse getById(Long id) {
        Cita cita = citaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cita", id));
        return citaMapper.toResponse(cita);
    }

    public Page<CitaResponse> getAll(LocalDate fecha, String estado, Long usuarioId, Pageable pageable) {
        if (usuarioId != null) {
            return citaRepository.findByUsuarioId(usuarioId, pageable).map(citaMapper::toResponse);
        }
        if (fecha != null && estado != null) {
            return citaRepository.findByFecha(fecha, pageable).map(citaMapper::toResponse);
        }
        if (fecha != null) {
            return citaRepository.findByFecha(fecha, pageable).map(citaMapper::toResponse);
        }
        if (estado != null) {
            return citaRepository.findByEstado(estado, pageable).map(citaMapper::toResponse);
        }
        return citaRepository.findAll(pageable).map(citaMapper::toResponse);
    }

    public List<CitaResponse> getHoy() {
        return citaRepository.findByFechaAndEstadoNot(LocalDate.now(), "cancelada")
                .stream()
                .map(citaMapper::toResponse)
                .toList();
    }

    public List<CitaResponse> getProximas() {
        return citaRepository.findProximas(LocalDateTime.now())
                .stream()
                .map(citaMapper::toResponse)
                .toList();
    }

    public List<CitaResponse> getByPacienteId(Long pacienteId) {
        return citaRepository.findByPacienteId(pacienteId, Pageable.unpaged())
                .getContent()
                .stream()
                .map(citaMapper::toResponse)
                .toList();
    }

    @Transactional
    @Auditable
    public CitaResponse confirmar(Long id) {
        Cita cita = citaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cita", id));

        if (!"pendiente".equals(cita.getEstado()) && !"solicitada".equals(cita.getEstado())) {
            throw new BusinessRuleException("BR-CIT-001", "No se puede confirmar una cita que no esté pendiente o solicitada");
        }

        cita.setEstado("confirmada");
        Cita saved = citaRepository.save(cita);
        return citaMapper.toResponse(saved);
    }

    @Transactional
    @Auditable
    public CitaResponse programar(Long id) {
        Cita cita = citaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cita", id));

        if (!"solicitada".equals(cita.getEstado())) {
            throw new BusinessRuleException("BR-CIT-007", "Solo se pueden programar citas en estado solicitada");
        }

        cita.setEstado("programada");
        Cita saved = citaRepository.save(cita);

        // Notify the doctora that her request was confirmed
        try {
            if (cita.getSolicitadaPor() != null) {
                NotificacionRequest notif = NotificacionRequest.builder()
                        .usuarioDestinoId(cita.getSolicitadaPor().getId())
                        .tipo("SOLICITUD_CONFIRMADA")
                        .titulo("Solicitud de cita confirmada")
                        .mensaje("Tu solicitud de cita con " + cita.getPaciente().getNombreCompleto()
                                + " para el " + cita.getFecha() + " ha sido confirmada")
                        .referenciaTipo("CITA")
                        .referenciaId(cita.getId())
                        .build();
                notificacionService.crear(notif);
            }
        } catch (Exception e) {
            log.error("Error sending programada notification: {}", e.getMessage());
        }

        return citaMapper.toResponse(saved);
    }

    @Transactional
    @Auditable
    public CitaResponse rechazar(Long id, String motivo) {
        Cita cita = citaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cita", id));

        if (!"solicitada".equals(cita.getEstado())) {
            throw new BusinessRuleException("BR-CIT-008", "Solo se pueden rechazar citas en estado solicitada");
        }

        cita.setEstado("cancelada");
        cita.setCanceladoAt(LocalDateTime.now());
        cita.setCanceladoMotivo(motivo != null ? motivo : "Solicitud rechazada");
        Cita saved = citaRepository.save(cita);

        // Notify the doctora that her request was rejected
        try {
            if (cita.getSolicitadaPor() != null) {
                NotificacionRequest notif = NotificacionRequest.builder()
                        .usuarioDestinoId(cita.getSolicitadaPor().getId())
                        .tipo("SOLICITUD_RECHAZADA")
                        .titulo("Solicitud de cita rechazada")
                        .mensaje("Tu solicitud de cita con " + cita.getPaciente().getNombreCompleto()
                                + " para el " + cita.getFecha() + " fue rechazada"
                                + (motivo != null ? ". Motivo: " + motivo : ""))
                        .referenciaTipo("CITA")
                        .referenciaId(cita.getId())
                        .build();
                notificacionService.crear(notif);
            }
        } catch (Exception e) {
            log.error("Error sending rechazo notification: {}", e.getMessage());
        }

        return citaMapper.toResponse(saved);
    }

    public List<CitaResponse> getSolicitadasPendientes() {
        return citaRepository.findByEstado("solicitada", Pageable.unpaged())
                .getContent()
                .stream()
                .map(citaMapper::toResponse)
                .toList();
    }

    /**
     * Verifica si extender una cita afecta a la siguiente cita del mismo doctor.
     */
    public java.util.Map<String, Object> verificarExtension(Long citaId, Integer nuevaDuracion) {
        Cita cita = citaRepository.findById(citaId)
                .orElseThrow(() -> new ResourceNotFoundException("Cita", citaId));

        if (cita.getUsuario() == null) {
            return java.util.Map.of("conflicto", false, "citasAfectadas", java.util.List.of());
        }

        LocalDateTime finActual = cita.getFechaHora().plusMinutes(cita.getDuracionMinutos());
        LocalDateTime finNuevo = cita.getFechaHora().plusMinutes(nuevaDuracion);

        // Find the next cita after this one for the same doctor
        List<Cita> siguientes = citaRepository.findActivasByUsuarioAndFecha(
                cita.getUsuario().getId(), cita.getFecha())
                .stream()
                .filter(c -> !c.getId().equals(citaId))
                .filter(c -> c.getHora().isAfter(cita.getHora()))
                .sorted(java.util.Comparator.comparing(Cita::getHora))
                .toList();

        java.util.List<java.util.Map<String, Object>> afectadas = new java.util.ArrayList<>();
        for (Cita siguiente : siguientes) {
            LocalDateTime inicioSiguiente = siguiente.getFechaHora();
            if (finNuevo.isAfter(inicioSiguiente)) {
                java.util.Map<String, Object> info = new java.util.HashMap<>();
                info.put("citaId", siguiente.getId());
                info.put("pacienteNombre", siguiente.getPaciente().getNombreCompleto());
                info.put("horaInicio", siguiente.getHora().toString().substring(0, 5));
                info.put("horaFin", siguiente.getHora().plusMinutes(siguiente.getDuracionMinutos()).toString().substring(0, 5));
                info.put("duracionMinutos", siguiente.getDuracionMinutos());
                afectadas.add(info);
                break; // Only report the first conflict
            }
        }

        java.util.Map<String, Object> result = new java.util.HashMap<>();
        result.put("conflicto", !afectadas.isEmpty());
        result.put("citasAfectadas", afectadas);
        result.put("nuevaDuracion", nuevaDuracion);
        result.put("finAnterior", finActual.toString().substring(0, 5));
        result.put("finNuevo", finNuevo.toString().substring(0, 5));
        return result;
    }

    @Transactional
    @Auditable
    public CitaResponse registrarAsistencia(Long id) {
        Cita cita = citaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cita", id));

        if (!"confirmada".equals(cita.getEstado())) {
            throw new BusinessRuleException("BR-CIT-002", "No se puede registrar asistencia en cita no confirmada");
        }

        cita.setEstado("asistio");
        cita.setAsistioConfirmedAt(LocalDateTime.now());
        Cita saved = citaRepository.save(cita);
        return citaMapper.toResponse(saved);
    }

    @Transactional
    @Auditable
    public CitaResponse completar(Long id, Long consultaId) {
        if (consultaId == null) {
            throw new BusinessRuleException("INV-CIT-005", "Una cita completada requiere una consulta vinculada");
        }

        Cita cita = citaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cita", id));

        if (!"asistio".equals(cita.getEstado())) {
            throw new BusinessRuleException("BR-CIT-003", "No se puede completar una cita que no esté asistida");
        }

        cita.setEstado("completada");
        cita.setConsultaId(consultaId);
        Cita saved = citaRepository.save(cita);
        return citaMapper.toResponse(saved);
    }

    @Transactional
    @Auditable
    public CitaResponse cancelar(Long id, String motivo) {
        Cita cita = citaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cita", id));

        if ("completada".equals(cita.getEstado())) {
            throw new BusinessRuleException("INVALID_STATE", "No se puede cancelar una cita completada");
        }

        if (cita.getFecha().isBefore(LocalDate.now()) ||
                (cita.getFecha().isEqual(LocalDate.now()) && cita.getHora().isBefore(LocalTime.now()))) {
            throw new BusinessRuleException("PAST_APPOINTMENT", "No se puede cancelar una cita pasada");
        }

        cita.setEstado("cancelada");
        cita.setCanceladoAt(LocalDateTime.now());
        cita.setCanceladoMotivo(motivo);
        Cita saved = citaRepository.save(cita);
        return citaMapper.toResponse(saved);
    }

    @Transactional
    @Auditable
    public CitaResponse reprogramar(Long citaId, CitaRequest nuevaCitaRequest) {
        Cita original = citaRepository.findById(citaId)
                .orElseThrow(() -> new ResourceNotFoundException("Cita", citaId));

        if (ESTADOS_FINALES.contains(original.getEstado())) {
            throw new BusinessRuleException("INVALID_STATE", "No se puede reprogramar una cita en estado " + original.getEstado());
        }

        validateFechaNoPasada(nuevaCitaRequest.getFecha(), nuevaCitaRequest.getHora());

        Integer duracion = nuevaCitaRequest.getDuracionMinutos() != null
                ? nuevaCitaRequest.getDuracionMinutos() : original.getDuracionMinutos();

        // Validate availability for new slot
        Long usuarioId = nuevaCitaRequest.getUsuarioId() != null
                ? nuevaCitaRequest.getUsuarioId()
                : (original.getUsuario() != null ? original.getUsuario().getId() : null);

        if (usuarioId != null) {
            validarDisponibilidad(usuarioId, nuevaCitaRequest.getFecha(), nuevaCitaRequest.getHora(), duracion);
        }

        // Mark original as reprogramada
        original.setEstado("reprogramada");
        citaRepository.save(original);

        // Create new cita linked to original
        Paciente paciente = original.getPaciente();
        Usuario usuario = usuarioId != null
                ? usuarioRepository.findById(usuarioId).orElse(null)
                : null;

        Cita nueva = citaMapper.toEntity(nuevaCitaRequest);
        nueva.setPaciente(paciente);
        nueva.setUsuario(usuario);
        nueva.setDuracionMinutos(duracion);
        nueva.setEstado("pendiente");
        nueva.setReprogramadaDe(citaId);

        Cita saved = citaRepository.save(nueva);
        return citaMapper.toResponse(saved);
    }

    @Transactional
    @Auditable
    public CitaResponse update(Long id, CitaRequest request) {
        Cita cita = citaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cita", id));

        if (ESTADOS_FINALES.contains(cita.getEstado())) {
            throw new BusinessRuleException("INVALID_STATE", "No se puede modificar cita en estado " + cita.getEstado());
        }

        validateFechaNoPasada(request.getFecha(), request.getHora());

        Integer duracion = request.getDuracionMinutos() != null ? request.getDuracionMinutos() : cita.getDuracionMinutos();

        // Only validate availability when explicitly reassigning a doctor
        if (request.getUsuarioId() != null) {
            validarDisponibilidad(request.getUsuarioId(), request.getFecha(), request.getHora(), duracion);
        }

        citaMapper.updateEntity(cita, request);
        cita.setDuracionMinutos(duracion);

        if (request.getUsuarioId() != null) {
            Usuario usuario = usuarioRepository.findById(request.getUsuarioId())
                    .orElseThrow(() -> new ResourceNotFoundException("Usuario", request.getUsuarioId()));
            cita.setUsuario(usuario);
        }

        Cita saved = citaRepository.save(cita);
        return citaMapper.toResponse(saved);
    }

    /**
     * Notifica a la doctora y al paciente cuando se crea una cita.
     * Si la enfermera crea la cita → notifica a la doctora por email + notificación interna.
     * Siempre envía email de confirmación al paciente.
     */
    private void notifyCitaCreated(Cita cita, Paciente paciente, Usuario doctora) {
        String fecha = cita.getFecha() != null ? cita.getFecha().toString() : "";
        String hora = cita.getHora() != null ? cita.getHora().toString().substring(0, 5) : "";
        String pacienteNombre = paciente.getNombreCompleto();
        String tipoCitaNombre = cita.getTipoCita() != null ? cita.getTipoCita().getNombre() : "Consulta";
        String motivo = cita.getMotivo() != null ? cita.getMotivo() : "";

        // Current user (could be nurse or doctora)
        Long currentUserId = securityUtils.getCurrentUserId();
        String currentUserName = "Sistema";
        if (currentUserId != null) {
            Usuario current = usuarioRepository.findById(currentUserId).orElse(null);
            if (current != null) {
            currentUserName = current.getNombre();
        }
        }

        // Notify doctora if nurse created the citation
        boolean isNurse = securityUtils.hasRole("ENFERMERA");
        if (isNurse && doctora != null) {
            String doctoraEmail = doctora.getEmail();
            if (doctoraEmail != null) {
                emailService.sendCitaNotificacionDoctora(
                        doctoraEmail, doctora.getNombre(),
                        pacienteNombre, fecha, hora, tipoCitaNombre, motivo, currentUserName);
            }

            // In-app notification
            NotificacionRequest notif = NotificacionRequest.builder()
                    .usuarioDestinoId(doctora.getId())
                    .tipo("CITA_AGENDADA")
                    .titulo("Nueva cita agendada")
                    .mensaje("La enfermera " + currentUserName + " agendó una cita con " + pacienteNombre
                            + " para el " + fecha + " a las " + hora + " (" + tipoCitaNombre + ")")
                    .referenciaTipo("CITA")
                    .referenciaId(cita.getId())
                    .build();
            notificacionService.crear(notif);
        }

        // Email confirmation to patient
        String pacienteEmail = paciente.getEmail();
        if (pacienteEmail != null && doctora != null) {
            emailService.sendCitaConfirmacionPaciente(
                    pacienteEmail, pacienteNombre, fecha, hora,
                    doctora.getNombre(), tipoCitaNombre);
        }
    }

    /**
     * Notifica a la enfermera cuando una doctora solicita una cita.
     * Envía email + notificación in-app a todas las enfermeras activas.
     */
    private void notifySolicitadaCreated(Cita cita, Paciente paciente, Usuario doctora) {
        String fecha = cita.getFecha() != null ? cita.getFecha().toString() : "";
        String hora = cita.getHora() != null ? cita.getHora().toString().substring(0, 5) : "";
        String pacienteNombre = paciente.getNombreCompleto();
        String tipoCitaNombre = cita.getTipoCita() != null ? cita.getTipoCita().getNombre() : "Consulta";
        String doctoraNombre = doctora != null ? doctora.getNombre() : "Doctora";

        // Get all active nurses
        List<Usuario> enfermeras = usuarioRepository.findAll().stream()
                .filter(u -> u.hasRole("ENFERMERA"))
                .toList();

        for (Usuario enfermera : enfermeras) {
            // Email notification
            String email = enfermera.getEmail();
            if (email != null) {
                try {
                    emailService.sendCitaNotificacionDoctora(
                            email, enfermera.getNombre(),
                            pacienteNombre, fecha, hora, tipoCitaNombre,
                            "Solicitud de cita de la " + doctoraNombre, doctoraNombre);
                } catch (Exception e) {
                    log.error("Error sending email to nurse {}: {}", enfermera.getId(), e.getMessage());
                }
            }

            // In-app notification
            try {
                NotificacionRequest notif = NotificacionRequest.builder()
                        .usuarioDestinoId(enfermera.getId())
                        .tipo("SOLICITUD_CITA")
                        .titulo("Nueva solicitud de cita")
                        .mensaje("La " + doctoraNombre + " solicita una cita con " + pacienteNombre
                                + " para el " + fecha + " a las " + hora + " (" + tipoCitaNombre + ")")
                        .referenciaTipo("CITA")
                        .referenciaId(cita.getId())
                        .build();
                notificacionService.crear(notif);
            } catch (Exception e) {
                log.error("Error sending in-app notification to nurse {}: {}", enfermera.getId(), e.getMessage());
            }
        }
    }

    /**
     * Valida disponibilidad completa del doctor:
     * 1. Doctor tiene Agenda
     * 2. Doctor trabaja ese día (Disponibilidad)
     * 3. Horario dentro de la Disponibilidad
     * 4. No hay Bloqueo
     * 5. No hay conflicto con otra Cita
     */
    private void validarDisponibilidad(Long usuarioId, LocalDate fecha, LocalTime hora, Integer duracion) {
        // 1. Check Agenda exists
        Agenda agenda = agendaRepository.findByUsuarioId(usuarioId).orElse(null);
        if (agenda == null) {
            throw new BusinessRuleException("BR-CIT-AG-001",
                    "El profesional no tiene agenda configurada");
        }

        // 2. Check Disponibilidad for day of week
        // Java: Monday=1, Sunday=7. Domain: 0=Sunday, 1=Monday, ..., 6=Saturday
        int diaSemana = fecha.getDayOfWeek().getValue() % 7;
        List<Disponibilidad> disponibilidades = disponibilidadRepository
                .findByAgendaIdAndDiaSemana(agenda.getId(), diaSemana);

        if (disponibilidades.isEmpty()) {
            throw new BusinessRuleException("BR-CIT-AG-002",
                    "El profesional no trabaja el " + diaSemanaToString(diaSemana));
        }

        // 3. Check hora is within Disponibilidad range
        LocalTime horaFin = hora.plusMinutes(duracion);
        boolean dentroDeDisponibilidad = disponibilidades.stream()
                .anyMatch(d -> !hora.isBefore(d.getHoraInicio()) && !horaFin.isAfter(d.getHoraFin()));

        if (!dentroDeDisponibilidad) {
            throw new BusinessRuleException("BR-CIT-AG-003",
                    "Horario fuera de disponibilidad del profesional");
        }

        // 4. Check no Bloqueo overlaps
        LocalDateTime inicio = fecha.atTime(hora);
        LocalDateTime fin = fecha.atTime(horaFin);
        List<Bloqueo> bloqueos = bloqueoRepository.findOverlapping(agenda.getId(), inicio, fin);
        if (!bloqueos.isEmpty()) {
            String motivo = bloqueos.get(0).getMotivo() != null ? bloqueos.get(0).getMotivo() : "Horario bloqueado";
            throw new BusinessRuleException("BR-CIT-AG-004",
                    "Horario bloqueado: " + motivo);
        }

        // 5. Check no Cita conflict
        boolean conflicto = citaRepository.countConflictingCita(
                usuarioId, fecha, hora, horaFin) > 0;
        if (conflicto) {
            throw new BusinessRuleException("APPOINTMENT_CONFLICT",
                    "Horario no disponible para el profesional");
        }
    }

    private void validateFechaNoPasada(LocalDate fecha, LocalTime hora) {
        LocalDateTime fechaHora = fecha.atTime(hora);
        if (fechaHora.isBefore(LocalDateTime.now())) {
            throw new BusinessRuleException("PAST_DATE", "No se pueden agendar citas en el pasado");
        }
    }

    /**
     * Get available time slots for a solicitud starting from fechaMinima.
     * Used by nurse to pick a specific time when programming a solicitud.
     */
    public List<java.util.Map<String, Object>> getDisponibilidadParaSolicitud(Long usuarioId, LocalDate fechaMinima, Integer duracion) {
        List<java.util.Map<String, Object>> result = new java.util.ArrayList<>();
        if (usuarioId == null || fechaMinima == null) return result;

        Integer duracionMin = duracion != null ? duracion : 30;

        // Get agenda for the doctor
        Agenda agenda = agendaRepository.findByUsuarioId(usuarioId).orElse(null);
        if (agenda == null) return result;

        // Get all bloqueos for this agenda
        List<Bloqueo> allBloqueos = bloqueoRepository.findByAgendaId(agenda.getId());

        // Search up to 7 days from fechaMinima
        LocalDate today = LocalDate.now();
        LocalDate searchStart = fechaMinima.isAfter(today) ? fechaMinima : today;

        for (int dayOffset = 0; dayOffset < 7; dayOffset++) {
            LocalDate fecha = searchStart.plusDays(dayOffset);
            int diaSemana = fecha.getDayOfWeek().getValue() % 7; // 0=domingo

            // Get disponibilidades for this day of week
            List<Disponibilidad> disponibilidades = disponibilidadRepository
                    .findByAgendaIdAndDiaSemana(agenda.getId(), diaSemana);

            if (disponibilidades.isEmpty()) continue;

            // Get existing citas for this day (use findByFechaAndEstadoNot, then filter by usuarioId)
            List<Cita> citasDelDia = citaRepository.findByFechaAndEstadoNot(fecha, "cancelada")
                    .stream()
                    .filter(c -> c.getUsuario() != null && c.getUsuario().getId().equals(usuarioId))
                    .toList();

            // Filter bloqueos for this day
            List<Bloqueo> bloqueosDelDia = allBloqueos.stream()
                    .filter(b -> b.getFechaInicio() != null && b.getFechaFin() != null)
                    .filter(b -> {
                        LocalDate bFecha = b.getFechaInicio().toLocalDate();
                        return bFecha.equals(fecha);
                    })
                    .toList();

            // Generate slots for each disponibilidad
            for (Disponibilidad disp : disponibilidades) {
                LocalTime slotInicio = disp.getHoraInicio();
                while (slotInicio.plusMinutes(duracionMin).isBefore(disp.getHoraFin()) ||
                       slotInicio.plusMinutes(duracionMin).equals(disp.getHoraFin())) {

                    final LocalTime slotFin = slotInicio.plusMinutes(duracionMin);
                    final LocalTime slotInicioFinal = slotInicio;

                    // Check if slot conflicts with existing cita
                    boolean ocupado = citasDelDia.stream().anyMatch(c -> {
                        LocalTime cInicio = c.getHora();
                        LocalTime cFin = cInicio != null ? cInicio.plusMinutes(c.getDuracionMinutos()) : null;
                        return cInicio != null && cFin != null &&
                               !slotInicioFinal.isBefore(cFin) && !slotFin.isAfter(cInicio);
                    });

                    // Check if slot conflicts with bloqueo
                    boolean bloqueado = bloqueosDelDia.stream().anyMatch(b -> {
                        LocalTime bInicio = b.getFechaInicio().toLocalTime();
                        LocalTime bFin = b.getFechaFin().toLocalTime();
                        return !slotInicioFinal.isBefore(bFin) && !slotFin.isAfter(bInicio);
                    });

                    String estado = ocupado ? "OCUPADO" : bloqueado ? "BLOQUEADO" : "DISPONIBLE";

                    java.util.Map<String, Object> slot = new java.util.HashMap<>();
                    slot.put("fecha", fecha.toString());
                    slot.put("inicio", slotInicio.toString());
                    slot.put("fin", slotFin.toString());
                    slot.put("estado", estado);
                    result.add(slot);

                    slotInicio = slotInicio.plusMinutes(30); // 30-min increments
                }
            }
        }

        return result;
    }

    private String diaSemanaToString(int diaSemana) {
        return switch (diaSemana) {
            case 0 -> "domingo";
            case 1 -> "lunes";
            case 2 -> "martes";
            case 3 -> "miércoles";
            case 4 -> "jueves";
            case 5 -> "viernes";
            case 6 -> "sábado";
            default -> "día desconocido";
        };
    }

}
