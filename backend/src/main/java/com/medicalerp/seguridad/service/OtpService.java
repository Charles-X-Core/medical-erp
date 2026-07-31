package com.medicalerp.seguridad.service;

import com.medicalerp.common.exception.OtpVerificationException;
import com.medicalerp.contacto.service.EmailService;
import com.medicalerp.seguridad.entity.OtpCode;
import com.medicalerp.seguridad.repository.OtpCodeRepository;
import com.medicalerp.seguridad.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

/**
 * OTP Service (SEC-OTP-004)
 * Generates, validates, and manages OTP codes with rate limiting
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OtpService {

    private final OtpCodeRepository otpCodeRepository;
    private final EmailService emailService;
    private final UsuarioRepository usuarioRepository;

    private final Random random = new Random();
    private final ConcurrentHashMap<String, RateLimitEntry> ipRateLimits = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, RateLimitEntry> resendRateLimits = new ConcurrentHashMap<>();

    @Value("${otp.max-attempts:3}")
    private int maxAttempts;

    @Value("${otp.expiration-minutes:5}")
    private int expirationMinutes;

    @Value("${otp.resend-seconds:60}")
    private int resendSeconds;

    @Value("${otp.ip-max-requests-per-hour:5}")
    private int ipMaxRequestsPerHour;

    @Value("${otp.max-active-codes-per-email:3}")
    private int maxActiveCodesPerEmail;

    @Transactional
    public OtpCode generateAndSendOtp(String email, String ipAddress, String userAgent) {
        // Check IP rate limit
        checkIpRateLimit(ipAddress);

        // Check resend rate limit per email
        checkResendRateLimit(email);

        // Check if user exists and is active
        var usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new OtpVerificationException("USER_NOT_FOUND", "Usuario no encontrado"));

        if (!usuario.getActivo()) {
            throw new OtpVerificationException("USER_INACTIVE", "Usuario desactivado");
        }

        // Check max active codes per email (prevent abuse)
        long activeCount = otpCodeRepository.countRecentByEmail(email, LocalDateTime.now().minusMinutes(expirationMinutes));
        if (activeCount >= maxActiveCodesPerEmail) {
            throw new OtpVerificationException("TOO_MANY_CODES", "Demasiados códigos activos. Espere a que expiren.");
        }

        // Generate 6-digit code
        String codigo = String.format("%06d", random.nextInt(1000000));

        // Save to database
        OtpCode otp = OtpCode.builder()
                .email(email)
                .codigo(codigo)
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .usado(false)
                .intentos(0)
                .expiraAt(LocalDateTime.now().plusMinutes(expirationMinutes))
                .build();

        OtpCode saved = otpCodeRepository.save(otp);

        // Send email
        emailService.sendOtpEmail(email, codigo, expirationMinutes);

        log.info("OTP generated and sent for email={}, ip={}, id={}", maskEmail(email), ipAddress, saved.getId());
        return saved;
    }

    @Transactional
    public boolean validateOtp(String email, String codigo) {
        OtpCode otp = otpCodeRepository.findTopByEmailAndUsadoFalseOrderByCreatedAtDesc(email)
                .orElseThrow(() -> new OtpVerificationException("OTP_NOT_FOUND", "Código OTP no encontrado o expirado"));

        // Check expired
        if (otp.getExpiraAt().isBefore(LocalDateTime.now())) {
            throw new OtpVerificationException("OTP_EXPIRED", "Código OTP expirado. Solicite uno nuevo.");
        }

        // Check max attempts
        if (otp.getIntentos() >= maxAttempts) {
            throw new OtpVerificationException("OTP_MAX_ATTEMPTS", "Máximo de intentos alcanzado. Solicite un nuevo código.");
        }

        // Increment attempts
        otp.setIntentos(otp.getIntentos() + 1);
        otpCodeRepository.save(otp);

        // Validate code
        if (!otp.getCodigo().equals(codigo)) {
            int remaining = maxAttempts - otp.getIntentos();
            if (remaining <= 0) {
                throw new OtpVerificationException("OTP_MAX_ATTEMPTS", "Máximo de intentos alcanzado. Solicite un nuevo código.");
            }
            throw new OtpVerificationException("OTP_INVALID", "Código OTP incorrecto. Intentos restantes: " + remaining);
        }

        // Mark as used
        otp.setUsado(true);
        otpCodeRepository.save(otp);

        log.info("OTP validated successfully for email={}", maskEmail(email));
        return true;
    }

    @Transactional
    public void resendOtp(String email, String ipAddress, String userAgent) {
        checkResendRateLimit(email);
        generateAndSendOtp(email, ipAddress, userAgent);
    }

    private void checkIpRateLimit(String ipAddress) {
        if (ipAddress == null || ipAddress.isBlank()) return;

        LocalDateTime now = LocalDateTime.now();
        RateLimitEntry entry = ipRateLimits.get(ipAddress);

        if (entry == null || entry.windowStart.plusHours(1).isBefore(now)) {
            ipRateLimits.put(ipAddress, new RateLimitEntry(now, 1));
            return;
        }

        if (entry.count >= ipMaxRequestsPerHour) {
            throw new OtpVerificationException("IP_RATE_LIMIT", "Demasiados intentos desde esta dirección IP. Intente en una hora.");
        }

        entry.count++;
    }

    private void checkResendRateLimit(String email) {
        LocalDateTime now = LocalDateTime.now();
        RateLimitEntry entry = resendRateLimits.get(email);

        if (entry == null || entry.windowStart.plusSeconds(resendSeconds).isBefore(now)) {
            resendRateLimits.put(email, new RateLimitEntry(now, 1));
            return;
        }

        throw new OtpVerificationException("RESEND_RATE_LIMIT", "Espere " + resendSeconds + " segundos antes de solicitar un nuevo código.");
    }

    @Scheduled(fixedDelayString = "${otp.cleanup-interval-ms:300000}")
    @Transactional
    public void cleanupExpiredCodes() {
        int deleted = otpCodeRepository.deleteAllExpired(LocalDateTime.now());
        int oldDeleted = otpCodeRepository.deleteAllOlderThan(LocalDateTime.now().minusDays(1));
        if (deleted > 0 || oldDeleted > 0) {
            log.info("Cleaned up {} expired + {} old OTP codes", deleted, oldDeleted);
        }
    }

    private String maskEmail(String email) {
        if (email == null || !email.contains("@")) return "***";
        String[] parts = email.split("@");
        String local = parts[0];
        String domain = parts[1];
        String maskedLocal = local.length() > 2
                ? local.substring(0, 2) + "***"
                : "***";
        return maskedLocal + "@" + domain;
    }

    private static class RateLimitEntry {
        LocalDateTime windowStart;
        int count;

        RateLimitEntry(LocalDateTime windowStart, int count) {
            this.windowStart = windowStart;
            this.count = count;
        }
    }

}
