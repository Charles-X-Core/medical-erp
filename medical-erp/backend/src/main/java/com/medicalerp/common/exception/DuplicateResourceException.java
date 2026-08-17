package com.medicalerp.common.exception;

/**
 * Exception thrown when a duplicate resource is detected
 * Maps to HTTP 409 Conflict (API-003)
 */
public class DuplicateResourceException extends RuntimeException {

    private final String fieldName;
    private final String fieldValue;

    public DuplicateResourceException(String fieldName, String fieldValue) {
        super(String.format("Ya existe un registro con %s: %s", fieldName, fieldValue));
        this.fieldName = fieldName;
        this.fieldValue = fieldValue;
    }

    public String getFieldName() {
        return fieldName;
    }

    public String getFieldValue() {
        return fieldValue;
    }

}
