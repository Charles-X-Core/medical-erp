package com.medicalerp.cita.service;

import com.medicalerp.common.exception.BusinessRuleException;
import com.medicalerp.common.exception.ResourceNotFoundException;
import com.medicalerp.cita.dto.CitaRequest;
import com.medicalerp.cita.dto.CitaResponse;
import com.medicalerp.cita.entity.Cita;
import com.medicalerp.cita.mapper.CitaMapper;
import com.medicalerp.cita.repository.CitaRepository;
import com.medicalerp.paciente.entity.Paciente;
import com.medicalerp.paciente.repository.PacienteRepository;
import com.medicalerp.seguridad.entity.Usuario;
import com.medicalerp.seguridad.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Cita Service Unit Tests (DOM-CIT-001)
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class CitaServiceTest {

    @Mock
    private CitaRepository citaRepository;

    @Mock
    private PacienteRepository pacienteRepository;

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private CitaMapper citaMapper;

    @InjectMocks
    private CitaService citaService;

    private CitaRequest request;
    private Cita cita;
    private CitaResponse response;
    private Paciente paciente;
    private Usuario usuario;

    @BeforeEach
    void setUp() {
        paciente = Paciente.builder().id(1L).apellidoPaterno("Garcia").nombres("Maria").build();
        usuario = Usuario.builder().id(1L).nombre("Dr. Maria").build();

        request = CitaRequest.builder()
                .pacienteId(1L)
                .usuarioId(1L)
                .fecha(LocalDate.now().plusDays(1))
                .hora(LocalTime.of(10, 0))
                .motivo("Consulta de control")
                .build();

        cita = Cita.builder()
                .id(1L)
                .paciente(paciente)
                .usuario(usuario)
                .fechaHora(LocalDate.now().plusDays(1).atTime(10, 0))
                .duracionMinutos(30)
                .motivo("Consulta de control")
                .estado("pendiente")
                .build();

        response = CitaResponse.builder()
                .id(1L)
                .estado("pendiente")
                .build();
    }

    // --- State Machine Tests ---

    @Test
    void confirmar_Pendiente_ShouldChangeToConfirmada() {
        when(citaRepository.findById(1L)).thenReturn(Optional.of(cita));
        when(citaRepository.save(cita)).thenReturn(cita);
        when(citaMapper.toResponse(cita)).thenReturn(response);

        CitaResponse result = citaService.confirmar(1L);

        assertNotNull(result);
        assertEquals("confirmada", cita.getEstado());
    }

    @Test
    void confirmar_NonPendiente_ShouldThrowBusinessRuleException() {
        cita.setEstado("confirmada");
        when(citaRepository.findById(1L)).thenReturn(Optional.of(cita));

        BusinessRuleException ex = assertThrows(BusinessRuleException.class,
                () -> citaService.confirmar(1L));

        assertEquals("BR-CIT-001", ex.getRuleCode());
    }

    @Test
    void registrarAsistencia_Confirmada_ShouldChangeToAsistio() {
        cita.setEstado("confirmada");
        when(citaRepository.findById(1L)).thenReturn(Optional.of(cita));
        when(citaRepository.save(cita)).thenReturn(cita);
        when(citaMapper.toResponse(cita)).thenReturn(response);

        CitaResponse result = citaService.registrarAsistencia(1L);

        assertNotNull(result);
        assertEquals("asistio", cita.getEstado());
        assertNotNull(cita.getAsistioConfirmedAt());
    }

    @Test
    void registrarAsistencia_NotConfirmada_ShouldThrowBusinessRuleException() {
        cita.setEstado("pendiente");
        when(citaRepository.findById(1L)).thenReturn(Optional.of(cita));

        BusinessRuleException ex = assertThrows(BusinessRuleException.class,
                () -> citaService.registrarAsistencia(1L));

        assertEquals("BR-CIT-002", ex.getRuleCode());
    }

    @Test
    void completar_Asistio_WithConsultaId_ShouldChangeToCompletada() {
        cita.setEstado("asistio");
        when(citaRepository.findById(1L)).thenReturn(Optional.of(cita));
        when(citaRepository.save(cita)).thenReturn(cita);
        when(citaMapper.toResponse(cita)).thenReturn(response);

        CitaResponse result = citaService.completar(1L, 100L);

        assertNotNull(result);
        assertEquals("completada", cita.getEstado());
        assertEquals(100L, cita.getConsultaId());
    }

    @Test
    void completar_Asistio_WithoutConsultaId_ShouldThrowBusinessRuleException() {
        cita.setEstado("asistio");
        when(citaRepository.findById(1L)).thenReturn(Optional.of(cita));

        BusinessRuleException ex = assertThrows(BusinessRuleException.class,
                () -> citaService.completar(1L, null));

        assertEquals("INV-CIT-005", ex.getRuleCode());
    }

    @Test
    void completar_NotAsistio_ShouldThrowBusinessRuleException() {
        cita.setEstado("confirmada");
        when(citaRepository.findById(1L)).thenReturn(Optional.of(cita));

        BusinessRuleException ex = assertThrows(BusinessRuleException.class,
                () -> citaService.completar(1L, 100L));

        assertEquals("BR-CIT-003", ex.getRuleCode());
    }

    @Test
    void cancelar_Pendiente_ShouldChangeToCancelada() {
        cita.setFecha(LocalDate.now().plusDays(1));
        when(citaRepository.findById(1L)).thenReturn(Optional.of(cita));
        when(citaRepository.save(cita)).thenReturn(cita);
        when(citaMapper.toResponse(cita)).thenReturn(response);

        CitaResponse result = citaService.cancelar(1L, "Paciente solicita");

        assertNotNull(result);
        assertEquals("cancelada", cita.getEstado());
        assertNotNull(cita.getCanceladoAt());
        assertEquals("Paciente solicita", cita.getCanceladoMotivo());
    }

    @Test
    void cancelar_Completada_ShouldThrowBusinessRuleException() {
        cita.setEstado("completada");
        when(citaRepository.findById(1L)).thenReturn(Optional.of(cita));

        BusinessRuleException ex = assertThrows(BusinessRuleException.class,
                () -> citaService.cancelar(1L, null));

        assertEquals("INVALID_STATE", ex.getRuleCode());
    }

    // --- Past Date Validation ---

    @Test
    void create_WithPastDate_ShouldThrowBusinessRuleException() {
        request.setFecha(LocalDate.now().minusDays(1));
        when(pacienteRepository.findById(1L)).thenReturn(Optional.of(paciente));

        BusinessRuleException ex = assertThrows(BusinessRuleException.class,
                () -> citaService.create(request));

        assertEquals("PAST_DATE", ex.getRuleCode());
    }

    @Test
    void create_WithConflict_ShouldThrowBusinessRuleException() {
        when(pacienteRepository.findById(1L)).thenReturn(Optional.of(paciente));
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(usuario));
        when(citaRepository.countConflictingCita(any(), any(), any(), any(), any())).thenReturn(1L);

        BusinessRuleException ex = assertThrows(BusinessRuleException.class,
                () -> citaService.create(request));

        assertEquals("APPOINTMENT_CONFLICT", ex.getRuleCode());
    }

    @Test
    void getById_NonExistent_ShouldThrowResourceNotFoundException() {
        when(citaRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> citaService.getById(99L));
    }

}
