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
import com.medicalerp.cita.dto.CitaRequest;
import com.medicalerp.cita.dto.CitaResponse;
import com.medicalerp.cita.entity.Cita;
import com.medicalerp.cita.mapper.CitaMapper;
import com.medicalerp.cita.repository.CitaRepository;
import com.medicalerp.paciente.entity.Paciente;
import com.medicalerp.paciente.repository.PacienteRepository;
import com.medicalerp.seguridad.entity.Usuario;
import com.medicalerp.seguridad.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
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

    private static final List<String> ESTADOS_FINALES = Arrays.asList("cancelada", "completada");
    private static final List<String> ESTADOS_MODIFICABLES = Arrays.asList("pendiente", "confirmada", "asistio");

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

        // Set prioridad from TipoCita default if not provided
        if (cita.getPrioridad() == null && request.getTipoCitaId() != null) {
            TipoCita tipoCita = tipoCitaRepository.findById(request.getTipoCitaId()).orElse(null);
            if (tipoCita != null) {
                cita.setPrioridad(tipoCita.getPrioridadDefault());
            }
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

        if (!"pendiente".equals(cita.getEstado())) {
            throw new BusinessRuleException("BR-CIT-001", "No se puede confirmar una cita que no esté pendiente");
        }

        cita.setEstado("confirmada");
        Cita saved = citaRepository.save(cita);
        return citaMapper.toResponse(saved);
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
        Long usuarioId = request.getUsuarioId() != null ? request.getUsuarioId()
                : (cita.getUsuario() != null ? cita.getUsuario().getId() : null);

        // Validate Agenda availability
        if (usuarioId != null) {
            validarDisponibilidad(usuarioId, request.getFecha(), request.getHora(), duracion);
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
