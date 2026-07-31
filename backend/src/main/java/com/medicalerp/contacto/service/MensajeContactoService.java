package com.medicalerp.contacto.service;

import com.medicalerp.common.exception.BusinessRuleException;
import com.medicalerp.common.exception.ResourceNotFoundException;
import com.medicalerp.contacto.dto.MensajeContactoRequest;
import com.medicalerp.contacto.dto.MensajeContactoResponse;
import com.medicalerp.contacto.entity.MensajeContacto;
import com.medicalerp.contacto.mapper.MensajeContactoMapper;
import com.medicalerp.contacto.repository.MensajeContactoRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.concurrent.ConcurrentHashMap;

/**
 * MensajeContacto Service (DOM-CON-002)
 * Handles contact messages with rate limiting and email notifications
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MensajeContactoService {

    private final MensajeContactoRepository repository;
    private final MensajeContactoMapper mapper;
    private final EmailService emailService;

    // Rate limiting: max 5 messages per IP per hour
    private static final int MAX_MESSAGES_PER_HOUR = 5;
    private static final long RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
    private final ConcurrentHashMap<String, java.util.Deque<Long>> rateLimitMap = new ConcurrentHashMap<>();

    @Transactional
    public MensajeContactoResponse create(MensajeContactoRequest request, HttpServletRequest httpRequest) {
        String clientIp = getClientIp(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");

        // Rate limiting check
        checkRateLimit(clientIp);

        MensajeContacto entity = mapper.toEntity(request);
        entity.setIpAddress(clientIp);
        entity.setUserAgent(userAgent);
        entity.setEstado("pendiente");

        MensajeContacto saved = repository.save(entity);
        log.info("Contact message saved id={} from ip={} email={}", saved.getId(), clientIp, saved.getEmail());

        // Send email notification asynchronously
        emailService.sendContactNotification(saved);

        return mapper.toResponse(saved);
    }

    public Page<MensajeContactoResponse> findAll(String estado, Pageable pageable) {
        Page<MensajeContacto> page = estado != null
                ? repository.findByEstado(estado, pageable)
                : repository.findAll(pageable);
        return page.map(mapper::toResponse);
    }

    public MensajeContactoResponse findById(Long id) {
        MensajeContacto entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Mensaje de contacto no encontrado: " + id));
        return mapper.toResponse(entity);
    }

    @Transactional
    public MensajeContactoResponse marcarLeido(Long id) {
        MensajeContacto entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Mensaje de contacto no encontrado: " + id));

        if (!"pendiente".equals(entity.getEstado()) && !"leido".equals(entity.getEstado())) {
            throw new BusinessRuleException("INVALID_STATE", "Solo mensajes pendientes pueden marcarse como leídos");
        }

        entity.setEstado("leido");
        entity.setReadAt(LocalDateTime.now());
        MensajeContacto updated = repository.save(entity);
        log.info("Message id={} marked as read", id);
        return mapper.toResponse(updated);
    }

    @Transactional
    public MensajeContactoResponse marcarRespondido(Long id) {
        MensajeContacto entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Mensaje de contacto no encontrado: " + id));

        entity.setEstado("respondido");
        entity.setRepliedAt(LocalDateTime.now());
        MensajeContacto updated = repository.save(entity);
        log.info("Message id={} marked as replied", id);
        return mapper.toResponse(updated);
    }

    @Transactional
    public void delete(Long id) {
        MensajeContacto entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Mensaje de contacto no encontrado: " + id));
        // Soft delete: mark as deleted (not physically removed per DOM-CON-002 §14)
        entity.setEstado("eliminado");
        repository.save(entity);
        log.info("Message id={} soft deleted", id);
    }

    private void checkRateLimit(String ip) {
        long now = System.currentTimeMillis();
        java.util.Deque<Long> timestamps = rateLimitMap.computeIfAbsent(ip, k -> new java.util.ArrayDeque<>());

        synchronized (timestamps) {
            // Remove old entries outside the window
            while (!timestamps.isEmpty() && (now - timestamps.peekFirst()) > RATE_LIMIT_WINDOW_MS) {
                timestamps.pollFirst();
            }

            if (timestamps.size() >= MAX_MESSAGES_PER_HOUR) {
                log.warn("Rate limit exceeded for IP={} ({} messages in last hour)", ip, timestamps.size());
                throw new BusinessRuleException("RATE_LIMIT_EXCEEDED", "Demasiados mensajes enviados desde esta dirección. Por favor, inténtelo más tarde.");
            }

            timestamps.addLast(now);
        }
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            return xForwardedFor.split(",")[0].trim();
        }
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isBlank()) {
            return xRealIp.trim();
        }
        return request.getRemoteAddr();
    }

}
