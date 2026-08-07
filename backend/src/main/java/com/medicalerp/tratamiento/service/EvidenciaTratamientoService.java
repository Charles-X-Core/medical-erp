package com.medicalerp.tratamiento.service;

import com.medicalerp.common.exception.ResourceNotFoundException;
import com.medicalerp.tratamiento.dto.EvidenciaTratamientoResponse;
import com.medicalerp.tratamiento.entity.EvidenciaTratamiento;
import com.medicalerp.tratamiento.entity.SesionTratamiento;
import com.medicalerp.tratamiento.entity.Tratamiento;
import com.medicalerp.tratamiento.enums.TipoEvidencia;
import com.medicalerp.tratamiento.mapper.EvidenciaTratamientoMapper;
import com.medicalerp.tratamiento.repository.EvidenciaTratamientoRepository;
import com.medicalerp.tratamiento.repository.SesionTratamientoRepository;
import com.medicalerp.tratamiento.repository.TratamientoRepository;
import com.medicalerp.storage.StoragePathBuilder;
import com.medicalerp.storage.StorageStrategy;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;

/**
 * EvidenciaTratamiento Service (DOM-TRAT-004)
 * Gestion de evidencias (batch upload)
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EvidenciaTratamientoService {

    private final EvidenciaTratamientoRepository repository;
    private final SesionTratamientoRepository sesionRepository;
    private final TratamientoRepository tratamientoRepository;
    private final EvidenciaTratamientoMapper mapper;
    private final StorageStrategy storageStrategy;
    private final StoragePathBuilder pathBuilder;

    @Transactional
    public List<EvidenciaTratamientoResponse> subirBatch(Long sesionId, TipoEvidencia tipo,
                                                           String descripcion, MultipartFile[] files) {
        SesionTratamiento sesion = sesionRepository.findById(sesionId)
                .orElseThrow(() -> new ResourceNotFoundException("SesionTratamiento", sesionId));

        Tratamiento tratamiento = tratamientoRepository.findById(sesion.getTratamientoId())
                .orElseThrow(() -> new ResourceNotFoundException("Tratamiento", sesion.getTratamientoId()));

        String basePath = pathBuilder.buildEvidenciaPath(
                sesion.getClinicaId(),
                tratamiento.getPacienteId(),
                sesion.getTratamientoId(),
                sesion.getNumeroSesion()
        );

        List<EvidenciaTratamientoResponse> evidencias = new ArrayList<>();

        for (MultipartFile file : files) {
            String ruta = storageStrategy.store(file, basePath);

            EvidenciaTratamiento evidencia = EvidenciaTratamiento.builder()
                    .sesionId(sesionId)
                    .clinicaId(sesion.getClinicaId())
                    .tipo(tipo)
                    .archivoRuta(ruta)
                    .archivoNombre(file.getOriginalFilename())
                    .archivoMimeType(storageStrategy.getMimeType(file.getOriginalFilename()))
                    .archivoTamano(file.getSize())
                    .descripcion(descripcion)
                    .build();

            EvidenciaTratamiento saved = repository.save(evidencia);
            evidencias.add(mapper.toResponse(saved));
        }

        return evidencias;
    }

    public List<EvidenciaTratamientoResponse> findBySesionId(Long sesionId) {
        return repository.findBySesionId(sesionId)
                .stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Transactional
    public void eliminar(Long id) {
        EvidenciaTratamiento evidencia = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("EvidenciaTratamiento", id));
        storageStrategy.delete(evidencia.getArchivoRuta());
        repository.delete(evidencia);
    }

}
