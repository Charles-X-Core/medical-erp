package com.medicalerp.auditoria.service;

import com.medicalerp.auditoria.entity.AccessLog;
import com.medicalerp.auditoria.repository.AccessLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AccessLogService {

    private final AccessLogRepository accessLogRepository;

    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(Long clinicaId, String accion, String entidad, Long entidadId,
                    String userEmail, String ipAddress, String userAgent) {
        try {
            accessLogRepository.save(AccessLog.builder()
                    .clinicaId(clinicaId)
                    .accion(accion)
                    .entidad(entidad)
                    .entidadId(entidadId)
                    .userEmail(userEmail)
                    .ipAddress(ipAddress)
                    .userAgent(userAgent)
                    .build());
        } catch (Exception ignored) {
            // Fire-and-forget: never break the main flow
        }
    }
}
