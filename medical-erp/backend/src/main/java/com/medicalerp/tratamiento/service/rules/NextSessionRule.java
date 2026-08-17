package com.medicalerp.tratamiento.service.rules;

import com.medicalerp.tratamiento.dto.TratamientoAlertaResponse;
import com.medicalerp.tratamiento.entity.SesionTratamiento;
import com.medicalerp.tratamiento.entity.Tratamiento;
import com.medicalerp.tratamiento.enums.EstadoTratamiento;
import com.medicalerp.tratamiento.enums.ProximaAccion;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * NextSessionRule
 * Detecta si un tratamiento activo necesita proxima sesion
 */
@Component
public class NextSessionRule implements ClinicalRule {

    @Override
    public String getCode() {
        return "NEXT_SESSION";
    }

    @Override
    public int getPriority() {
        return 2;
    }

    @Override
    public ClinicalEvaluation evaluate(Tratamiento tratamiento, ClinicalContext context) {
        if (tratamiento.getEstado() != EstadoTratamiento.EN_CURSO) {
            return ClinicalEvaluation.builder().build();
        }

        // Si no hay sesiones, necesita programar la primera
        if (context.getUltimaSesion() == null) {
            return ClinicalEvaluation.builder()
                    .proximaAccion(ProximaAccion.PROGRAMAR)
                    .mensaje("Activo sin sesiones registradas. Programar primera sesion.")
                    .alertas(List.of(
                            TratamientoAlertaResponse.builder()
                                    .tipoAlerta("SIN_PROXIMA_CITA")
                                    .tratamientoId(tratamiento.getId())
                                    .mensaje("Tratamiento activo sin sesiones")
                                    .severidad("INFO")
                                    .accionSugerida("Programar primera sesion")
                                    .build()
                    ))
                    .build();
        }

        // Si tiene sesiones, verificar si necesita proxima
        if (context.getProtocolo() != null && context.getProtocolo().getFrecuenciaDias() != null) {
            LocalDate fechaProxima = context.getUltimaSesion().getFecha().toLocalDate()
                    .plusDays(context.getProtocolo().getFrecuenciaDias());

            if (fechaProxima.isBefore(LocalDate.now()) || fechaProxima.isEqual(LocalDate.now())) {
                return ClinicalEvaluation.builder()
                        .proximaAccion(ProximaAccion.PROGRAMAR)
                        .mensaje("Sesion pendiente desde " + fechaProxima)
                        .alertas(List.of(
                                TratamientoAlertaResponse.builder()
                                        .tipoAlerta("SESION_VENCIDA")
                                        .tratamientoId(tratamiento.getId())
                                        .mensaje("Sesion vencida o pendiente")
                                        .fechaReferencia(fechaProxima.toString())
                                        .severidad("ERROR")
                                        .accionSugerida("Programar sesion pendiente")
                                        .build()
                        ))
                        .build();
            }
        }

        return ClinicalEvaluation.builder()
                .proximaAccion(ProximaAccion.REGISTRAR_SESION)
                .mensaje("Sesion proxima o a tiempo")
                .build();
    }

}
