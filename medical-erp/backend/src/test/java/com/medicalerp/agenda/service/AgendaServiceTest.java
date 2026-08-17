package com.medicalerp.agenda.service;

import com.medicalerp.common.exception.BusinessRuleException;
import com.medicalerp.common.exception.ResourceNotFoundException;
import com.medicalerp.common.util.SecurityUtils;
import com.medicalerp.agenda.dto.*;
import com.medicalerp.agenda.entity.Agenda;
import com.medicalerp.agenda.entity.Disponibilidad;
import com.medicalerp.seguridad.entity.Usuario;
import com.medicalerp.agenda.mapper.AgendaMapper;
import com.medicalerp.agenda.mapper.TipoCitaMapper;
import com.medicalerp.agenda.repository.AgendaRepository;
import com.medicalerp.agenda.repository.BloqueoRepository;
import com.medicalerp.agenda.repository.DisponibilidadRepository;
import com.medicalerp.agenda.repository.TipoCitaRepository;
import com.medicalerp.seguridad.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

/**
 * Agenda Service Unit Tests (DOM-AGE-001)
 */
@ExtendWith(MockitoExtension.class)
class AgendaServiceTest {

    @Mock
    private AgendaRepository agendaRepository;

    @Mock
    private DisponibilidadRepository disponibilidadRepository;

    @Mock
    private BloqueoRepository bloqueoRepository;

    @Mock
    private TipoCitaRepository tipoCitaRepository;

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private AgendaMapper agendaMapper;

    @Mock
    private TipoCitaMapper tipoCitaMapper;

    @Mock
    private SecurityUtils securityUtils;

    @InjectMocks
    private AgendaService agendaService;

    private Agenda agenda;
    private Usuario usuario;

    @BeforeEach
    void setUp() {
        usuario = Usuario.builder().id(1L).nombre("Dr. Maria").build();

        agenda = Agenda.builder()
                .id(1L)
                .usuario(usuario)
                .nombre("Mi Agenda")
                .disponibilidades(new ArrayList<>())
                .build();
    }

    // --- Disponibilidad Overlap (BR-AGE-003 / VR-AGE-002) ---

    @Test
    void updateDisponibilidades_WithOverlap_ShouldThrowBusinessRuleException() {
        when(agendaRepository.findById(1L)).thenReturn(Optional.of(agenda));
        doNothing().when(securityUtils).validateOwnershipOrAdmin(anyLong());

        List<DisponibilidadRequest> disponibilidades = List.of(
                DisponibilidadRequest.builder().diaSemana(1).horaInicio(LocalTime.of(9, 0)).horaFin(LocalTime.of(12, 0)).build(),
                DisponibilidadRequest.builder().diaSemana(1).horaInicio(LocalTime.of(11, 0)).horaFin(LocalTime.of(14, 0)).build()
        );

        BusinessRuleException ex = assertThrows(BusinessRuleException.class,
                () -> agendaService.updateDisponibilidades(1L, disponibilidades));

        assertEquals("VR-AGE-002", ex.getRuleCode());
    }

    @Test
    void updateDisponibilidades_WithNoOverlap_ShouldSucceed() {
        when(agendaRepository.findById(1L)).thenReturn(Optional.of(agenda));
        doNothing().when(securityUtils).validateOwnershipOrAdmin(anyLong());
        when(agendaMapper.toEntity(any(DisponibilidadRequest.class))).thenAnswer(inv -> Disponibilidad.builder().build());
        when(agendaRepository.save(any(Agenda.class))).thenReturn(agenda);

        List<DisponibilidadRequest> disponibilidades = List.of(
                DisponibilidadRequest.builder().diaSemana(1).horaInicio(LocalTime.of(9, 0)).horaFin(LocalTime.of(12, 0)).build(),
                DisponibilidadRequest.builder().diaSemana(2).horaInicio(LocalTime.of(14, 0)).horaFin(LocalTime.of(16, 0)).build()
        );

        assertDoesNotThrow(() -> agendaService.updateDisponibilidades(1L, disponibilidades));
    }

    @Test
    void updateDisponibilidades_SameDayAdjacent_ShouldSucceed() {
        when(agendaRepository.findById(1L)).thenReturn(Optional.of(agenda));
        doNothing().when(securityUtils).validateOwnershipOrAdmin(anyLong());
        when(agendaMapper.toEntity(any(DisponibilidadRequest.class))).thenAnswer(inv -> Disponibilidad.builder().build());
        when(agendaRepository.save(any(Agenda.class))).thenReturn(agenda);

        // Adjacent: 9:00-12:00 and 12:00-15:00 — should NOT overlap (fin == inicio)
        List<DisponibilidadRequest> disponibilidades = List.of(
                DisponibilidadRequest.builder().diaSemana(1).horaInicio(LocalTime.of(9, 0)).horaFin(LocalTime.of(12, 0)).build(),
                DisponibilidadRequest.builder().diaSemana(1).horaInicio(LocalTime.of(12, 0)).horaFin(LocalTime.of(15, 0)).build()
        );

        assertDoesNotThrow(() -> agendaService.updateDisponibilidades(1L, disponibilidades));
    }

    // --- Bloqueo vs Disponibilidad (BR-AGE-004) ---

    @Test
    void createBloqueo_OverlappingDisponibilidad_ShouldThrowBusinessRuleException() {
        agenda.getDisponibilidades().add(
                Disponibilidad.builder().diaSemana(1).horaInicio(LocalTime.of(9, 0)).horaFin(LocalTime.of(17, 0)).build()
        );

        when(agendaRepository.findById(1L)).thenReturn(Optional.of(agenda));
        doNothing().when(securityUtils).validateOwnershipOrAdmin(anyLong());
        when(bloqueoRepository.findOverlapping(any(), any(), any())).thenReturn(Collections.emptyList());

        // Monday at 10:00-11:00 overlaps with 9:00-17:00
        BloqueoRequest request = BloqueoRequest.builder()
                .fechaInicio(LocalDateTime.of(2026, 8, 3, 10, 0)) // Monday
                .fechaFin(LocalDateTime.of(2026, 8, 3, 11, 0))
                .build();

        BusinessRuleException ex = assertThrows(BusinessRuleException.class,
                () -> agendaService.createBloqueo(1L, request));

        assertEquals("VR-AGE-004", ex.getRuleCode());
    }

    @Test
    void createBloqueo_OutsideDisponibilidad_ShouldSucceed() {
        agenda.getDisponibilidades().add(
                Disponibilidad.builder().diaSemana(1).horaInicio(LocalTime.of(9, 0)).horaFin(LocalTime.of(17, 0)).build()
        );

        when(agendaRepository.findById(1L)).thenReturn(Optional.of(agenda));
        doNothing().when(securityUtils).validateOwnershipOrAdmin(anyLong());
        when(bloqueoRepository.findOverlapping(any(), any(), any())).thenReturn(Collections.emptyList());
        when(agendaMapper.toEntity(any(BloqueoRequest.class))).thenAnswer(inv -> com.medicalerp.agenda.entity.Bloqueo.builder().build());

        // Saturday at 10:00-11:00 (day 6, not in disponibilidad which is day 1)
        BloqueoRequest request = BloqueoRequest.builder()
                .fechaInicio(LocalDateTime.of(2026, 8, 8, 10, 0)) // Saturday
                .fechaFin(LocalDateTime.of(2026, 8, 8, 11, 0))
                .build();

        assertDoesNotThrow(() -> agendaService.createBloqueo(1L, request));
    }

    @Test
    void createBloqueo_WithInvalidDateRange_ShouldThrowBusinessRuleException() {
        when(agendaRepository.findById(1L)).thenReturn(Optional.of(agenda));
        doNothing().when(securityUtils).validateOwnershipOrAdmin(anyLong());

        BloqueoRequest request = BloqueoRequest.builder()
                .fechaInicio(LocalDateTime.of(2026, 8, 3, 11, 0))
                .fechaFin(LocalDateTime.of(2026, 8, 3, 10, 0))
                .build();

        BusinessRuleException ex = assertThrows(BusinessRuleException.class,
                () -> agendaService.createBloqueo(1L, request));

        assertEquals("VR-AGE-001", ex.getRuleCode());
    }

    @Test
    void getByUsuarioId_NonExistent_ShouldThrowResourceNotFoundException() {
        when(securityUtils.getCurrentUserId()).thenReturn(1L);
        when(securityUtils.isAdmin()).thenReturn(true);
        when(agendaRepository.findByUsuarioId(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> agendaService.getByUsuarioId(99L));
    }

}
