package com.medicalerp.dashboard.service;

import com.medicalerp.cita.entity.Cita;
import com.medicalerp.cita.repository.CitaRepository;
import com.medicalerp.dashboard.dto.CitasHoyStatsDto;
import com.medicalerp.dashboard.dto.DashboardResumenResponse;
import com.medicalerp.dashboard.dto.TratamientoActivoDto;
import com.medicalerp.paciente.entity.Paciente;
import com.medicalerp.paciente.repository.PacienteRepository;
import com.medicalerp.tratamiento.entity.ProtocoloClinico;
import com.medicalerp.tratamiento.entity.SesionTratamiento;
import com.medicalerp.tratamiento.entity.Tratamiento;
import com.medicalerp.tratamiento.enums.EstadoTratamiento;
import com.medicalerp.tratamiento.repository.ProtocoloClinicoRepository;
import com.medicalerp.tratamiento.repository.SesionTratamientoRepository;
import com.medicalerp.tratamiento.repository.TratamientoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

/**
 * Dashboard Service Unit Tests (API-DASH-001)
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class DashboardServiceTest {

    @Mock
    private CitaRepository citaRepository;

    @Mock
    private PacienteRepository pacienteRepository;

    @Mock
    private TratamientoRepository tratamientoRepository;

    @Mock
    private SesionTratamientoRepository sesionTratamientoRepository;

    @Mock
    private ProtocoloClinicoRepository protocoloClinicoRepository;

    @InjectMocks
    private DashboardService dashboardService;

    private static final Long CLINICA_ID = 1L;

    private Paciente paciente;
    private Tratamiento tratamiento;

    @BeforeEach
    void setUp() {
        paciente = Paciente.builder()
                .id(1L)
                .clinicaId(CLINICA_ID)
                .apellidoPaterno("Garcia")
                .apellidoMaterno("Lopez")
                .nombres("Maria")
                .build();

        tratamiento = Tratamiento.builder()
                .id(10L)
                .clinicaId(CLINICA_ID)
                .pacienteId(1L)
                .tipoTratamiento("PRP")
                .estado(EstadoTratamiento.EN_CURSO)
                .sesionesRealizadas(2)
                .sesionesPlaneadas(6)
                .build();
    }

    private Cita buildCita(Long id, String estado, String prioridad, LocalDateTime fechaHora) {
        return Cita.builder()
                .id(id)
                .paciente(paciente)
                .fechaHora(fechaHora)
                .prioridad(prioridad)
                .motivo("Consulta de control")
                .estado(estado)
                .build();
    }

    @Test
    void obtenerResumen_AgregaStatsYColaCorrectamente() {
        Cita urgente = buildCita(1L, "pendiente", "URGENTE", LocalDate.now().atTime(10, 0));
        Cita asistida = buildCita(2L, "asistio", "NORMAL", LocalDate.now().atTime(9, 0));
        Cita completada = buildCita(3L, "completada", "NORMAL", LocalDate.now().atTime(8, 0));

        when(citaRepository.findByFechaAndEstadoNot(LocalDate.now(), "cancelada"))
                .thenReturn(List.of(urgente, asistida, completada));
        when(citaRepository.findProximas(org.mockito.ArgumentMatchers.any())).thenReturn(List.of());
        when(tratamientoRepository.findByClinicaIdAndEstado(CLINICA_ID, EstadoTratamiento.EN_CURSO))
                .thenReturn(List.of(tratamiento));
        when(tratamientoRepository.findByClinicaIdAndEstado(CLINICA_ID, EstadoTratamiento.PROGRAMADO))
                .thenReturn(List.of());
        when(tratamientoRepository.findByClinicaIdAndEstado(CLINICA_ID, EstadoTratamiento.PENDIENTE))
                .thenReturn(List.of());
        when(tratamientoRepository.findByClinicaIdAndEstado(CLINICA_ID, EstadoTratamiento.PAUSADO))
                .thenReturn(List.of());
        when(tratamientoRepository.findByClinicaIdAndEstado(CLINICA_ID, EstadoTratamiento.FINALIZADO))
                .thenReturn(List.of());
        when(tratamientoRepository.findByClinicaIdAndEstado(CLINICA_ID, EstadoTratamiento.CANCELADO))
                .thenReturn(List.of());
        when(tratamientoRepository.findByClinicaId(CLINICA_ID, org.springframework.data.domain.PageRequest.of(0, 1)))
                .thenReturn(org.springframework.data.domain.Page.empty());
        when(tratamientoRepository.findActivosConLimiteAlcanzado(CLINICA_ID)).thenReturn(List.of());
        when(tratamientoRepository.findPendientesDeInicio(CLINICA_ID)).thenReturn(List.of());
        when(pacienteRepository.findAllById(org.mockito.ArgumentMatchers.anySet()))
                .thenReturn(List.of(paciente));
        when(pacienteRepository.countByClinicaIdAndCreatedAtGreaterThanEqual(
                org.mockito.ArgumentMatchers.eq(CLINICA_ID), org.mockito.ArgumentMatchers.any()))
                .thenReturn(3L);

        DashboardResumenResponse resumen = dashboardService.obtenerResumen(CLINICA_ID);

        assertNotNull(resumen);
        assertEquals(CLINICA_ID, resumen.getClinicaId());

        CitasHoyStatsDto stats = resumen.getCitasHoy();
        assertEquals(3, stats.getTotal());
        assertEquals(1, stats.getPendientes());
        assertEquals(1, stats.getAsistieron());
        assertEquals(1, stats.getCompletadas());
        assertEquals(1, stats.getEsperando());

        // La cola ordena urgente primero y excluye estados finales (completada/cancelada)
        assertEquals(1L, resumen.getProximoPaciente().getId());
        assertEquals(2, resumen.getCola().size());

        // Tratamiento activo expuesto
        assertEquals(1, resumen.getTratamientosActivos().size());
        TratamientoActivoDto activo = resumen.getTratamientosActivos().get(0);
        assertEquals("PRP", activo.getTipoTratamiento());
        assertEquals("Garcia Lopez, Maria", activo.getPacienteNombre());
        assertEquals(4, activo.getSesionesRestantes());

        assertEquals(3, resumen.getPacientesNuevos7d());
    }

    @Test
    void obtenerResumen_GeneraAlertasDeSesionVencida() {
        when(citaRepository.findByFechaAndEstadoNot(LocalDate.now(), "cancelada")).thenReturn(List.of());
        when(citaRepository.findProximas(org.mockito.ArgumentMatchers.any())).thenReturn(List.of());
        when(tratamientoRepository.findByClinicaIdAndEstado(CLINICA_ID, EstadoTratamiento.EN_CURSO))
                .thenReturn(List.of(tratamiento));
        when(tratamientoRepository.findByClinicaIdAndEstado(CLINICA_ID, EstadoTratamiento.PROGRAMADO))
                .thenReturn(List.of());
        when(tratamientoRepository.findByClinicaIdAndEstado(CLINICA_ID, EstadoTratamiento.PENDIENTE))
                .thenReturn(List.of());
        when(tratamientoRepository.findByClinicaIdAndEstado(CLINICA_ID, EstadoTratamiento.PAUSADO))
                .thenReturn(List.of());
        when(tratamientoRepository.findByClinicaIdAndEstado(CLINICA_ID, EstadoTratamiento.FINALIZADO))
                .thenReturn(List.of());
        when(tratamientoRepository.findByClinicaIdAndEstado(CLINICA_ID, EstadoTratamiento.CANCELADO))
                .thenReturn(List.of());
        when(tratamientoRepository.findByClinicaId(CLINICA_ID, org.springframework.data.domain.PageRequest.of(0, 1)))
                .thenReturn(org.springframework.data.domain.Page.empty());
        when(tratamientoRepository.findActivosConLimiteAlcanzado(CLINICA_ID)).thenReturn(List.of());
        when(tratamientoRepository.findPendientesDeInicio(CLINICA_ID)).thenReturn(List.of());
        when(pacienteRepository.findById(1L)).thenReturn(Optional.of(paciente));

        // Última sesión hace 14 días con frecuencia de 7 días → vencida
        SesionTratamiento ultima = SesionTratamiento.builder()
                .id(1L)
                .tratamientoId(10L)
                .fecha(LocalDateTime.now().minusDays(14))
                .build();
        when(sesionTratamientoRepository.findUltimaByTratamientoId(10L)).thenReturn(Optional.of(ultima));

        ProtocoloClinico protocolo = ProtocoloClinico.builder()
                .id(1L)
                .tratamientoId(10L)
                .frecuenciaDias(7)
                .build();
        when(protocoloClinicoRepository.findByTratamientoId(10L)).thenReturn(Optional.of(protocolo));

        DashboardResumenResponse resumen = dashboardService.obtenerResumen(CLINICA_ID);

        assertFalse(resumen.getAlertas().isEmpty());
        assertTrue(resumen.getAlertas().stream()
                .anyMatch(a -> "SESION_VENCIDA".equals(a.getTipoAlerta())));
        assertEquals("Garcia Lopez, Maria", resumen.getAlertas().get(0).getPacienteNombre());
    }

    @Test
    void obtenerResumen_SinDatos_DevuelveEstructuraVacia() {
        when(citaRepository.findByFechaAndEstadoNot(LocalDate.now(), "cancelada")).thenReturn(List.of());
        when(citaRepository.findProximas(org.mockito.ArgumentMatchers.any())).thenReturn(List.of());
        when(tratamientoRepository.findByClinicaIdAndEstado(CLINICA_ID, EstadoTratamiento.EN_CURSO))
                .thenReturn(List.of());
        when(tratamientoRepository.findByClinicaIdAndEstado(CLINICA_ID, EstadoTratamiento.PROGRAMADO))
                .thenReturn(List.of());
        when(tratamientoRepository.findByClinicaIdAndEstado(CLINICA_ID, EstadoTratamiento.PENDIENTE))
                .thenReturn(List.of());
        when(tratamientoRepository.findByClinicaIdAndEstado(CLINICA_ID, EstadoTratamiento.PAUSADO))
                .thenReturn(List.of());
        when(tratamientoRepository.findByClinicaIdAndEstado(CLINICA_ID, EstadoTratamiento.FINALIZADO))
                .thenReturn(List.of());
        when(tratamientoRepository.findByClinicaIdAndEstado(CLINICA_ID, EstadoTratamiento.CANCELADO))
                .thenReturn(List.of());
        when(tratamientoRepository.findByClinicaId(CLINICA_ID, org.springframework.data.domain.PageRequest.of(0, 1)))
                .thenReturn(org.springframework.data.domain.Page.empty());
        when(tratamientoRepository.findActivosConLimiteAlcanzado(CLINICA_ID)).thenReturn(List.of());
        when(tratamientoRepository.findPendientesDeInicio(CLINICA_ID)).thenReturn(List.of());

        DashboardResumenResponse resumen = dashboardService.obtenerResumen(CLINICA_ID);

        assertNotNull(resumen);
        assertNull(resumen.getProximoPaciente());
        assertTrue(resumen.getCola().isEmpty());
        assertTrue(resumen.getTratamientosActivos().isEmpty());
        assertTrue(resumen.getAlertas().isEmpty());
        assertEquals(0, resumen.getCitasHoy().getTotal());
    }

}
