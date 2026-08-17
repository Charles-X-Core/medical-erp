package com.medicalerp.seguridad.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * OTP Step 1 Response DTO (API-OTP-002)
 * Returned after credentials validated, OTP sent via email
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OtpStep1Response {

    private String message;
    private String email;
    private Integer expiresInMinutes;
    private Boolean requiresOtp;

}
