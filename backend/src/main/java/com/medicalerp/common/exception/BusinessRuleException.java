package com.medicalerp.common.exception;

/**
 * Exception thrown for business logic violations
 * Maps to HTTP 422 Unprocessable Entity (API-003)
 */
public class BusinessRuleException extends RuntimeException {

    private final String ruleCode;

    public BusinessRuleException(String ruleCode, String message) {
        super(message);
        this.ruleCode = ruleCode;
    }

    public String getRuleCode() {
        return ruleCode;
    }

}
