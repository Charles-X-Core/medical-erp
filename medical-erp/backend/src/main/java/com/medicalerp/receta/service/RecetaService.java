package com.medicalerp.receta.service;

import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.medicalerp.common.exception.ResourceNotFoundException;
import com.medicalerp.common.util.BusinessTime;
import com.medicalerp.contacto.service.EmailService;
import com.medicalerp.paciente.entity.Paciente;
import com.medicalerp.paciente.repository.PacienteRepository;
import com.medicalerp.receta.dto.RecetaRequest;
import com.medicalerp.receta.dto.RecetaResponse;
import com.medicalerp.receta.entity.Receta;
import com.medicalerp.receta.repository.RecetaRepository;
import com.medicalerp.storage.StoragePathBuilder;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class RecetaService {

    private final RecetaRepository recetaRepository;
    private final PacienteRepository pacienteRepository;
    private final StoragePathBuilder pathBuilder;
    private final EmailService emailService;

    @Value("${app.upload.dir:./uploads}")
    private String uploadDir;

    @Transactional
    public RecetaResponse create(RecetaRequest request) {
        Receta receta = Receta.builder()
                .clinicaId(request.getClinicaId())
                .pacienteId(request.getPacienteId())
                .tratamientoId(request.getTratamientoId())
                .sesionId(request.getSesionId())
                .consultaId(request.getConsultaId())
                .medicamento(request.getMedicamento())
                .dosis(request.getDosis())
                .frecuencia(request.getFrecuencia())
                .duracion(request.getDuracion())
                .indicaciones(request.getIndicaciones())
                .fecha(request.getFecha() != null ? BusinessTime.toInstant(request.getFecha()) : Instant.now())
                .build();

        // Generate PDF and save
        try {
            byte[] pdfBytes = generateRecetaPdfBytes(receta);
            String pdfPath = saveRecetaPdf(pdfBytes, receta);
            receta.setArchivoRuta(pdfPath);
        } catch (IOException e) {
            log.error("Error generating receta PDF: {}", e.getMessage());
        }

        Receta saved = recetaRepository.save(receta);
        return toResponse(saved);
    }

    public RecetaResponse getById(Long id) {
        Receta receta = recetaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Receta", id));
        return toResponse(receta);
    }

    public List<RecetaResponse> getByPaciente(Long pacienteId) {
        return recetaRepository.findByPacienteIdOrderByFechaDesc(pacienteId)
                .stream().map(this::toResponse).toList();
    }

    public List<RecetaResponse> getBySesion(Long sesionId) {
        return recetaRepository.findBySesionIdOrderByFechaDesc(sesionId)
                .stream().map(this::toResponse).toList();
    }

    public List<RecetaResponse> getByTratamiento(Long tratamientoId) {
        return recetaRepository.findByTratamientoIdOrderByFechaDesc(tratamientoId)
                .stream().map(this::toResponse).toList();
    }

    public ResponseEntity<byte[]> getPdf(Long id) {
        Receta receta = recetaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Receta", id));

        if (receta.getArchivoRuta() != null) {
            Path filePath = Paths.get(uploadDir, receta.getArchivoRuta());
            try {
                byte[] bytes = Files.readAllBytes(filePath);
                ByteArrayResource resource = new ByteArrayResource(bytes);
                return ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"receta_" + id + ".pdf\"")
                        .contentType(MediaType.APPLICATION_PDF)
                        .body(bytes);
            } catch (IOException e) {
                log.error("Error reading receta PDF: {}", e.getMessage());
            }
        }

        // Fallback: generate on the fly
        try {
            byte[] bytes = generateRecetaPdfBytes(receta);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"receta_" + id + ".pdf\"")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(bytes);
        } catch (IOException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @Transactional
    public void enviarPorEmail(Long recetaId, String asunto, String mensaje) {
        Receta receta = recetaRepository.findById(recetaId)
                .orElseThrow(() -> new ResourceNotFoundException("Receta", recetaId));

        Paciente paciente = pacienteRepository.findById(receta.getPacienteId())
                .orElseThrow(() -> new ResourceNotFoundException("Paciente", receta.getPacienteId()));

        String email = paciente.getEmail();
        if (email == null || email.isBlank()) {
            throw new ResourceNotFoundException("El paciente no tiene correo electrónico registrado");
        }

        String pacienteNombre = paciente.getNombres() + " " + paciente.getApellidoPaterno();

        // Ensure PDF exists
        byte[] pdfBytes = null;
        if (receta.getArchivoRuta() != null) {
            Path filePath = Paths.get(uploadDir, receta.getArchivoRuta());
            try {
                pdfBytes = Files.readAllBytes(filePath);
            } catch (IOException e) {
                log.error("Error reading receta PDF for email: {}", e.getMessage());
            }
        }
        if (pdfBytes == null) {
            try {
                pdfBytes = generateRecetaPdfBytes(receta);
            } catch (IOException e) {
                log.error("Error generating receta PDF for email: {}", e.getMessage());
                return;
            }
        }

        String filename = "Receta_" + receta.getMedicamento() + "_" + LocalDateTime.ofInstant(receta.getFecha(), ZoneId.of("America/Los_Angeles")).format(DateTimeFormatter.ofPattern("ddMMyyyy")) + ".pdf";
        emailService.sendRecetaPaciente(email, pacienteNombre, receta.getMedicamento(), asunto, mensaje, pdfBytes, filename);
        log.info("Receta {} enviada por email a {}", recetaId, email);
    }

    private String saveRecetaPdf(byte[] bytes, Receta receta) throws IOException {
        Path dirPath = Paths.get(uploadDir, "recetas", String.valueOf(receta.getClinicaId()));
        if (!Files.exists(dirPath)) Files.createDirectories(dirPath);

        String filename = "receta_" + receta.getId() + "_" + System.currentTimeMillis() + ".pdf";
        Path filePath = dirPath.resolve(filename);

        Files.write(filePath, bytes);

        return "recetas/" + receta.getClinicaId() + "/" + filename;
    }

    private byte[] generateRecetaPdfBytes(Receta receta) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfWriter writer = new PdfWriter(baos);
        PdfDocument pdfDoc = new PdfDocument(writer);
        Document document = new Document(pdfDoc);
        document.setMargins(36, 36, 36, 36);

        DeviceRgb blue = new DeviceRgb(59, 130, 246);
        DeviceRgb lightBlue = new DeviceRgb(239, 246, 255);
        DeviceRgb gray = new DeviceRgb(107, 125, 149);
        DeviceRgb dark = new DeviceRgb(26, 35, 50);

        // Header
        Paragraph header = new Paragraph("OPTIMAL HEALTH NOW")
                .setTextAlignment(TextAlignment.CENTER).setBold().setFontSize(20)
                .setFontColor(blue);
        document.add(header);
        document.add(new Paragraph("Medical Prescription")
                .setTextAlignment(TextAlignment.CENTER).setFontSize(11)
                .setFontColor(gray).setItalic());
        document.add(new Paragraph(" "));

        // Patient info
        Paciente paciente = pacienteRepository.findById(receta.getPacienteId()).orElse(null);
        if (paciente != null) {
            Paragraph patientHeader = new Paragraph("PATIENT").setBold().setFontSize(10)
                    .setFontColor(gray);
            document.add(patientHeader);

            Table patientTable = new Table(UnitValue.createPercentArray(new float[]{30, 70})).useAllAvailableWidth();
            patientTable.setMarginBottom(12);
            Cell labelCell = new Cell().setBorder(null).setPadding(4).setBackgroundColor(lightBlue);
            Cell valueCell = new Cell().setBorder(null).setPadding(4);

            patientTable.addCell(labelCell.add(new Paragraph("Patient").setBold().setFontSize(9).setFontColor(dark)));
            patientTable.addCell(valueCell.add(new Paragraph(paciente.getNombres() + " " + paciente.getApellidoPaterno()).setFontSize(10)));

            patientTable.addCell(new Cell().setBorder(null).setPadding(4).setBackgroundColor(lightBlue)
                    .add(new Paragraph("Date").setBold().setFontSize(9).setFontColor(dark)));
            patientTable.addCell(new Cell().setBorder(null).setPadding(4)
                    .add(new Paragraph(receta.getFecha() != null
                            ? LocalDateTime.ofInstant(receta.getFecha(), ZoneId.of("America/Los_Angeles")).format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")) : "N/A").setFontSize(10)));

            document.add(patientTable);
            document.add(new Paragraph(" "));
        }

        // Prescription detail
        Paragraph rxHeader = new Paragraph("PRESCRIPTION").setBold().setFontSize(10)
                .setFontColor(gray);
        document.add(rxHeader);

        Table detailTable = new Table(UnitValue.createPercentArray(new float[]{30, 70})).useAllAvailableWidth();
        detailTable.setMarginBottom(12);

        addFieldRow(detailTable, "Medication", receta.getMedicamento(), lightBlue, dark);
        if (receta.getDosis() != null && !receta.getDosis().isBlank()) {
            addFieldRow(detailTable, "Dosage", receta.getDosis(), lightBlue, dark);
        }
        if (receta.getFrecuencia() != null && !receta.getFrecuencia().isBlank()) {
            addFieldRow(detailTable, "Frequency", receta.getFrecuencia(), lightBlue, dark);
        }
        if (receta.getDuracion() != null && !receta.getDuracion().isBlank()) {
            addFieldRow(detailTable, "Duration", receta.getDuracion(), lightBlue, dark);
        }
        if (receta.getIndicaciones() != null && !receta.getIndicaciones().isBlank()) {
            addFieldRow(detailTable, "Instructions", receta.getIndicaciones(), lightBlue, dark);
        }
        document.add(detailTable);

        // Footer
        document.add(new Paragraph(" "));
        document.add(new Paragraph("This document was generated electronically — Optimal Health NOW")
                .setTextAlignment(TextAlignment.CENTER).setFontSize(8).setFontColor(gray).setItalic());

        document.close();
        return baos.toByteArray();
    }

    private void addFieldRow(Table table, String label, String value,
                             DeviceRgb bgColor, DeviceRgb textColor) {
        table.addCell(new Cell().setBorder(null).setPadding(4).setBackgroundColor(bgColor)
                .add(new Paragraph(label).setBold().setFontSize(9).setFontColor(textColor)));
        table.addCell(new Cell().setBorder(null).setPadding(4)
                .add(new Paragraph(value).setFontSize(10)));
    }

    private RecetaResponse toResponse(Receta r) {
        return RecetaResponse.builder()
                .id(r.getId())
                .clinicaId(r.getClinicaId())
                .pacienteId(r.getPacienteId())
                .tratamientoId(r.getTratamientoId())
                .sesionId(r.getSesionId())
                .consultaId(r.getConsultaId())
                .medicamento(r.getMedicamento())
                .dosis(r.getDosis())
                .frecuencia(r.getFrecuencia())
                .duracion(r.getDuracion())
                .indicaciones(r.getIndicaciones())
                .fecha(r.getFecha() != null ? LocalDateTime.ofInstant(r.getFecha(), ZoneId.of("America/Los_Angeles")) : null)
                .archivoRuta(r.getArchivoRuta())
                .createdAt(r.getCreatedAt())
                .build();
    }
}
