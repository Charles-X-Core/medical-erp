package com.medicalerp.seguridad.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Set;

/**
 * User Response DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UsuarioResponse {

    private Long id;
    private String nombre;
    private String email;
    private Boolean activo;
    private Set<String> roles;
    private Long clinicaId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

}
