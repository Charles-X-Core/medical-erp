package com.medicalerp.consulta.controller;

import com.medicalerp.common.dto.ApiResponse;
import com.medicalerp.consulta.dto.ConsultaRequest;
import com.medicalerp.consulta.dto.ConsultaResponse;
import com.medicalerp.consulta.service.ConsultaService;
import com.medicalerp.paciente.entity.Paciente;
import com.medicalerp.paciente.repository.PacienteRepository;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Consulta Controller (API-002)
 */
@RestController
@RequestMapping("/api/v1/consultas")
@RequiredArgsConstructor
public class ConsultaController {

    private final ConsultaService consultaService;
    private final PacienteRepository pacienteRepository;

    @PostMapping
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ConsultaResponse>> create(@Valid @RequestBody ConsultaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(consultaService.create(request), "Consulta creada exitosamente"));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ConsultaResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(consultaService.getById(id)));
    }

    @GetMapping("/historia/{historiaId}")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Page<ConsultaResponse>>> getByHistoria(
            @PathVariable Long historiaId,
            Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(consultaService.getByHistoria(historiaId, pageable)));
    }

    @GetMapping("/paciente/{pacienteId}")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<ConsultaResponse>>> getByPacienteId(@PathVariable Long pacienteId) {
        return ResponseEntity.ok(ApiResponse.success(consultaService.getByPacienteId(pacienteId)));
    }

    @GetMapping("/{id}/pdf")
    public ResponseEntity<ByteArrayResource> downloadPdf(@PathVariable Long id) {
        try {
            ConsultaResponse consulta = consultaService.getById(id);
            Paciente paciente = pacienteRepository.findById(consulta.getPacienteId()).orElse(null);

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdfDoc = new PdfDocument(writer);
            Document document = new Document(pdfDoc);

            // Header
            document.add(new Paragraph("OPTIMAL HEALTH NOW")
                    .setTextAlignment(TextAlignment.CENTER)
                    .setBold()
                    .setFontSize(18));
            document.add(new Paragraph("Historia Clinica")
                    .setTextAlignment(TextAlignment.CENTER)
                    .setFontSize(12));
            document.add(new Paragraph(" "));

            // Patient info
            if (paciente != null) {
                document.add(new Paragraph("DATOS DEL PACIENTE").setBold().setFontSize(12));
                Table patientTable = new Table(UnitValue.createPercentArray(new float[]{30, 70})).useAllAvailableWidth();
                patientTable.addCell(new Paragraph("Nombre:").setBold());
                patientTable.addCell(new Paragraph(paciente.getNombres() + " " + paciente.getApellidoPaterno()));
                patientTable.addCell(new Paragraph("ID:").setBold());
                patientTable.addCell(new Paragraph(paciente.getLicenciaConducir() != null ? paciente.getLicenciaConducir() : "N/A"));
                patientTable.addCell(new Paragraph("Fecha:").setBold());
                patientTable.addCell(new Paragraph(consulta.getFecha() != null ? consulta.getFecha().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")) : "N/A"));
                document.add(patientTable);
                document.add(new Paragraph(" "));
            }

            // Consultation details
            document.add(new Paragraph("DETALLE DE CONSULTA").setBold().setFontSize(12));
            Table detailTable = new Table(UnitValue.createPercentArray(new float[]{30, 70})).useAllAvailableWidth();
            detailTable.addCell(new Paragraph("Motivo:").setBold());
            detailTable.addCell(new Paragraph(consulta.getMotivo() != null ? consulta.getMotivo() : "N/A"));
            detailTable.addCell(new Paragraph("Diagnostico:").setBold());
            String diagText = "N/A";
            if (consulta.getDiagnosticoLista() != null && !consulta.getDiagnosticoLista().isEmpty()) {
                diagText = consulta.getDiagnosticoLista().stream()
                        .map(d -> d.getDescripcion())
                        .reduce((a, b) -> a + "; " + b)
                        .orElse("N/A");
            }
            detailTable.addCell(new Paragraph(diagText));
            if (consulta.getTiempoEnfermedad() != null) {
                detailTable.addCell(new Paragraph("Tiempo Enfermedad:").setBold());
                detailTable.addCell(new Paragraph(consulta.getTiempoEnfermedad()));
            }
            if (consulta.getSignosSintomas() != null) {
                detailTable.addCell(new Paragraph("Signos/Sintomas:").setBold());
                detailTable.addCell(new Paragraph(consulta.getSignosSintomas()));
            }
            document.add(detailTable);
            document.add(new Paragraph(" "));

            // Vital signs
            if (consulta.getSignosVitales() != null) {
                document.add(new Paragraph("SIGNOS VITALES").setBold().setFontSize(12));
                Table vitalsTable = new Table(UnitValue.createPercentArray(new float[]{25, 25, 25, 25})).useAllAvailableWidth();
                if (consulta.getSignosVitales().getPeso() != null) {
                    vitalsTable.addCell(new Paragraph("Peso: " + consulta.getSignosVitales().getPeso() + " kg").setFontSize(10));
                }
                if (consulta.getSignosVitales().getTalla() != null) {
                    vitalsTable.addCell(new Paragraph("Talla: " + consulta.getSignosVitales().getTalla() + " cm").setFontSize(10));
                }
                if (consulta.getSignosVitales().getPresionArterial() != null) {
                    vitalsTable.addCell(new Paragraph("PA: " + consulta.getSignosVitales().getPresionArterial()).setFontSize(10));
                }
                if (consulta.getSignosVitales().getPulso() != null) {
                    vitalsTable.addCell(new Paragraph("Pulso: " + consulta.getSignosVitales().getPulso()).setFontSize(10));
                }
                document.add(vitalsTable);
                document.add(new Paragraph(" "));
            }

            // Footer
            document.add(new Paragraph(" "));
            document.add(new Paragraph("Documento generado electronicamente - Optimal Health NOW")
                    .setTextAlignment(TextAlignment.CENTER)
                    .setFontSize(8)
                    .setItalic());

            document.close();

            ByteArrayResource resource = new ByteArrayResource(baos.toByteArray());
            String filename = "consulta_" + id + ".pdf";

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                    .contentType(MediaType.APPLICATION_PDF)
                    .contentLength(baos.size())
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ConsultaResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody ConsultaRequest request) {
        return ResponseEntity.ok(ApiResponse.success(consultaService.update(id, request), "Consulta actualizada"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        consultaService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/firmar")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ConsultaResponse>> firmar(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(consultaService.firmar(id), "Consulta firmada"));
    }

}
