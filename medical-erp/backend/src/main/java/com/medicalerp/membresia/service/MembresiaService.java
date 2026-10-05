package com.medicalerp.membresia.service;

import com.medicalerp.common.exception.ResourceNotFoundException;
import com.medicalerp.common.util.BusinessTime;
import com.medicalerp.membresia.dto.MembresiaRequest;
import com.medicalerp.membresia.dto.MembresiaResponse;
import com.medicalerp.membresia.entity.Membresia;
import com.medicalerp.membresia.repository.MembresiaRepository;
import com.medicalerp.paciente.entity.Paciente;
import com.medicalerp.paciente.repository.PacienteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MembresiaService {

    private final MembresiaRepository membresiaRepository;
    private final PacienteRepository pacienteRepository;

    public List<MembresiaResponse> getByPacienteId(Long pacienteId, Long clinicaId) {
        return membresiaRepository.findByPacienteIdAndClinicaIdOrderByFechaInicioDesc(pacienteId, clinicaId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public MembresiaResponse create(MembresiaRequest request, Long clinicaId) {
        Paciente paciente = pacienteRepository.findById(request.getPacienteId())
                .orElseThrow(() -> new ResourceNotFoundException("Paciente", request.getPacienteId()));

        if (request.getFechaFin() != null && request.getFechaFin().isBefore(request.getFechaInicio())) {
            throw new IllegalArgumentException("La fecha de fin no puede ser anterior a la fecha de inicio");
        }

        Membresia membresia = Membresia.builder()
                .clinicaId(clinicaId)
                .paciente(paciente)
                .tipo(request.getTipo())
                .fechaInicio(request.getFechaInicio())
                .fechaFin(request.getFechaFin())
                .estado("activa")
                .build();

        return toResponse(membresiaRepository.save(membresia));
    }

    @Transactional
    public MembresiaResponse update(Long id, MembresiaRequest request, Long clinicaId) {
        Membresia membresia = membresiaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Membresia", id));

        if (request.getFechaFin() != null && request.getFechaFin().isBefore(request.getFechaInicio())) {
            throw new IllegalArgumentException("La fecha de fin no puede ser anterior a la fecha de inicio");
        }

        membresia.setTipo(request.getTipo());
        membresia.setFechaInicio(request.getFechaInicio());
        membresia.setFechaFin(request.getFechaFin());

        if (request.getFechaFin() != null && request.getFechaFin().isBefore(LocalDate.now(BusinessTime.ZONE))) {
            membresia.setEstado("vencida");
        }

        return toResponse(membresiaRepository.save(membresia));
    }

    @Transactional
    public void delete(Long id) {
        if (!membresiaRepository.existsById(id)) {
            throw new ResourceNotFoundException("Membresia", id);
        }
        membresiaRepository.deleteById(id);
    }

    private MembresiaResponse toResponse(Membresia m) {
        boolean vigente = m.getEstado().equals("activa") &&
                (m.getFechaFin() == null || !m.getFechaFin().isBefore(LocalDate.now(BusinessTime.ZONE)));
        return MembresiaResponse.builder()
                .id(m.getId())
                .pacienteId(m.getPaciente().getId())
                .pacienteNombre(m.getPaciente().getNombreCompleto())
                .clinicaId(m.getClinicaId())
                .tipo(m.getTipo())
                .fechaInicio(m.getFechaInicio())
                .fechaFin(m.getFechaFin())
                .estado(m.getEstado())
                .vigente(vigente)
                .createdAt(m.getCreatedAt())
                .updatedAt(m.getUpdatedAt())
                .build();
    }
}
