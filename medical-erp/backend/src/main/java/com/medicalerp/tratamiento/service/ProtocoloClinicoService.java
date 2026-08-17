package com.medicalerp.tratamiento.service;

import com.medicalerp.common.exception.ResourceNotFoundException;
import com.medicalerp.tratamiento.dto.ProtocoloClinicoRequest;
import com.medicalerp.tratamiento.dto.ProtocoloClinicoResponse;
import com.medicalerp.tratamiento.entity.ProtocoloClinico;
import com.medicalerp.tratamiento.mapper.ProtocoloClinicoMapper;
import com.medicalerp.tratamiento.repository.ProtocoloClinicoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * ProtocoloClinico Service (DOM-TRAT-002)
 * Protocolo clinico asociado a un tratamiento
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProtocoloClinicoService {

    private final ProtocoloClinicoRepository repository;
    private final ProtocoloClinicoMapper mapper;

    @Transactional
    public ProtocoloClinico crear(Long tratamientoId, Long clinicaId, ProtocoloClinicoRequest request) {
        ProtocoloClinico protocolo = mapper.toEntity(request);
        protocolo.setTratamientoId(tratamientoId);
        protocolo.setClinicaId(clinicaId);
        return repository.save(protocolo);
    }

    @Transactional
    public ProtocoloClinico actualizar(Long tratamientoId, ProtocoloClinicoRequest request) {
        ProtocoloClinico protocolo = repository.findByTratamientoId(tratamientoId)
                .orElseThrow(() -> new ResourceNotFoundException("ProtocoloClinico para tratamiento", tratamientoId));
        mapper.updateEntity(protocolo, request);
        return repository.save(protocolo);
    }

    public ProtocoloClinico findByTratamientoId(Long tratamientoId) {
        return repository.findByTratamientoId(tratamientoId)
                .orElseThrow(() -> new ResourceNotFoundException("ProtocoloClinico para tratamiento", tratamientoId));
    }

    public ProtocoloClinicoResponse toResponse(ProtocoloClinico entity) {
        return mapper.toResponse(entity);
    }

}
