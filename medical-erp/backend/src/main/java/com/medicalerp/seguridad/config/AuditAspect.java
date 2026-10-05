package com.medicalerp.seguridad.config;

import com.medicalerp.auditoria.entity.AuditLog;
import com.medicalerp.auditoria.repository.AuditLogRepository;
import com.medicalerp.common.util.SecurityUtils;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.Instant;

/**
 * Audit Aspect (SEC-004)
 * Logs all data modification operations to the audit_log table.
 */
@Slf4j
@Aspect
@Component
@RequiredArgsConstructor
public class AuditAspect {

    private final AuditLogRepository auditLogRepository;
    private final SecurityUtils securityUtils;

    @AfterReturning(
            pointcut = "@annotation(com.medicalerp.common.util.Auditable) || " +
                       "execution(* com.medicalerp..*.service.*.create*(..)) || " +
                       "execution(* com.medicalerp..*.service.*.update*(..)) || " +
                       "execution(* com.medicalerp..*.service.*.delete*(..)) || " +
                       "execution(* com.medicalerp..*.service.*.save*(..))",
            returning = "result"
    )
    public void auditOperation(JoinPoint joinPoint, Object result) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String userEmail = auth != null ? auth.getName() : "anonymous";
            String userRole = auth != null && !auth.getAuthorities().isEmpty()
                    ? auth.getAuthorities().iterator().next().getAuthority()
                    : "anonymous";

            Long clinicaId = securityUtils.getCurrentClinicaId();
            Long userId = securityUtils.getCurrentUserId();

            String methodName = joinPoint.getSignature().getName();
            String className = joinPoint.getTarget().getClass().getSimpleName();
            Long entityId = extractEntityId(result, joinPoint.getArgs());

            HttpServletRequest request = ((ServletRequestAttributes) RequestContextHolder.currentRequestAttributes()).getRequest();
            String ipAddress = request.getRemoteAddr();
            String userAgent = request.getHeader("User-Agent");

            AuditLog auditLog = AuditLog.builder()
                    .timestamp(Instant.now())
                    .userId(userId)
                    .userEmail(userEmail)
                    .userRole(userRole)
                    .clinicaId(clinicaId)
                    .action(methodName)
                    .entityType(className)
                    .entityId(entityId)
                    .ipAddress(ipAddress)
                    .userAgent(userAgent)
                    .build();

            auditLogRepository.save(auditLog);

            log.info("AUDIT: user={}, role={}, action={}, entity={}, ip={}, userAgent={}",
                    userEmail, userRole, methodName, className, ipAddress, userAgent);

        } catch (Exception e) {
            log.error("Error in audit aspect: {}", e.getMessage());
        }
    }

    private Long extractEntityId(Object result, Object[] args) {
        if (result == null && args != null && args.length > 0) {
            if (args[0] instanceof Long id) {
                return id;
            }
        }
        if (result instanceof com.medicalerp.common.dto.ApiResponse<?> response) {
            Object data = response.getData();
            if (data != null) {
                try {
                    java.lang.reflect.Method getId = data.getClass().getMethod("getId");
                    Object idValue = getId.invoke(data);
                    if (idValue instanceof Long id) {
                        return id;
                    }
                } catch (Exception ignored) {
                    // Could not extract id
                }
            }
        }
        return null;
    }
}
