package com.medicalerp.tratamiento.service.rules;

import com.medicalerp.tratamiento.dto.TratamientoAlertaResponse;
import com.medicalerp.tratamiento.entity.Tratamiento;
import com.medicalerp.tratamiento.enums.EstadoTratamiento;
import com.medicalerp.tratamiento.enums.ProximaAccion;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * StartTreatmentRule
 * Detecta tratamientos pendientes de iniciar
 */
@Component
public class StartTreatmentRule implements ClinicalRule {

    @Override
    public String getCode() {
        return "START";
    }

    @Override
    public int getPriority() {
        return 1;
    }

    @Override
    public ClinicalEvaluation evaluate(Tratamiento tratamiento, ClinicalContext context) {
        if (tratamiento.getEstado() != EstadoTratamiento.PENDIENTE) {
            return ClinicalEvaluation.builder().build();
        }

        return ClinicalEvaluation.builder()
                .proximaAccion(ProximaAccion.INICIAR)
                .mensaje("Tratamiento pendiente de iniciar")
                .alertas(List.of(
                        TratamientoAlertaResponse.builder()
                                .tipoAlerta("PENDIENTE_INICIO")
                                .tratamientoId(tratamiento.getId())
                                .mensaje("Tratamiento sin iniciar")
                                .severidad("WARNING")
                                .accionSugerida("Iniciar tratamiento")
                                .build()
                ))
                .build();
    }

}
