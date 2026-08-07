package com.medicalerp.tratamiento.service.rules;

import com.medicalerp.tratamiento.entity.Tratamiento;
import com.medicalerp.tratamiento.enums.EstadoTratamiento;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * FinalizeTreatmentRule
 * Detecta tratamientos que pueden ser finalizados
 */
@Component
public class FinalizeTreatmentRule implements ClinicalRule {

    @Override
    public String getCode() {
        return "FINALIZE";
    }

    @Override
    public int getPriority() {
        return 4;
    }

    @Override
    public ClinicalEvaluation evaluate(Tratamiento tratamiento, ClinicalContext context) {
        if (tratamiento.getEstado() != EstadoTratamiento.EN_CURSO) {
            return ClinicalEvaluation.builder().build();
        }

        Integer realizadas = tratamiento.getSesionesRealizadas() != null ? tratamiento.getSesionesRealizadas() : 0;
        Integer planeadas = tratamiento.getSesionesPlaneadas() != null ? tratamiento.getSesionesPlaneadas() : 1;

        // Solo sugerir finalizar si esta en limite pero no necesita ampliacion
        if (realizadas >= planeadas) {
            // No sobreescribir AMPLIAR_PLAN, solo agregar como alternativa
            return ClinicalEvaluation.builder()
                    .mensaje("Tratamiento puede ser finalizado")
                    .build();
        }

        return ClinicalEvaluation.builder().build();
    }

}
