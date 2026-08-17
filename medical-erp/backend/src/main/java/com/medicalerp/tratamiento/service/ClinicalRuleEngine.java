package com.medicalerp.tratamiento.service;

import com.medicalerp.tratamiento.entity.Tratamiento;
import com.medicalerp.tratamiento.service.rules.ClinicalContext;
import com.medicalerp.tratamiento.service.rules.ClinicalEvaluation;
import com.medicalerp.tratamiento.service.rules.ClinicalRule;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;

/**
 * ClinicalRuleEngine
 * Motor de reglas clinicas extensible
 * Ejecuta todas las reglas y combina los resultados
 */
@Service
@RequiredArgsConstructor
public class ClinicalRuleEngine {

    private final List<ClinicalRule> rules;

    public ClinicalEvaluation evaluate(Tratamiento tratamiento, ClinicalContext context) {
        ClinicalEvaluation result = ClinicalEvaluation.builder().build();

        List<ClinicalRule> sortedRules = rules.stream()
                .sorted(Comparator.comparingInt(ClinicalRule::getPriority))
                .toList();

        for (ClinicalRule rule : sortedRules) {
            try {
                ClinicalEvaluation partial = rule.evaluate(tratamiento, context);
                result.merge(partial);
            } catch (Exception e) {
                // Log error but continue with other rules
            }
        }

        return result;
    }

}
