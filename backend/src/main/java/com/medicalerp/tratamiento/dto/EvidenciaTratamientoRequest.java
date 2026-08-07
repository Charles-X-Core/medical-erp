package com.medicalerp.tratamiento.dto;

import com.medicalerp.tratamiento.enums.TipoEvidencia;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.web.multipart.MultipartFile;

/**
 * Evidencia Tratamiento Request DTO (DOM-TRAT-004)
 * Para batch upload via multipart/form-data
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EvidenciaTratamientoRequest {

    @NotNull(message = "El tipo de evidencia es requerido")
    private TipoEvidencia tipo;

    private String descripcion;

    private MultipartFile[] files;

}
