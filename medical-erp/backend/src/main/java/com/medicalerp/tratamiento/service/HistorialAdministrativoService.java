package com.medicalerp.tratamiento.service;

import com.medicalerp.tratamiento.dto.HistorialAdministrativoResponse;
import com.medicalerp.tratamiento.entity.HistorialAdministrativo;
import com.medicalerp.tratamiento.enums.TipoCambioAdministrativo;
import com.medicalerp.tratamiento.mapper.HistorialAdministrativoMapper;
import com.medicalerp.tratamiento.repository.HistorialAdministrativoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * HistorialAdministrativo Service (DOM-TRAT-007)
 * Registro de cambios administrativos en tratamientos
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class HistorialAdministrativoService {

    private final HistorialAdministrativoRepository repository;
    private final HistorialAdministrativoMapper mapper;

    @Transactional
    public void registrar(Long tratamientoId, Long clinicaId, TipoCambioAdministrativo tipo,
                          String campo, String anterior, String nuevo, String motivo, Long usuarioId) {
        HistorialAdministrativo historial = HistorialAdministrativo.builder()
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

    public List<HistorialAdministrativoResponse> findByTratamientoId(Long tratamientoId) {
        return repository.findByTratamientoIdOrderByCreatedAtDesc(tratamientoId)
                .stream()
                .map(mapper::toResponse)
                .toList();
    }

}
