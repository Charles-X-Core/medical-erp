package com.medicalerp.tratamiento.service;

import com.medicalerp.common.exception.ResourceNotFoundException;
import com.medicalerp.contacto.service.EmailService;
import com.medicalerp.paciente.entity.Paciente;
import com.medicalerp.paciente.repository.PacienteRepository;
import com.medicalerp.seguridad.entity.Usuario;
import com.medicalerp.seguridad.repository.UsuarioRepository;
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
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Path;
import java.util.*;
import java.util.stream.Collectors;

/**
 * EvidenciaTratamiento Service (DOM-TRAT-004)
 * Gestion de evidencias (batch upload, file serving, email)
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EvidenciaTratamientoService {

    private final EvidenciaTratamientoRepository repository;
    private final SesionTratamientoRepository sesionRepository;
    private final TratamientoRepository tratamientoRepository;
    private final PacienteRepository pacienteRepository;
    private final EvidenciaTratamientoMapper mapper;
    private final StorageStrategy storageStrategy;
    private final StoragePathBuilder pathBuilder;
    private final EmailService emailService;

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

    @Transactional
    public List<EvidenciaTratamientoResponse> subirBatchTratamiento(Long tratamientoId, TipoEvidencia tipo,
                                                                    String descripcion, MultipartFile[] files) {
        Tratamiento tratamiento = tratamientoRepository.findById(tratamientoId)
                .orElseThrow(() -> new ResourceNotFoundException("Tratamiento", tratamientoId));

        String basePath = pathBuilder.buildEvidenciaTratamientoPath(
                tratamiento.getClinicaId(),
                tratamiento.getPacienteId(),
                tratamientoId
        );

        List<EvidenciaTratamientoResponse> evidencias = new ArrayList<>();

        for (MultipartFile file : files) {
            String ruta = storageStrategy.store(file, basePath);

            EvidenciaTratamiento evidencia = EvidenciaTratamiento.builder()
                    .tratamientoId(tratamientoId)
                    .clinicaId(tratamiento.getClinicaId())
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

    public EvidenciaTratamientoResponse findById(Long id) {
        EvidenciaTratamiento evidencia = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("EvidenciaTratamiento", id));
        return mapper.toResponse(evidencia);
    }

    public List<EvidenciaTratamientoResponse> findBySesionId(Long sesionId) {
        return repository.findBySesionId(sesionId)
                .stream()
                .map(mapper::toResponse)
                .toList();
    }

    public List<Map<String, Object>> findByPacienteIdGroupedByTratamiento(Long pacienteId) {
        List<Tratamiento> tratamientos = tratamientoRepository.findByPacienteId(pacienteId);
        List<Map<String, Object>> result = new ArrayList<>();

        for (Tratamiento tratamiento : tratamientos) {
            List<SesionTratamiento> sesiones = sesionRepository.findByTratamientoIdOrderByNumeroSesion(tratamiento.getId());
            List<Map<String, Object>> sesionesConEvidencias = new ArrayList<>();

            for (SesionTratamiento sesion : sesiones) {
                List<EvidenciaTratamientoResponse> evidencias = repository.findBySesionId(sesion.getId())
                        .stream()
                        .map(mapper::toResponse)
                        .toList();

                if (!evidencias.isEmpty()) {
                    Map<String, Object> sesionData = new HashMap<>();
                    sesionData.put("sesionId", sesion.getId());
                    sesionData.put("numeroSesion", sesion.getNumeroSesion());
                    sesionData.put("fecha", sesion.getFecha());
                    sesionData.put("evidencias", evidencias);
                    sesionesConEvidencias.add(sesionData);
                }
            }

            // Evidencias globales del tratamiento (foto inicio/fin), sin sesión asociada
            List<EvidenciaTratamientoResponse> evidenciasTratamiento = repository
                    .findByTratamientoIdAndSesionIdIsNull(tratamiento.getId())
                    .stream()
                    .map(mapper::toResponse)
                    .toList();
            if (!evidenciasTratamiento.isEmpty()) {
                Map<String, Object> tratamientoDataGlobal = new HashMap<>();
                tratamientoDataGlobal.put("sesionId", null);
                tratamientoDataGlobal.put("numeroSesion", null);
                tratamientoDataGlobal.put("fecha", null);
                tratamientoDataGlobal.put("esTratamiento", true);
                tratamientoDataGlobal.put("evidencias", evidenciasTratamiento);
                sesionesConEvidencias.add(0, tratamientoDataGlobal);
            }

            if (!sesionesConEvidencias.isEmpty()) {
                Map<String, Object> tratamientoData = new HashMap<>();
                tratamientoData.put("tratamientoId", tratamiento.getId());
                tratamientoData.put("tipoTratamiento", tratamiento.getTipoTratamiento());
                tratamientoData.put("estado", tratamiento.getEstado().name());
                tratamientoData.put("sesiones", sesionesConEvidencias);
                result.add(tratamientoData);
            }
        }

        return result;
    }

    public Path getFilePath(String fileName) {
        return pathBuilder.getFullStoragePath(fileName);
    }

    @Transactional
    public void enviarAPaciente(Long evidenciaId, String asunto, String mensaje) {
        EvidenciaTratamiento evidencia = repository.findById(evidenciaId)
                .orElseThrow(() -> new ResourceNotFoundException("EvidenciaTratamiento", evidenciaId));

        Tratamiento tratamiento;
        if (evidencia.getSesionId() != null) {
            SesionTratamiento sesion = sesionRepository.findById(evidencia.getSesionId()).orElse(null);
            if (sesion == null) {
                throw new ResourceNotFoundException("SesionTratamiento", evidencia.getSesionId());
            }
            tratamiento = tratamientoRepository.findById(sesion.getTratamientoId()).orElse(null);
        } else {
            tratamiento = tratamientoRepository.findById(evidencia.getTratamientoId()).orElse(null);
        }
        if (tratamiento == null) {
            throw new ResourceNotFoundException("Tratamiento",
                    evidencia.getTratamientoId() != null ? evidencia.getTratamientoId() : -1L);
        }

        Paciente paciente = pacienteRepository.findById(tratamiento.getPacienteId())
                .orElseThrow(() -> new ResourceNotFoundException("Paciente", tratamiento.getPacienteId()));

        String email = paciente.getEmail();
        if (email == null || email.isBlank()) {
            throw new ResourceNotFoundException("El paciente no tiene correo electrónico registrado");
        }

        String pacienteNombre = paciente.getNombres() + " " + paciente.getApellidoPaterno();
        String descripcion = evidencia.getDescripcion() != null ? evidencia.getDescripcion() : "Evidencia clínica";

        emailService.sendEvidenciaPaciente(email, pacienteNombre, descripcion, evidencia.getArchivoRuta(), asunto, mensaje);
        log.info("Evidencia {} enviada por email a {}", evidenciaId, email);
    }

    @Transactional
    public void eliminar(Long id) {
        EvidenciaTratamiento evidencia = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("EvidenciaTratamiento", id));
        storageStrategy.delete(evidencia.getArchivoRuta());
        repository.delete(evidencia);
    }

}
