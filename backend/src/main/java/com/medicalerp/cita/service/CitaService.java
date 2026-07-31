package com.medicalerp.cita.service;

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
        LocalTime horaFin = request.getHora().plusMinutes(duracion);

        // Check conflicts if usuario assigned
        if (usuario != null) {
            boolean conflict = citaRepository.countConflictingCita(
                    usuario.getId(), request.getFecha(), request.getHora(), horaFin) > 0;
            if (conflict) {
                throw new BusinessRuleException("APPOINTMENT_CONFLICT", "Horario no disponible para el profesional");
            }
        }

        Cita cita = citaMapper.toEntity(request);
        cita.setPaciente(paciente);
        cita.setUsuario(usuario);
        cita.setDuracionMinutos(duracion);
        cita.setEstado("pendiente");

        Cita saved = citaRepository.save(cita);
        return citaMapper.toResponse(saved);
    }

    public CitaResponse getById(Long id) {
        Cita cita = citaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cita", id));
        return citaMapper.toResponse(cita);
    }

    public Page<CitaResponse> getAll(LocalDate fecha, String estado, Pageable pageable) {
        Page<Cita> page;
        if (fecha != null && estado != null) {
            // Custom query needed, fallback to fecha filter then manual filter
            page = citaRepository.findByFecha(fecha, pageable);
        } else if (fecha != null) {
            page = citaRepository.findByFecha(fecha, pageable);
        } else if (estado != null) {
            page = citaRepository.findByEstado(estado, pageable);
        } else {
            page = citaRepository.findAll(pageable);
        }
        return page.map(citaMapper::toResponse);
    }

    public List<CitaResponse> getHoy() {
        return citaRepository.findByFechaAndEstadoNot(LocalDate.now(), "cancelada")
                .stream()
                .map(citaMapper::toResponse)
                .toList();
    }

    public List<CitaResponse> getProximas() {
        return citaRepository.findProximas(LocalDate.now())
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
    public CitaResponse update(Long id, CitaRequest request) {
        Cita cita = citaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cita", id));

        if (ESTADOS_FINALES.contains(cita.getEstado())) {
            throw new BusinessRuleException("INVALID_STATE", "No se puede modificar cita en estado " + cita.getEstado());
        }

        validateFechaNoPasada(request.getFecha(), request.getHora());

        Integer duracion = request.getDuracionMinutos() != null ? request.getDuracionMinutos() : cita.getDuracionMinutos();
        LocalTime horaFin = request.getHora().plusMinutes(duracion);

        // Check conflicts excluding current cita
        if (request.getUsuarioId() != null) {
            boolean conflict = citaRepository.countConflictingCita(
                    request.getUsuarioId(), request.getFecha(), request.getHora(), horaFin) > 0;
            // Simple check, edge case: might conflict with itself if same time
            if (conflict && (cita.getUsuario() == null || !cita.getUsuario().getId().equals(request.getUsuarioId())
                    || !cita.getFecha().equals(request.getFecha()) || !cita.getHora().equals(request.getHora()))) {
                throw new BusinessRuleException("APPOINTMENT_CONFLICT", "Horario no disponible para el profesional");
            }
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

    private void validateFechaNoPasada(LocalDate fecha, LocalTime hora) {
        LocalDateTime fechaHora = fecha.atTime(hora);
        if (fechaHora.isBefore(LocalDateTime.now())) {
            throw new BusinessRuleException("PAST_DATE", "No se pueden agendar citas en el pasado");
        }
    }

}
