package com.medicalerp.tarea.service;

import com.medicalerp.common.exception.ResourceNotFoundException;
import com.medicalerp.paciente.entity.Paciente;
import com.medicalerp.paciente.repository.PacienteRepository;
import com.medicalerp.seguridad.entity.Usuario;
import com.medicalerp.seguridad.repository.UsuarioRepository;
import com.medicalerp.tarea.dto.TareaRequest;
import com.medicalerp.tarea.dto.TareaResponse;
import com.medicalerp.tarea.entity.Tarea;
import com.medicalerp.tarea.repository.TareaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TareaService {

    private final TareaRepository tareaRepository;
    private final UsuarioRepository usuarioRepository;
    private final PacienteRepository pacienteRepository;

    public List<TareaResponse> getPendientes(String destinoRol, Long clinicaId) {
        return tareaRepository.findByDestinoRolAndClinicaIdAndEstadoOrderByCreatedAtDesc(destinoRol, clinicaId, "pendiente")
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public long countPendientes(String destinoRol, Long clinicaId) {
        return tareaRepository.countByDestinoRolAndClinicaIdAndEstado(destinoRol, clinicaId, "pendiente");
    }

    @Transactional
    public TareaResponse create(TareaRequest request, Long origenUsuarioId, Long clinicaId) {
        Usuario origen = usuarioRepository.findById(origenUsuarioId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", origenUsuarioId));

        Paciente paciente = null;
        if (request.getPacienteId() != null) {
            paciente = pacienteRepository.findById(request.getPacienteId())
                    .orElseThrow(() -> new ResourceNotFoundException("Paciente", request.getPacienteId()));
        }

        Tarea tarea = Tarea.builder()
                .clinicaId(clinicaId)
                .origenUsuario(origen)
                .destinoRol(request.getDestinoRol())
                .paciente(paciente)
                .tipo(request.getTipo())
                .titulo(request.getTitulo())
                .descripcion(request.getDescripcion())
                .estado("pendiente")
                .build();

        return toResponse(tareaRepository.save(tarea));
    }

    @Transactional
    public TareaResponse updateEstado(Long id, String nuevoEstado) {
        Tarea tarea = tareaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tarea", id));
        tarea.setEstado(nuevoEstado);
        return toResponse(tareaRepository.save(tarea));
    }

    private TareaResponse toResponse(Tarea t) {
        return TareaResponse.builder()
                .id(t.getId())
                .clinicaId(t.getClinicaId())
                .origenUsuarioId(t.getOrigenUsuario().getId())
                .origenUsuarioNombre(t.getOrigenUsuario().getNombre())
                .destinoRol(t.getDestinoRol())
                .pacienteId(t.getPaciente() != null ? t.getPaciente().getId() : null)
                .pacienteNombre(t.getPaciente() != null ? t.getPaciente().getNombreCompleto() : null)
                .tipo(t.getTipo())
                .titulo(t.getTitulo())
                .descripcion(t.getDescripcion())
                .estado(t.getEstado())
                .createdAt(t.getCreatedAt())
                .updatedAt(t.getUpdatedAt())
                .build();
    }
}
