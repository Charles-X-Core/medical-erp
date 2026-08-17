package com.medicalerp.seguridad.controller;

import com.medicalerp.common.dto.ApiResponse;
import com.medicalerp.seguridad.dto.*;
import com.medicalerp.seguridad.repository.OtpCodeRepository;
import com.medicalerp.seguridad.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Authentication Controller (API-002, API-OTP-005)
 */
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final OtpCodeRepository otpCodeRepository;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Login exitoso"));
    }

    @PostMapping("/login-step1")
    public ResponseEntity<ApiResponse<OtpStep1Response>> loginStep1(
            @Valid @RequestBody OtpStep1Request request,
            HttpServletRequest httpRequest) {
        String ipAddress = extractIpAddress(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");
        OtpStep1Response response = authService.loginStep1(request, ipAddress, userAgent);
        return ResponseEntity.ok(ApiResponse.success(response, "Código OTP enviado"));
    }

    @PostMapping("/login-step2")
    public ResponseEntity<ApiResponse<LoginResponse>> loginStep2(@Valid @RequestBody OtpStep2Request request) {
        LoginResponse response = authService.loginStep2(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Autenticación completada"));
    }

    @PostMapping("/resend-otp")
    public ResponseEntity<ApiResponse<OtpStep1Response>> resendOtp(
            @Valid @RequestBody ResendOtpRequest request,
            HttpServletRequest httpRequest) {
        String ipAddress = extractIpAddress(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");
        OtpStep1Response response = authService.resendOtp(request, ipAddress, userAgent);
        return ResponseEntity.ok(ApiResponse.success(response, "Código OTP reenviado"));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<LoginResponse>> refreshToken(@RequestHeader("X-Refresh-Token") String refreshToken) {
        LoginResponse response = authService.refreshToken(refreshToken);
        return ResponseEntity.ok(ApiResponse.success(response, "Token refrescado exitosamente"));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<?>> getCurrentUser() {
        return ResponseEntity.ok(ApiResponse.success(authService.getCurrentUser()));
    }

    @GetMapping("/dev/otp-code")
    @Profile("dev")
    public ResponseEntity<?> getDevOtpCode(@RequestParam String email) {
        return otpCodeRepository.findTopByEmailAndUsadoFalseOrderByCreatedAtDesc(email)
                .map(otp -> ResponseEntity.ok((Object) java.util.Map.of(
                        "success", true,
                        "codigo", otp.getCodigo(),
                        "email", otp.getEmail(),
                        "expiraAt", otp.getExpiraAt().toString()
                )))
                .orElse(ResponseEntity.ok((Object) java.util.Map.of(
                        "success", false,
                        "message", "No hay OTP pendiente para " + email
                )));
    }

    private String extractIpAddress(HttpServletRequest request) {
        String xForwarded = request.getHeader("X-Forwarded-For");
        if (xForwarded != null && !xForwarded.isBlank()) {
            return xForwarded.split(",")[0].trim();
        }
        String xReal = request.getHeader("X-Real-IP");
        if (xReal != null && !xReal.isBlank()) {
            return xReal;
        }
        return request.getRemoteAddr();
    }

}
