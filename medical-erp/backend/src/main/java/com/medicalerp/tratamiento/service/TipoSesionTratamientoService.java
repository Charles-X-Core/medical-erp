package com.medicalerp.tratamiento.service;

import com.medicalerp.tratamiento.dto.TipoSesionTratamientoResponse;
import com.medicalerp.tratamiento.entity.TipoSesionTratamiento;
import com.medicalerp.tratamiento.mapper.TipoSesionTratamientoMapper;
import com.medicalerp.tratamiento.repository.TipoSesionTratamientoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * TipoSesionTratamiento Service (DOM-TRAT-005)
 * Catalogo de tipos de sesion de tratamiento
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TipoSesionTratamientoService {

    private final TipoSesionTratamientoRepository repository;
    private final TipoSesionTratamientoMapper mapper;

    public List<TipoSesionTratamientoResponse> findAllByClinica(Long clinicaId) {
        return repository.findByClinicaIdAndActivoTrueOrderByOrden(clinicaId)
                .stream()
                .map(mapper::toResponse)
                .toList();
    }

    public TipoSesionTratamiento findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new com.medicalerp.common.exception.ResourceNotFoundException("TipoSesionTratamiento", id));
    }

}
