package com.medicalerp.tratamiento.service.rules;


import com.medicalerp.tratamiento.dto.TratamientoAlertaResponse;
import com.medicalerp.tratamiento.entity.Tratamiento;
import com.medicalerp.tratamiento.enums.EstadoTratamiento;
import com.medicalerp.tratamiento.enums.ProximaAccion;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * SessionLimitRule
 * Detecta cuando el tratamiento alcanza el limite de sesiones
 */
@Component
public class SessionLimitRule implements ClinicalRule {

    @Override
    public String getCode() {
        return "LIMIT";
    }

    @Override
    public int getPriority() {
        return 3;
    }

    @Override
    public ClinicalEvaluation evaluate(Tratamiento tratamiento, ClinicalContext context) {
        if (tratamiento.getEstado() != EstadoTratamiento.EN_CURSO) {
            return ClinicalEvaluation.builder().build();
        }

        Integer realizadas = tratamiento.getSesionesRealizadas() != null ? tratamiento.getSesionesRealizadas() : 0;
        Integer planeadas = tratamiento.getSesionesPlaneadas() != null ? tratamiento.getSesionesPlaneadas() : 1;

        if (realizadas >= planeadas) {
            return ClinicalEvaluation.builder()
                    .proximaAccion(ProximaAccion.AMPLIAR_PLAN)
                    .mensaje("Sesiones agotadas (" + realizadas + "/" + planeadas + "). Ampliar plan o finalizar.")
                    .alertas(List.of(
                            TratamientoAlertaResponse.builder()
                                    .tipoAlerta("LIMITE_SESIONES")
                                    .tratamientoId(tratamiento.getId())
                                    .mensaje("Sesiones agotadas: " + realizadas + "/" + planeadas)
                                    .severidad("WARNING")
                                    .accionSugerida("Ampliar plan o finalizar tratamiento")
                                    .build()
                    ))
                    .build();
        }

        return ClinicalEvaluation.builder().build();
    }

}
