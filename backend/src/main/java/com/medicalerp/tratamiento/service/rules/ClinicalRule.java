package com.medicalerp.tratamiento.service.rules;

import com.medicalerp.tratamiento.entity.Tratamiento;

/**
 * ClinicalRule Interface
 * Motor de reglas clinicas extensible
 */
public interface ClinicalRule {

    String getCode();

    int getPriority();

    ClinicalEvaluation evaluate(Tratamiento tratamiento, ClinicalContext context);

}
