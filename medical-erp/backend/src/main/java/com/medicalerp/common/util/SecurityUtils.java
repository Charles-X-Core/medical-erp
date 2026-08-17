package com.medicalerp.common.util;

import com.medicalerp.seguridad.config.CustomUserPrincipal;
import com.medicalerp.seguridad.entity.Usuario;
import com.medicalerp.seguridad.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * Security Utilities (SEC-002)
 * Helper to extract current authenticated user information from SecurityContext
 */
@Component
@RequiredArgsConstructor
public class SecurityUtils {

    private final UsuarioRepository usuarioRepository;

    public Long getCurrentUserId() {
        CustomUserPrincipal principal = getPrincipal();
        if (principal != null && principal.getId() != null) {
            return principal.getId();
        }
        // Fallback to DB lookup by email
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return null;
        }
        String email = auth.getName();
        return usuarioRepository.findByEmail(email)
                .map(Usuario::getId)
                .orElse(null);
    }

    public Long getCurrentClinicaId() {
        CustomUserPrincipal principal = getPrincipal();
        return principal != null ? principal.getClinicaId() : null;
    }

    public String getCurrentUserEmail() {
        CustomUserPrincipal principal = getPrincipal();
        return principal != null ? principal.getUsername() : null;
    }

    public boolean isAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return false;
        return auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }

    public boolean hasRole(String role) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return false;
        return auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_" + role));
    }

    public void validateOwnershipOrAdmin(Long resourceOwnerId) {
        Long currentUserId = getCurrentUserId();
        if (currentUserId == null) {
            throw new org.springframework.security.access.AccessDeniedException("Usuario no autenticado");
        }
        if (!currentUserId.equals(resourceOwnerId) && !isAdmin()) {
            throw new org.springframework.security.access.AccessDeniedException("No tiene permisos para modificar este recurso");
        }
    }

    /**
     * Fast clinic access validation using JWT claims (for reads).
     */
    public void validateClinicaAccessOnRead(Long resourceClinicaId) {
        Long tokenClinicaId = getCurrentClinicaId();
        if (tokenClinicaId == null || resourceClinicaId == null) {
            throw new org.springframework.security.access.AccessDeniedException("Usuario sin clínica asignada");
        }
        if (!tokenClinicaId.equals(resourceClinicaId)) {
            throw new org.springframework.security.access.AccessDeniedException("No tiene acceso a recursos de otra clínica");
        }
    }

    /**
     * Strong clinic access validation using JWT + DB (for writes).
     */
    public void validateClinicaAccessOnWrite(Long resourceClinicaId) {
        Long tokenClinicaId = getCurrentClinicaId();
        if (tokenClinicaId == null || resourceClinicaId == null) {
            throw new org.springframework.security.access.AccessDeniedException("Usuario sin clínica asignada");
        }

        // Fast JWT check
        if (!tokenClinicaId.equals(resourceClinicaId)) {
            throw new org.springframework.security.access.AccessDeniedException("No tiene acceso a recursos de otra clínica");
        }

        // DB validation critical: prevent token tampering
        Long currentUserId = getCurrentUserId();
        if (currentUserId == null) {
            throw new org.springframework.security.access.AccessDeniedException("Usuario no autenticado");
        }
        Usuario usuario = usuarioRepository.findById(currentUserId)
                .orElseThrow(() -> new org.springframework.security.access.AccessDeniedException("Usuario no encontrado"));

        if (usuario.getClinicaId() == null || !usuario.getClinicaId().equals(tokenClinicaId)) {
            throw new SecurityException("Token inválido: clínica inconsistente");
        }
    }

    private CustomUserPrincipal getPrincipal() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return null;
        }
        Object principal = auth.getPrincipal();
        if (principal instanceof CustomUserPrincipal customUserPrincipal) {
            return customUserPrincipal;
        }
        return null;
    }
}
