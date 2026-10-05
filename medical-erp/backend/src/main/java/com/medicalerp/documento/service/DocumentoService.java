package com.medicalerp.documento.service;

import com.medicalerp.common.exception.BusinessRuleException;
import com.medicalerp.common.exception.ResourceNotFoundException;
import com.medicalerp.common.util.Auditable;
import com.medicalerp.common.util.SecurityUtils;
import com.medicalerp.documento.dto.DocumentoRequest;
import com.medicalerp.documento.dto.DocumentoResponse;
import com.medicalerp.documento.entity.Documento;
import com.medicalerp.documento.mapper.DocumentoMapper;
import com.medicalerp.documento.repository.DocumentoRepository;
import com.medicalerp.paciente.entity.Paciente;
import com.medicalerp.paciente.repository.PacienteRepository;
import com.medicalerp.seguridad.entity.Usuario;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.file.Path;
import java.time.Instant;

/**
 * Documento Service (DOM-DOC-001)
 * Handles document creation, signing, PDF generation, and archiving
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DocumentoService {

    private final DocumentoRepository documentoRepository;
    private final PacienteRepository pacienteRepository;
    private final DocumentoMapper documentoMapper;
    private final PdfGeneratorService pdfGeneratorService;
    private final SecurityUtils securityUtils;

    @Value("${app.upload.dir:./uploads}")
    private String uploadDir;

    /**
     * Create document
     * If firmaImagen is present: auto-generate PDF, set state to "firmado"
     * If no firmaImagen: state = "borrador"
     */
    @Transactional
    @Auditable
    public DocumentoResponse create(DocumentoRequest request, Usuario usuario) {
        Paciente paciente = pacienteRepository.findById(request.getPacienteId())
                .orElseThrow(() -> new ResourceNotFoundException("Paciente", request.getPacienteId()));

        Documento documento = documentoMapper.toEntity(request);
        documento.setPaciente(paciente);
        documento.setUsuario(usuario);

        // Set filename if not provided
        if (documento.getArchivoNombre() == null || documento.getArchivoNombre().isBlank()) {
            documento.setArchivoNombre(documento.getTipo() + "_" + System.currentTimeMillis() + ".pdf");
        }

        // Check if signature is present from PWA
        if (request.getFirmaImagen() != null && !request.getFirmaImagen().isBlank()) {
            // Save as borrador first to get ID
            documento.setEstado("borrador");
            documento.setArchivoRuta("pending"); // placeholder
            Documento saved = documentoRepository.save(documento);

            // Now generate PDF with the ID
            try {
                String relativePath = pdfGeneratorService.generatePdf(saved);
                saved.setArchivoRuta(relativePath);

                // Calculate SHA256
                Path fullPath = pdfGeneratorService.getPdfFullPath(relativePath);
                String hash = pdfGeneratorService.calculateSha256(fullPath);
                saved.setHashSha256(hash);

                // Set as signed/firmado (auto-archived per user's request)
                saved.setFirmaImagen(request.getFirmaImagen());
                saved.setFirmado(true);
                saved.setFirmadoAt(Instant.now());
                saved.setEstado("firmado");

                Documento finalDoc = documentoRepository.save(saved);
                log.info("Documento firmado y PDF generado: id={}, hash={}", finalDoc.getId(), hash);
                return documentoMapper.toResponse(finalDoc);

            } catch (Exception e) {
                log.error("Error generating PDF for document {}: {}", saved.getId(), e.getMessage(), e);
                throw new BusinessRuleException("PDF_GENERATION_ERROR",
                        "Error al generar el PDF del documento: " + e.getMessage());
            }
        } else {
            // No signature - create as borrador (draft)
            documento.setEstado("borrador");
            documento.setArchivoRuta("N/A");
            Documento saved = documentoRepository.save(documento);
            return documentoMapper.toResponse(saved);
        }
    }

    public DocumentoResponse getById(Long id) {
        Documento documento = documentoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Documento", id));
        return documentoMapper.toResponse(documento);
    }

    public Page<DocumentoResponse> getByPaciente(Long pacienteId, String tipo, Pageable pageable) {
        Page<Documento> page;
        if (tipo != null && !tipo.isBlank()) {
            page = documentoRepository.findByPacienteIdAndTipo(pacienteId, tipo, pageable);
        } else {
            page = documentoRepository.findByPacienteId(pacienteId, pageable);
        }
        return page.map(documentoMapper::toResponse);
    }

    /**
     * Sign an existing borrador document
     * Used when PWA sends signature later
     */
    @Transactional
    @Auditable
    public DocumentoResponse firmar(Long id, String firmaImagenBase64, Usuario usuario) {
        Documento documento = documentoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Documento", id));

        if (!"borrador".equals(documento.getEstado())) {
            throw new BusinessRuleException("VR-DOC-002",
                    "Solo se pueden firmar documentos en estado borrador. Estado actual: " + documento.getEstado());
        }

        // Verify ownership (only creator or admin can sign)
        Long currentUserId = securityUtils.getCurrentUserId();
        if (currentUserId != null && !currentUserId.equals(documento.getUsuario().getId()) && !securityUtils.isAdmin()) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "Solo el creador del documento o admin pueden firmarlo");
        }

        documento.setFirmaImagen(firmaImagenBase64);
        documento.setFirmado(true);
        documento.setFirmadoAt(Instant.now());

        // Generate PDF with signature
        try {
            String relativePath = pdfGeneratorService.generatePdf(documento);
            documento.setArchivoRuta(relativePath);

            Path fullPath = pdfGeneratorService.getPdfFullPath(relativePath);
            String hash = pdfGeneratorService.calculateSha256(fullPath);
            documento.setHashSha256(hash);

            documento.setEstado("firmado");

            Documento saved = documentoRepository.save(documento);
            log.info("Documento firmado exitosamente: id={}", saved.getId());
            return documentoMapper.toResponse(saved);

        } catch (Exception e) {
            log.error("Error generating PDF for document {}: {}", documento.getId(), e.getMessage(), e);
            throw new BusinessRuleException("PDF_GENERATION_ERROR",
                    "Error al generar el PDF del documento: " + e.getMessage());
        }
    }

    /**
     * Get PDF file path for download
     */
    public Path getPdfPath(Long id) {
        Documento documento = documentoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Documento", id));

        if (!"firmado".equals(documento.getEstado())) {
            throw new BusinessRuleException("PDF_NOT_GENERATED",
                    "El PDF solo esta disponible para documentos firmados");
        }

        return pdfGeneratorService.getPdfFullPath(documento.getArchivoRuta());
    }

    @Transactional
    @Auditable
    public void delete(Long id) {
        Documento documento = documentoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Documento", id));

        // Only admin or document creator can delete
        Long currentUserId = securityUtils.getCurrentUserId();
        if (currentUserId != null && !currentUserId.equals(documento.getUsuario().getId()) && !securityUtils.isAdmin()) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "Solo el creador o admin pueden eliminar documentos");
        }

        // Per domain: documents are archived, not deleted. Set to "archivado" if firmado
        if ("firmado".equals(documento.getEstado())) {
            documento.setEstado("archivado");
            documentoRepository.save(documento);
        } else {
            // Borrador can be physically deleted
            documentoRepository.delete(documento);
        }
    }

}
