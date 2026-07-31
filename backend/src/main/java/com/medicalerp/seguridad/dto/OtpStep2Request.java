package com.medicalerp.seguridad.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * OTP Step 2 Request DTO (API-OTP-003)
 * Email + OTP code for second authentication step
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OtpStep2Request {

    @NotBlank(message = "El email es requerido")
    @Email(message = "El email no es válido")
    private String email;

    @NotBlank(message = "El código OTP es requerido")
    @Size(min = 6, max = 6, message = "El código debe tener 6 dígitos")
    @Pattern(regexp = "^[0-9]{6}$", message = "El código debe contener solo 6 dígitos numéricos")
    private String codigo;

}
