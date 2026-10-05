package com.medicalerp.seguridad.service;

import com.medicalerp.common.exception.DuplicateResourceException;
import com.medicalerp.common.exception.OtpVerificationException;
import com.medicalerp.common.exception.ResourceNotFoundException;
import com.medicalerp.common.util.BusinessTime;
import com.medicalerp.clinica.entity.Clinica;
import com.medicalerp.clinica.repository.ClinicaRepository;
import com.medicalerp.seguridad.config.JwtUtils;
import com.medicalerp.seguridad.config.JwtProperties;
import com.medicalerp.seguridad.dto.*;
import com.medicalerp.seguridad.entity.Rol;
import com.medicalerp.seguridad.entity.Usuario;
import com.medicalerp.seguridad.mapper.UsuarioMapper;
import com.medicalerp.seguridad.repository.RolRepository;
import com.medicalerp.seguridad.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import jakarta.annotation.PostConstruct;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Authentication and User Management Service (SEC-002, SEC-003, SEC-OTP-005)
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthService {

    private static final int MAX_LOGIN_ATTEMPTS = 5;
    private static final int LOCKOUT_MINUTES = 15;
    private static final int IP_RATE_LIMIT = 10;
    private static final int IP_RATE_WINDOW_MINUTES = 15;

    // Rate limiting: IP -> list of timestamps
    private final ConcurrentHashMap<String, java.util.List<Instant>> ipLoginAttempts = new ConcurrentHashMap<>();

    private final AuthenticationManager authenticationManager;
    private final TransactionTemplate transactionTemplate;
    private final JwtUtils jwtUtils;
    private final JwtProperties jwtProperties;

    @PostConstruct
    public void init() {
        transactionTemplate.setPropagationBehavior(
                org.springframework.transaction.TransactionDefinition.PROPAGATION_REQUIRES_NEW);
    }
    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final ClinicaRepository clinicaRepository;
    private final PasswordEncoder passwordEncoder;
    private final UsuarioMapper usuarioMapper;
    private final OtpService otpService;

    @Transactional
    public OtpStep1Response loginStep1(OtpStep1Request request, String ipAddress, String userAgent) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getEmail(),
                            request.getPassword()
                    )
            );
        } catch (BadCredentialsException e) {
            throw new BadCredentialsException("Credenciales inválidas");
        }

        Usuario usuario = usuarioRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", request.getEmail()));

        if (!usuario.getActivo()) {
            throw new OtpVerificationException("USER_INACTIVE", "Usuario desactivado");
        }

        otpService.generateAndSendOtp(request.getEmail(), ipAddress, userAgent);

        return OtpStep1Response.builder()
                .message("Código OTP enviado a su email")
                .email(request.getEmail())
                .expiresInMinutes(5)
                .requiresOtp(true)
                .build();
    }

    @Transactional
    public LoginResponse loginStep2(OtpStep2Request request) {
        otpService.validateOtp(request.getEmail(), request.getCodigo());

        Usuario usuario = usuarioRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", request.getEmail()));

        String role = usuario.getRoles().iterator().next().getNombre();
        org.springframework.security.core.userdetails.User userDetails =
                new org.springframework.security.core.userdetails.User(
                        usuario.getEmail(),
                        usuario.getPassword(),
                        java.util.Collections.emptyList()
                );

        Long clinicaId = usuario.getClinicaId() != null ? usuario.getClinicaId() : 1L;
        Clinica clinica = clinicaRepository.findById(clinicaId)
                .orElseThrow(() -> new ResourceNotFoundException("Clínica", clinicaId));

        String token = jwtUtils.generateToken(userDetails, usuario.getId(), role, clinicaId);
        String refreshToken = jwtUtils.generateRefreshToken(usuario.getEmail(), usuario.getId(), role, clinicaId);

        long expiresInSeconds = jwtProperties.getExpiration() / 1000;

        return LoginResponse.builder()
                .token(token)
                .refreshToken(refreshToken)
                .type("Bearer")
                .expiresIn(expiresInSeconds)
                .user(LoginResponse.UserInfo.builder()
                        .id(usuario.getId())
                        .nombre(usuario.getNombre())
                        .email(usuario.getEmail())
                        .role(role)
                        .clinicaId(clinicaId)
                        .clinicaNombre(clinica.getNombre())
                        .build())
                .build();
    }

    @Transactional
    public OtpStep1Response resendOtp(ResendOtpRequest request, String ipAddress, String userAgent) {
        otpService.resendOtp(request.getEmail(), ipAddress, userAgent);

        return OtpStep1Response.builder()
                .message("Nuevo código OTP enviado a su email")
                .email(request.getEmail())
                .expiresInMinutes(5)
                .requiresOtp(true)
                .build();
    }

    @Transactional
    public LoginResponse refreshToken(String refreshToken) {
        if (!jwtUtils.isRefreshToken(refreshToken)) {
            throw new BadCredentialsException("Token de refresco inválido");
        }

        if (!jwtUtils.isTokenValid(refreshToken)) {
            throw new BadCredentialsException("Token de refresco expirado");
        }

        String email = jwtUtils.extractUsername(refreshToken);
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", email));

        if (!usuario.getActivo()) {
            throw new BadCredentialsException("Usuario desactivado");
        }

        String role = usuario.getRoles().iterator().next().getNombre();
        org.springframework.security.core.userdetails.User userDetails =
                new org.springframework.security.core.userdetails.User(
                        usuario.getEmail(),
                        usuario.getPassword(),
                        java.util.Collections.emptyList()
                );

        Long clinicaId = usuario.getClinicaId() != null ? usuario.getClinicaId() : 1L;
        Clinica clinica = clinicaRepository.findById(clinicaId)
                .orElseThrow(() -> new ResourceNotFoundException("Clínica", clinicaId));

        String newToken = jwtUtils.generateToken(userDetails, usuario.getId(), role, clinicaId);
        String newRefreshToken = jwtUtils.generateRefreshToken(usuario.getEmail(), usuario.getId(), role, clinicaId);
        long expiresInSeconds = jwtProperties.getExpiration() / 1000;

        return LoginResponse.builder()
                .token(newToken)
                .refreshToken(newRefreshToken)
                .type("Bearer")
                .expiresIn(expiresInSeconds)
                .user(LoginResponse.UserInfo.builder()
                        .id(usuario.getId())
                        .nombre(usuario.getNombre())
                        .email(usuario.getEmail())
                        .role(role)
                        .clinicaId(clinicaId)
                        .clinicaNombre(clinica.getNombre())
                        .build())
                .build();
    }

    /**
     * Direct login with email + password (primary login method)
     * Includes brute force protection: rate limiting + account lockout
     */
    @Transactional
    public LoginResponse login(LoginRequest request, String ipAddress) {
        // 1. Check IP rate limit
        checkIpRateLimit(ipAddress);

        // 2. Check account lockout
        Usuario usuario = usuarioRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", request.getEmail()));

        if (usuario.getLockedUntil() != null && BusinessTime.toInstant(usuario.getLockedUntil()).isAfter(Instant.now())) {
            long minutesLeft = java.time.Duration.between(Instant.now(), BusinessTime.toInstant(usuario.getLockedUntil())).toMinutes() + 1;
            throw new org.springframework.security.access.AccessDeniedException(
                    "Cuenta bloqueada temporalmente. Intente de nuevo en " + minutesLeft + " minutos.");
        }

        // 3. Authenticate
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getEmail(),
                            request.getPassword()
                    )
            );
            SecurityContextHolder.getContext().setAuthentication(authentication);
        } catch (BadCredentialsException e) {
            // 4. On failure: increment failed attempts, lock if threshold reached
            handleFailedLogin(usuario, ipAddress);
            throw e;
        }

        // 5. On success: reset failed attempts, clear lockout
        handleSuccessfulLogin(usuario);

        String role = usuario.getRoles().iterator().next().getNombre();
        org.springframework.security.core.userdetails.User userDetails =
                new org.springframework.security.core.userdetails.User(
                        usuario.getEmail(),
                        usuario.getPassword(),
                        java.util.Collections.emptyList()
                );

        Long clinicaId = usuario.getClinicaId() != null ? usuario.getClinicaId() : 1L;
        Clinica clinica = clinicaRepository.findById(clinicaId)
                .orElseThrow(() -> new ResourceNotFoundException("Clínica", clinicaId));

        String token = jwtUtils.generateToken(userDetails, usuario.getId(), role, clinicaId);
        String refreshToken = jwtUtils.generateRefreshToken(usuario.getEmail(), usuario.getId(), role, clinicaId);
        long expiresInSeconds = jwtProperties.getExpiration() / 1000;

        log.info("Login exitoso: email={}, ip={}", request.getEmail(), ipAddress);

        return LoginResponse.builder()
                .token(token)
                .refreshToken(refreshToken)
                .type("Bearer")
                .expiresIn(expiresInSeconds)
                .user(LoginResponse.UserInfo.builder()
                        .id(usuario.getId())
                        .nombre(usuario.getNombre())
                        .email(usuario.getEmail())
                        .role(role)
                        .clinicaId(clinicaId)
                        .clinicaNombre(clinica.getNombre())
                        .build())
                .build();
    }

    private void checkIpRateLimit(String ipAddress) {
        if (ipAddress == null) return;
        Instant windowStart = Instant.now().minusSeconds(IP_RATE_WINDOW_MINUTES * 60L);
        java.util.List<Instant> attempts = ipLoginAttempts.computeIfAbsent(ipAddress, k -> new java.util.ArrayList<>());
        attempts.removeIf(t -> t.isBefore(windowStart));
        if (attempts.size() >= IP_RATE_LIMIT) {
            log.warn("Rate limit excedido para IP: {}", ipAddress);
            throw new BadCredentialsException("Demasiados intentos de inicio de sesión. Espere unos minutos.");
        }
        attempts.add(Instant.now());
    }

    private void handleFailedLogin(Usuario usuario, String ipAddress) {
        String email = usuario.getEmail();
        int currentAttempts = (usuario.getFailedLoginAttempts() == null ? 0 : usuario.getFailedLoginAttempts()) + 1;

        transactionTemplate.executeWithoutResult(status -> {
            Usuario u = usuarioRepository.findByEmail(email).orElse(null);
            if (u == null) return;
            u.setFailedLoginAttempts(currentAttempts);
            if (currentAttempts >= MAX_LOGIN_ATTEMPTS) {
                u.setLockedUntil(BusinessTime.currentDateTime().plusMinutes(LOCKOUT_MINUTES));
                log.warn("Cuenta bloqueada por {} intentos fallidos: email={}, ip={}", currentAttempts, email, ipAddress);
            } else {
                log.warn("Login fallido ({}/{}): email={}, ip={}", currentAttempts, MAX_LOGIN_ATTEMPTS, email, ipAddress);
            }
            usuarioRepository.save(u);
        });
    }

    private void handleSuccessfulLogin(Usuario usuario) {
        String email = usuario.getEmail();
        if (usuario.getFailedLoginAttempts() != null && usuario.getFailedLoginAttempts() > 0) {
            transactionTemplate.executeWithoutResult(status -> {
                Usuario u = usuarioRepository.findByEmail(email).orElse(null);
                if (u == null) return;
                u.setFailedLoginAttempts(0);
                u.setLockedUntil(null);
                usuarioRepository.save(u);
            });
        }
    }

    public UsuarioResponse getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", email));
        
        return usuarioMapper.toResponse(usuario);
    }

    @Transactional
    public UsuarioResponse createUser(UsuarioRequest request) {
        if (usuarioRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("email", request.getEmail());
        }

        Rol rol = rolRepository.findByNombre(request.getRol())
                .orElseThrow(() -> new ResourceNotFoundException("Rol", request.getRol()));

        Long clinicaId = request.getClinicaId() != null ? request.getClinicaId() : 1L;
        if (!clinicaRepository.existsById(clinicaId)) {
            throw new ResourceNotFoundException("Clínica", clinicaId);
        }

        Usuario usuario = Usuario.builder()
                .nombre(request.getNombre())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .activo(true)
                .roles(java.util.Collections.singleton(rol))
                .clinicaId(clinicaId)
                .build();

        Usuario saved = usuarioRepository.save(usuario);
        return usuarioMapper.toResponse(saved);
    }

    public Page<UsuarioResponse> getAllUsers(Pageable pageable) {
        return usuarioRepository.findAll(pageable)
                .map(usuarioMapper::toResponse);
    }

    public UsuarioResponse getUserById(Long id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", id));
        return usuarioMapper.toResponse(usuario);
    }

    @Transactional
    public UsuarioResponse updateUser(Long id, UsuarioRequest request) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", id));

        if (!usuario.getEmail().equals(request.getEmail()) && usuarioRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("email", request.getEmail());
        }

        usuario.setNombre(request.getNombre());
        usuario.setEmail(request.getEmail());
        
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            usuario.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        Rol rol = rolRepository.findByNombre(request.getRol())
                .orElseThrow(() -> new ResourceNotFoundException("Rol", request.getRol()));
        usuario.setRoles(java.util.Collections.singleton(rol));

        if (request.getClinicaId() != null) {
            if (!clinicaRepository.existsById(request.getClinicaId())) {
                throw new ResourceNotFoundException("Clínica", request.getClinicaId());
            }
            usuario.setClinicaId(request.getClinicaId());
        }

        Usuario saved = usuarioRepository.save(usuario);
        return usuarioMapper.toResponse(saved);
    }

    @Transactional
    public void deleteUser(Long id) {
        if (!usuarioRepository.existsById(id)) {
            throw new ResourceNotFoundException("Usuario", id);
        }
        usuarioRepository.deleteById(id);
    }

    @Transactional
    public void activateUser(Long id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", id));
        usuario.setActivo(true);
        usuarioRepository.save(usuario);
    }

    @Transactional
    public void deactivateUser(Long id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", id));
        usuario.setActivo(false);
        usuarioRepository.save(usuario);
    }

    @Transactional
    public void resetPassword(Long id, String newPassword) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", id));
        usuario.setPassword(passwordEncoder.encode(newPassword));
        usuarioRepository.save(usuario);
    }

}
