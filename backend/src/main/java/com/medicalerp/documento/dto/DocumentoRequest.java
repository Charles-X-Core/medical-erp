package com.medicalerp.documento.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Documento Request DTO (DOM-DOC-001)
 * PWA sends: patient ID, signature base64, document type
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentoRequest {

    @NotNull(message = "El paciente es obligatorio")
    private Long pacienteId;

    private Long citaId;

    private Long consultaId;

    @NotBlank(message = "El tipo es obligatorio")
    private String tipo;

    @NotBlank(message = "El titulo es obligatorio")
    private String titulo;

    private String archivoNombre;

    /**
     * Signature image from PWA canvas (Base64 encoded)
     * If present, document is auto-signed and PDF is generated
     */
    private String firmaImagen;

}
