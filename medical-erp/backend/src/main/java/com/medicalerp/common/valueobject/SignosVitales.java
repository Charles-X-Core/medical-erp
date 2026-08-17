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

    /**
     * Calcula el Indice de Masa Corporal (IMC).
     * IMC = peso (kg) / (talla (cm) / 100)^2
     * @return IMC redondeado a 1 decimal, o null si faltan datos.
     */
    public Double calcularIMC() {
        if (peso == null || talla == null || talla <= 0) return null;
        double tallaM = talla / 100.0;
        return Math.round((peso / (tallaM * tallaM)) * 10.0) / 10.0;
    }

    /**
     * Clasifica el IMC segun la OMS.
     */
    public String clasificarIMC() {
        Double imc = calcularIMC();
        if (imc == null) return null;
        if (imc < 18.5) return "Bajo peso";
        if (imc < 25.0) return "Normal";
        if (imc < 30.0) return "Sobrepeso";
        return "Obesidad";
    }

}
