package com.medicalerp.tratamiento.service.rules;

import com.medicalerp.tratamiento.dto.TratamientoAlertaResponse;
import com.medicalerp.tratamiento.enums.ProximaAccion;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * ClinicalEvaluation
 * Resultado de la evaluacion del motor de reglas
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClinicalEvaluation {

    private ProximaAccion proximaAccion;
    private String mensaje;
    @Builder.Default
    private List<TratamientoAlertaResponse> alertas = new ArrayList<>();

    public void merge(ClinicalEvaluation other) {
        if (other == null) return;

        if (other.getProximaAccion() != null) {
            if (this.proximaAccion == null || other.getProximaAccion().ordinal() < this.proximaAccion.ordinal()) {
                this.proximaAccion = other.getProximaAccion();
            }
        }

        if (other.getMensaje() != null && (this.mensaje == null || other.getMensaje().length() > this.mensaje.length())) {
            this.mensaje = other.getMensaje();
        }

        if (other.getAlertas() != null) {
            if (this.alertas == null) this.alertas = new ArrayList<>();
            this.alertas.addAll(other.getAlertas());
        }
    }

}
