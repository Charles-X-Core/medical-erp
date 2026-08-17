package com.medicalerp.common.exception;

import lombok.Getter;

/**
 * OTP Verification Exception (SEC-OTP-003)
 * Thrown when OTP validation fails or security limits are exceeded
 */
@Getter
public class OtpVerificationException extends RuntimeException {

    private final String errorCode;

    public OtpVerificationException(String errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }

}
