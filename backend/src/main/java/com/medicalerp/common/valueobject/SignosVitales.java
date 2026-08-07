package com.medicalerp.common.valueobject;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Representa las mediciones clinicas obtenidas
 * durante una atencion medica.
 *
 * Se utiliza tanto en:
 * - Consulta
 * - Sesion de Tratamiento
 *
 * Es un Value Object.
 *
 * No pertenece al Paciente.
 * No representa informacion permanente.
 * No posee identidad propia.
 * No debe persistirse como entidad independiente.
 *
 * Futuras extensiones:
 * - calcularIMC()
 * - tieneHipertension()
 * - esObesidad()
 * - pesoValido()
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SignosVitales {

    private String presionArterial;
    private Integer pulso;
    private Double temperatura;
    private Double peso;
    private Integer talla;
    private Integer saturacion;
    private Integer frecuenciaRespiratoria;

}
