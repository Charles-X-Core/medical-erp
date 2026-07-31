package com.medicalerp.agenda.service;

import com.medicalerp.common.exception.BusinessRuleException;
import com.medicalerp.common.exception.DuplicateResourceException;
import com.medicalerp.common.exception.ResourceNotFoundException;
import com.medicalerp.common.util.Auditable;
import com.medicalerp.agenda.dto.*;
import com.medicalerp.agenda.entity.Agenda;
import com.medicalerp.agenda.entity.Bloqueo;
import com.medicalerp.agenda.entity.Disponibilidad;
import com.medicalerp.agenda.entity.TipoCita;
import com.medicalerp.agenda.mapper.AgendaMapper;
import com.medicalerp.agenda.mapper.TipoCitaMapper;
import com.medicalerp.agenda.repository.AgendaRepository;
import com.medicalerp.agenda.repository.BloqueoRepository;
import com.medicalerp.agenda.repository.DisponibilidadRepository;
import com.medicalerp.agenda.repository.TipoCitaRepository;
import com.medicalerp.seguridad.entity.Usuario;
import com.medicalerp.seguridad.repository.UsuarioRepository;
import com.medicalerp.common.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

/**
 * Agenda Service (DOM-AGE-001)
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AgendaService {

    private final AgendaRepository agendaRepository;
    private final DisponibilidadRepository disponibilidadRepository;
    private final BloqueoRepository bloqueoRepository;
    private final TipoCitaRepository tipoCitaRepository;
    private final UsuarioRepository usuarioRepository;
    private final AgendaMapper agendaMapper;
    private final TipoCitaMapper tipoCitaMapper;
    private final SecurityUtils securityUtils;

    @Transactional
    @Auditable
    public AgendaResponse createAgenda(AgendaRequest request) {
        if (agendaRepository.existsByUsuarioId(request.getUsuarioId())) {
            throw new DuplicateResourceException("usuario_id", request.getUsuarioId().toString());
        }

        // Only admin can create agenda for another user
        Long currentUserId = securityUtils.getCurrentUserId();
        if (currentUserId != null && !currentUserId.equals(request.getUsuarioId()) && !securityUtils.isAdmin()) {
            throw new org.springframework.security.access.AccessDeniedException("Solo puede crear su propia agenda");
        }

        Usuario usuario = usuarioRepository.findById(request.getUsuarioId())
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", request.getUsuarioId()));

        Agenda agenda = Agenda.builder()
                .usuario(usuario)
                .nombre(request.getNombre())
                .build();

        if (request.getDisponibilidades() != null) {
            for (DisponibilidadRequest dr : request.getDisponibilidades()) {
                validateDisponibilidad(dr);
                Disponibilidad d = agendaMapper.toEntity(dr);
                d.setAgenda(agenda);
                agenda.getDisponibilidades().add(d);
            }
        }

        Agenda saved = agendaRepository.save(agenda);
        return agendaMapper.toResponse(saved);
    }

    public AgendaResponse getByUsuarioId(Long usuarioId) {
        // Non-admin users can only view their own agenda
        Long currentUserId = securityUtils.getCurrentUserId();
        if (currentUserId != null && !currentUserId.equals(usuarioId) && !securityUtils.isAdmin()) {
            throw new org.springframework.security.access.AccessDeniedException("Solo puede ver su propia agenda");
        }

        Agenda agenda = agendaRepository.findByUsuarioId(usuarioId)
                .orElseThrow(() -> new ResourceNotFoundException("Agenda del usuario", usuarioId));
        return agendaMapper.toResponse(agenda);
    }

    @Transactional
    @Auditable
    public AgendaResponse updateDisponibilidades(Long agendaId, List<DisponibilidadRequest> request) {
        Agenda agenda = agendaRepository.findById(agendaId)
                .orElseThrow(() -> new ResourceNotFoundException("Agenda", agendaId));

        securityUtils.validateOwnershipOrAdmin(agenda.getUsuario().getId());

        // Validate no overlapping disponibilidades within the request
        validateNoOverlappingDisponibilidades(request);

        // Clear and re-add
        agenda.getDisponibilidades().clear();
        for (DisponibilidadRequest dr : request) {
            validateDisponibilidad(dr);
            Disponibilidad d = agendaMapper.toEntity(dr);
            d.setAgenda(agenda);
            agenda.getDisponibilidades().add(d);
        }

        Agenda saved = agendaRepository.save(agenda);
        return agendaMapper.toResponse(saved);
    }

    @Transactional
    @Auditable
    public BloqueoResponse createBloqueo(Long agendaId, BloqueoRequest request) {
        Agenda agenda = agendaRepository.findById(agendaId)
                .orElseThrow(() -> new ResourceNotFoundException("Agenda", agendaId));

        securityUtils.validateOwnershipOrAdmin(agenda.getUsuario().getId());

        if (!request.getFechaFin().isAfter(request.getFechaInicio())) {
            throw new BusinessRuleException("VR-AGE-001", "La fecha de fin debe ser posterior a la fecha de inicio");
        }

        // Check overlapping bloqueos
        List<Bloqueo> overlaps = bloqueoRepository.findOverlapping(agendaId, request.getFechaInicio(), request.getFechaFin());
        if (!overlaps.isEmpty()) {
            throw new BusinessRuleException("VR-AGE-003", "Ya existe un bloqueo en ese horario");
        }

        // Check against disponibilidades (BR-AGE-004)
        validateBloqueoVsDisponibilidad(agenda, request);

        Bloqueo bloqueo = agendaMapper.toEntity(request);
        bloqueo.setAgenda(agenda);
        Bloqueo saved = bloqueoRepository.save(bloqueo);
        return agendaMapper.toResponse(saved);
    }

    public List<BloqueoResponse> getBloqueos(Long agendaId) {
        return bloqueoRepository.findByAgendaId(agendaId).stream()
                .map(agendaMapper::toResponse)
                .toList();
    }

    @Transactional
    @Auditable
    public void deleteBloqueo(Long bloqueoId) {
        Bloqueo bloqueo = bloqueoRepository.findById(bloqueoId)
                .orElseThrow(() -> new ResourceNotFoundException("Bloqueo", bloqueoId));

        securityUtils.validateOwnershipOrAdmin(bloqueo.getAgenda().getUsuario().getId());

        bloqueoRepository.deleteById(bloqueoId);
    }

    // --- Tipo Cita ---

    @Transactional
    @Auditable
    public TipoCitaResponse createTipoCita(TipoCitaRequest request) {
        if (tipoCitaRepository.existsByNombre(request.getNombre())) {
            throw new DuplicateResourceException("nombre", request.getNombre());
        }
        TipoCita tipoCita = tipoCitaMapper.toEntity(request);
        TipoCita saved = tipoCitaRepository.save(tipoCita);
        return tipoCitaMapper.toResponse(saved);
    }

    public List<TipoCitaResponse> getAllTiposCita() {
        return tipoCitaRepository.findByActivoTrue().stream()
                .map(tipoCitaMapper::toResponse)
                .toList();
    }

    public TipoCitaResponse getTipoCitaById(Long id) {
        TipoCita tipoCita = tipoCitaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("TipoCita", id));
        return tipoCitaMapper.toResponse(tipoCita);
    }

    @Transactional
    @Auditable
    public TipoCitaResponse updateTipoCita(Long id, TipoCitaRequest request) {
        TipoCita tipoCita = tipoCitaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("TipoCita", id));

        if (!request.getNombre().equals(tipoCita.getNombre()) && tipoCitaRepository.existsByNombre(request.getNombre())) {
            throw new DuplicateResourceException("nombre", request.getNombre());
        }

        tipoCitaMapper.updateEntity(tipoCita, request);
        TipoCita saved = tipoCitaRepository.save(tipoCita);
        return tipoCitaMapper.toResponse(saved);
    }

    @Transactional
    @Auditable
    public void deleteTipoCita(Long id) {
        TipoCita tipoCita = tipoCitaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("TipoCita", id));
        tipoCita.setActivo(false);
        tipoCitaRepository.save(tipoCita);
    }

    private void validateDisponibilidad(DisponibilidadRequest dr) {
        if (!dr.getHoraFin().isAfter(dr.getHoraInicio())) {
            throw new BusinessRuleException("VR-AGE-001", "La hora de fin debe ser posterior a la hora de inicio");
        }
    }

    private void validateNoOverlappingDisponibilidades(List<DisponibilidadRequest> disponibilidades) {
        for (int i = 0; i < disponibilidades.size(); i++) {
            for (int j = i + 1; j < disponibilidades.size(); j++) {
                DisponibilidadRequest d1 = disponibilidades.get(i);
                DisponibilidadRequest d2 = disponibilidades.get(j);
                if (d1.getDiaSemana().equals(d2.getDiaSemana())) {
                    if (d1.getHoraInicio().isBefore(d2.getHoraFin()) && d2.getHoraInicio().isBefore(d1.getHoraFin())) {
                        throw new BusinessRuleException("VR-AGE-002", "Las disponibilidades no pueden superponerse en el mismo día");
                    }
                }
            }
        }
    }

    private void validateBloqueoVsDisponibilidad(Agenda agenda, BloqueoRequest request) {
        // Java DayOfWeek: Monday=1, Sunday=7. Domain: 0=Sunday, 1=Monday, ..., 6=Saturday
        int diaSemana = request.getFechaInicio().getDayOfWeek().getValue() % 7;
        LocalTime horaInicio = request.getFechaInicio().toLocalTime();
        LocalTime horaFin = request.getFechaFin().toLocalTime();

        for (Disponibilidad d : agenda.getDisponibilidades()) {
            if (d.getDiaSemana().equals(diaSemana)) {
                if (horaInicio.isBefore(d.getHoraFin()) && horaFin.isAfter(d.getHoraInicio())) {
                    throw new BusinessRuleException("VR-AGE-004", "El bloqueo se superpone con la disponibilidad del " + diaSemanaToString(diaSemana));
                }
            }
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
