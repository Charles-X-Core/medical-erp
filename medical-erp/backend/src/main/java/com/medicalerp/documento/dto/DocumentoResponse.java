package com.medicalerp.documento.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Documento Response DTO (DOM-DOC-001)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentoResponse {

    private Long id;
    private Long pacienteId;
    private String pacienteNombre;
    private Long citaId;
    private Long consultaId;
    private Long usuarioId;
    private String usuarioNombre;
    private String tipo;
    private String titulo;
    private String archivoRuta;
    private String archivoNombre;
    private String hashSha256;
    private Boolean firmado;
    private Instant firmadoAt;
    private String estado;
    private Instant createdAt;
    private Instant updatedAt;

}
