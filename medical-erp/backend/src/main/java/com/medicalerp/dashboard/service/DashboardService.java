package com.medicalerp.dashboard.service;

import com.medicalerp.cita.entity.Cita;
import com.medicalerp.cita.repository.CitaRepository;
import com.medicalerp.dashboard.dto.CitaResumenDto;
import com.medicalerp.dashboard.dto.CitasHoyStatsDto;
import com.medicalerp.dashboard.dto.DashboardResumenResponse;
import com.medicalerp.dashboard.dto.TratamientoActivoDto;
import com.medicalerp.dashboard.dto.TratamientosStatsDto;
import com.medicalerp.paciente.entity.Paciente;
import com.medicalerp.paciente.repository.PacienteRepository;
import com.medicalerp.tratamiento.dto.TratamientoAlertaResponse;
import com.medicalerp.tratamiento.entity.ProtocoloClinico;
import com.medicalerp.tratamiento.entity.SesionTratamiento;
import com.medicalerp.tratamiento.entity.Tratamiento;
import com.medicalerp.tratamiento.enums.EstadoTratamiento;
import com.medicalerp.tratamiento.repository.ProtocoloClinicoRepository;
import com.medicalerp.tratamiento.repository.SesionTratamientoRepository;
import com.medicalerp.tratamiento.repository.TratamientoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * DashboardService (API-DASH-001)
 * Proyección de solo lectura: agrega citas, cola de atención, tratamientos y alertas
 * por clínica. No modifica datos.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardService {

    private static final List<String> ESTADOS_ACTIVOS_CITA = List.of("pendiente", "confirmada", "asistio");
    private static final List<EstadoTratamiento> ESTADOS_TRATAMIENTO_ACTIVO = List.of(
            EstadoTratamiento.EN_CURSO, EstadoTratamiento.PROGRAMADO, EstadoTratamiento.PENDIENTE);

    private final CitaRepository citaRepository;
    private final PacienteRepository pacienteRepository;
    private final TratamientoRepository tratamientoRepository;
    private final SesionTratamientoRepository sesionTratamientoRepository;
    private final ProtocoloClinicoRepository protocoloClinicoRepository;

    public DashboardResumenResponse obtenerResumen(Long clinicaId) {
        LocalDate hoy = LocalDate.now();
        LocalDateTime ahora = LocalDateTime.now();

        List<Cita> citasHoy = citaRepository.findByFechaAndEstadoNot(hoy, "cancelada");

        // ---- Stats citas hoy ----
        CitasHoyStatsDto citasHoyStats = construirStatsCitasHoy(citasHoy);

        // ---- Cola de atención (prioridad > asistio > hora) ----
        List<Cita> cola = citasHoy.stream()
                .filter(c -> ESTADOS_ACTIVOS_CITA.contains(c.getEstado()))
                .sorted(comparadorCola())
                .toList();

        // ---- Citas hoy (todas, ordenadas por hora) ----
        List<Cita> citasHoyOrdenadas = citasHoy.stream()
                .sorted(Comparator.comparing(citaHora()))
                .toList();

        // ---- Próximas citas (futuras activas, scoped por clínica) ----
        List<Cita> proximas = citaRepository.findProximas(ahora).stream()
                .filter(c -> mismoClinica(c, clinicaId))
                .sorted(Comparator.comparing(Cita::getFechaHora))
                .limit(6)
                .toList();

        // ---- Tratamientos ----
        List<Tratamiento> activos = tratamientoRepository.findByClinicaIdAndEstado(clinicaId, EstadoTratamiento.EN_CURSO);
        List<Tratamiento> programados = tratamientoRepository.findByClinicaIdAndEstado(clinicaId, EstadoTratamiento.PROGRAMADO);
        List<Tratamiento> pendientes = tratamientoRepository.findByClinicaIdAndEstado(clinicaId, EstadoTratamiento.PENDIENTE);

        TratamientosStatsDto tratamientosStats = TratamientosStatsDto.builder()
                .total(contarTotal(clinicaId))
                .pendientes(pendientes.size())
                .programados(programados.size())
                .activos(activos.size())
                .pausados(tratamientoRepository.findByClinicaIdAndEstado(clinicaId, EstadoTratamiento.PAUSADO).size())
                .finalizados(tratamientoRepository.findByClinicaIdAndEstado(clinicaId, EstadoTratamiento.FINALIZADO).size())
                .cancelados(tratamientoRepository.findByClinicaIdAndEstado(clinicaId, EstadoTratamiento.CANCELADO).size())
                .build();

        List<Tratamiento> tratamientosParaLista = new ArrayList<>(activos);
        tratamientosParaLista.addAll(programados);
        tratamientosParaLista.addAll(pendientes);
        List<TratamientoActivoDto> tratamientosActivos = construirTratamientosActivos(tratamientosParaLista, clinicaId);

        List<TratamientoAlertaResponse> alertas = construirAlertas(activos, clinicaId);

        long pacientesNuevos = pacienteRepository
                .countByClinicaIdAndCreatedAtGreaterThanEqual(clinicaId, ahora.minusDays(7));

        return DashboardResumenResponse.builder()
                .clinicaId(clinicaId)
                .fecha(hoy)
                .citasHoy(citasHoyStats)
                .citasHoyList(citasHoyOrdenadas.stream().map(this::toCitaDto).toList())
                .cola(cola.stream().map(this::toCitaDto).limit(6).toList())
                .proximoPaciente(cola.isEmpty() ? null : toCitaDto(cola.get(0)))
                .citasProximas(proximas.stream().map(this::toCitaDto).toList())
                .tratamientos(tratamientosStats)
                .tratamientosActivos(tratamientosActivos)
                .alertas(alertas)
                .pacientesNuevos7d(pacientesNuevos)
                .build();
    }

    // ==================== Helpers ====================

    private CitasHoyStatsDto construirStatsCitasHoy(List<Cita> citasHoy) {
        long total = citasHoy.size();
        long pendientes = contarEstado(citasHoy, "pendiente");
        long confirmadas = contarEstado(citasHoy, "confirmada");
        long asistieron = contarEstado(citasHoy, "asistio");
        long completadas = contarEstado(citasHoy, "completada");
        long canceladas = contarEstado(citasHoy, "cancelada");
        long reprogramadas = contarEstado(citasHoy, "reprogramada");
        return CitasHoyStatsDto.builder()
                .total(total)
                .pendientes(pendientes)
                .confirmadas(confirmadas)
                .asistieron(asistieron)
                .completadas(completadas)
                .canceladas(canceladas)
                .reprogramadas(reprogramadas)
                .esperando(confirmadas + asistieron)
                .build();
    }

    private long contarEstado(List<Cita> citas, String estado) {
        return citas.stream().filter(c -> estado.equals(c.getEstado())).count();
    }

    private Comparator<Cita> comparadorCola() {
        return Comparator
                .comparing((Cita c) -> "URGENTE".equalsIgnoreCase(c.getPrioridad()) ? 0 : 1)
                .thenComparing(c -> "asistio".equals(c.getEstado()) ? 0 : 1)
                .thenComparing(citaHora());
    }

    private Function<Cita, LocalDateTime> citaHora() {
        return Cita::getFechaHora;
    }

    private List<TratamientoActivoDto> construirTratamientosActivos(List<Tratamiento> tratamientos, Long clinicaId) {
        if (tratamientos.isEmpty()) return List.of();

        Map<Long, Paciente> pacientes = pacienteRepository
                .findAllById(tratamientos.stream().map(Tratamiento::getPacienteId).collect(Collectors.toSet()))
                .stream()
                .collect(Collectors.toMap(Paciente::getId, Function.identity()));

        return tratamientos.stream()
                .sorted(Comparator.comparing(Tratamiento::getEstado, Comparator.comparingInt(ESTADOS_TRATAMIENTO_ACTIVO::indexOf)))
                .map(t -> {
                    Paciente p = pacientes.get(t.getPacienteId());
                    return TratamientoActivoDto.builder()
                            .id(t.getId())
                            .pacienteId(t.getPacienteId())
                            .pacienteNombre(p != null ? p.getNombreCompleto() : null)
                            .tipoTratamiento(t.getTipoTratamiento())
                            .estado(t.getEstado().name())
                            .fechaInicio(t.getFechaInicio())
                            .sesionesRealizadas(t.getSesionesRealizadas())
                            .sesionesPlaneadas(t.getSesionesPlaneadas())
                            .sesionesRestantes(t.getSesionesRestantes())
                            .costoEstimado(t.getCostoEstimado())
                            .build();
                })
                .toList();
    }

    private List<TratamientoAlertaResponse> construirAlertas(List<Tratamiento> enCurso, Long clinicaId) {
        List<TratamientoAlertaResponse> alertas = new ArrayList<>();

        for (Tratamiento t : tratamientoRepository.findActivosConLimiteAlcanzado(clinicaId)) {
            alertas.add(buildAlerta(t, "LIMITE_ALCANZADO", "ERROR",
                    "El tratamiento alcanzó el límite de sesiones planeadas",
                    "Finalizar o ampliar el plan de tratamiento"));
        }

        for (Tratamiento t : tratamientoRepository.findPendientesDeInicio(clinicaId)) {
            alertas.add(buildAlerta(t, "PENDIENTE_INICIO", "WARNING",
                    "Tratamiento creado pendiente de inicio",
                    "Programar e iniciar el tratamiento"));
        }

        for (Tratamiento t : enCurso) {
            Optional<SesionTratamiento> ultima = sesionTratamientoRepository.findUltimaByTratamientoId(t.getId());
            if (ultima.isEmpty()) continue;
            Optional<ProtocoloClinico> protocolo = protocoloClinicoRepository.findByTratamientoId(t.getId());
            if (protocolo.isEmpty() || protocolo.get().getFrecuenciaDias() == null) continue;

            LocalDate fechaProxima = ultima.get().getFecha().toLocalDate()
                    .plusDays(protocolo.get().getFrecuenciaDias());
            if (!fechaProxima.isAfter(LocalDate.now())) {
                alertas.add(buildAlerta(t, "SESION_VENCIDA", "ERROR",
                        "Sesión vencida desde " + fechaProxima,
                        "Programar la próxima sesión"));
            }
        }

        return alertas;
    }

    private TratamientoAlertaResponse buildAlerta(Tratamiento t, String tipo, String severidad,
                                                  String mensaje, String accionSugerida) {
        String pacienteNombre = pacienteRepository.findById(t.getPacienteId())
                .map(Paciente::getNombreCompleto)
                .orElse(null);
        return TratamientoAlertaResponse.builder()
                .tipoAlerta(tipo)
                .tratamientoId(t.getId())
                .pacienteId(t.getPacienteId())
                .pacienteNombre(pacienteNombre)
                .tipoTratamiento(t.getTipoTratamiento())
                .mensaje(mensaje)
                .accionSugerida(accionSugerida)
                .severidad(severidad)
                .build();
    }

    private CitaResumenDto toCitaDto(Cita cita) {
        return CitaResumenDto.builder()
                .id(cita.getId())
                .pacienteId(cita.getPaciente() != null ? cita.getPaciente().getId() : null)
                .pacienteNombre(cita.getPaciente() != null ? cita.getPaciente().getNombreCompleto() : null)
                .usuarioId(cita.getUsuario() != null ? cita.getUsuario().getId() : null)
                .usuarioNombre(cita.getUsuario() != null ? cita.getUsuario().getNombre() : null)
                .tipoCitaNombre(cita.getTipoCita() != null ? cita.getTipoCita().getNombre() : null)
                .fecha(cita.getFecha())
                .hora(cita.getHora())
                .prioridad(cita.getPrioridad())
                .duracionMinutos(cita.getDuracionMinutos())
                .motivo(cita.getMotivo())
                .estado(cita.getEstado())
                .tratamientoId(cita.getTratamientoId())
                .build();
    }

    private boolean mismoClinica(Cita cita, Long clinicaId) {
        if (clinicaId == null) return true;
        return cita.getPaciente() != null && clinicaId.equals(cita.getPaciente().getClinicaId());
    }

    private long contarTotal(Long clinicaId) {
        return tratamientoRepository.findByClinicaId(clinicaId, org.springframework.data.domain.PageRequest.of(0, 1))
                .getTotalElements();
    }

}
