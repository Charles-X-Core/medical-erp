package com.medicalerp.paciente.service.consentimiento;

import com.medicalerp.common.exception.BusinessRuleException;
import com.medicalerp.common.exception.ResourceNotFoundException;
import com.medicalerp.common.util.SecurityUtils;
import com.medicalerp.paciente.dto.consentimiento.ConsentTemplateRequest;
import com.medicalerp.paciente.dto.consentimiento.ConsentTemplateResponse;
import com.medicalerp.paciente.entity.consentimiento.ConsentTemplate;
import com.medicalerp.paciente.mapper.consentimiento.ConsentTemplateMapper;
import com.medicalerp.paciente.repository.consentimiento.ConsentTemplateRepository;
import com.medicalerp.storage.StoragePathBuilder;
import com.medicalerp.storage.StorageStrategy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.file.Path;
import java.time.Instant;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ConsentTemplateService {

    private final ConsentTemplateRepository templateRepository;
    private final ConsentTemplateMapper templateMapper;
    private final StorageStrategy storageStrategy;
    private final StoragePathBuilder pathBuilder;
    private final SecurityUtils securityUtils;

    @Transactional
    public ConsentTemplateResponse create(ConsentTemplateRequest request) {
        Long clinicaId = securityUtils.getCurrentClinicaId();
        securityUtils.validateClinicaAccessOnWrite(clinicaId);

        if (templateRepository.existsByClinicaIdAndCodigoAndVersion(
                clinicaId, request.getCodigo(), request.getVersion())) {
            throw new BusinessRuleException("VR-CON-009",
                    "Ya existe un template con codigo '" + request.getCodigo() +
                    "' y version '" + request.getVersion() + "' en esta clinica");
        }

        String basePath = pathBuilder.buildTemplatePath(clinicaId);
        String storagePath = storageStrategy.store(request.getArchivoTemplate(), basePath);

        ConsentTemplate template = templateMapper.toEntity(request);
        template.setClinicaId(clinicaId);
        template.setStoragePath(storagePath);
        template.setMimeType(storageStrategy.getMimeType(
                request.getArchivoTemplate().getOriginalFilename()));
        template.setActivo(true);

        ConsentTemplate saved = templateRepository.save(template);
        log.info("Template de consentimiento creado: id={}, codigo={}, version={}",
                saved.getId(), saved.getCodigo(), saved.getVersion());
        return templateMapper.toResponse(saved);
    }

    @Transactional
    public ConsentTemplateResponse update(Long id, ConsentTemplateRequest request) {
        Long clinicaId = securityUtils.getCurrentClinicaId();
        securityUtils.validateClinicaAccessOnWrite(clinicaId);

        ConsentTemplate template = templateRepository.findByIdAndClinicaId(id, clinicaId)
                .orElseThrow(() -> new ResourceNotFoundException("ConsentTemplate", id));

        templateMapper.updateEntity(template, request);

        if (request.getArchivoTemplate() != null && !request.getArchivoTemplate().isEmpty()) {
            storageStrategy.delete(template.getStoragePath());
            String basePath = pathBuilder.buildTemplatePath(clinicaId);
            String newStoragePath = storageStrategy.store(request.getArchivoTemplate(), basePath);
            template.setStoragePath(newStoragePath);
            template.setMimeType(storageStrategy.getMimeType(
                    request.getArchivoTemplate().getOriginalFilename()));
        }

        ConsentTemplate saved = templateRepository.save(template);
        log.info("Template de consentimiento actualizado: id={}", saved.getId());
        return templateMapper.toResponse(saved);
    }

    @Transactional
    public void delete(Long id) {
        Long clinicaId = securityUtils.getCurrentClinicaId();
        securityUtils.validateClinicaAccessOnWrite(clinicaId);

        ConsentTemplate template = templateRepository.findByIdAndClinicaId(id, clinicaId)
                .orElseThrow(() -> new ResourceNotFoundException("ConsentTemplate", id));

        template.setDeletedAt(Instant.now());
        templateRepository.save(template);
        log.info("Template de consentimiento eliminado: id={}", id);
    }

    public List<ConsentTemplateResponse> getByClinica() {
        Long clinicaId = securityUtils.getCurrentClinicaId();
        return templateRepository.findByClinicaIdAndActivoTrue(clinicaId)
                .stream()
                .map(templateMapper::toResponse)
                .toList();
    }

    public ConsentTemplateResponse getById(Long id) {
        Long clinicaId = securityUtils.getCurrentClinicaId();
        ConsentTemplate template = templateRepository.findByIdAndClinicaId(id, clinicaId)
                .orElseThrow(() -> new ResourceNotFoundException("ConsentTemplate", id));
        return templateMapper.toResponse(template);
    }

    public String loadTemplateContent(Long templateId) {
        Long clinicaId = securityUtils.getCurrentClinicaId();
        ConsentTemplate template = templateRepository.findByIdAndClinicaId(templateId, clinicaId)
                .orElseThrow(() -> new ResourceNotFoundException("ConsentTemplate", templateId));

        byte[] content = storageStrategy.load(template.getStoragePath());
        return new String(content);
    }

    public Path getTemplateFilePath(Long templateId) {
        Long clinicaId = securityUtils.getCurrentClinicaId();
        ConsentTemplate template = templateRepository.findByIdAndClinicaId(templateId, clinicaId)
                .orElseThrow(() -> new ResourceNotFoundException("ConsentTemplate", templateId));

        return pathBuilder.getFullTemplatePath(template.getStoragePath());
    }
}
