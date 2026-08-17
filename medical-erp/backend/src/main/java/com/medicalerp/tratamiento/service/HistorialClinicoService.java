package com.medicalerp.tratamiento.service;

import com.medicalerp.tratamiento.dto.HistorialClinicoResponse;
import com.medicalerp.tratamiento.entity.HistorialClinico;
import com.medicalerp.tratamiento.enums.TipoCambioClinico;
import com.medicalerp.tratamiento.mapper.HistorialClinicoMapper;
import com.medicalerp.tratamiento.repository.HistorialClinicoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * HistorialClinico Service (DOM-TRAT-006)
 * Registro de cambios clinicos en tratamientos
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class HistorialClinicoService {

    private final HistorialClinicoRepository repository;
    private final HistorialClinicoMapper mapper;

    @Transactional
    public void registrar(Long tratamientoId, Long clinicaId, TipoCambioClinico tipo,
                          String campo, String anterior, String nuevo, String motivo, Long usuarioId) {
        HistorialClinico historial = HistorialClinico.builder()
                .tratamientoId(tratamientoId)
                .clinicaId(clinicaId)
                .tipoCambio(tipo)
                .campoModificado(campo)
                .valorAnterior(anterior)
                .valorNuevo(nuevo)
                .motivo(motivo)
                .usuarioId(usuarioId)
                .build();
        repository.save(historial);
    }

    public List<HistorialClinicoResponse> findByTratamientoId(Long tratamientoId) {
        return repository.findByTratamientoIdOrderByCreatedAtDesc(tratamientoId)
                .stream()
                .map(mapper::toResponse)
                .toList();
    }

}
