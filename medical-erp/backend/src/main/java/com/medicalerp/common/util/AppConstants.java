package com.medicalerp.common.util;

/**
 * Application Constants
 */
public final class AppConstants {

    private AppConstants() {
        // Utility class
    }

    // Pagination defaults (API-001)
    public static final String DEFAULT_PAGE_NUMBER = "0";
    public static final String DEFAULT_PAGE_SIZE = "20";
    public static final String DEFAULT_SORT_BY = "id";
    public static final String DEFAULT_SORT_DIRECTION = "desc";

    // Security (SEC-001, SEC-002)
    public static final String TOKEN_PREFIX = "Bearer ";
    public static final String HEADER_AUTHORIZATION = "Authorization";

    // Roles (SEC-003)
    public static final String ROLE_ADMIN = "admin";
    public static final String ROLE_DOCTORA = "doctora";
    public static final String ROLE_ENFERMERA = "enfermera";

    // Patient Status (DOM-PAC-001)
    public static final String PACIENTE_ESTADO_ACTIVO = "activo";
    public static final String PACIENTE_ESTADO_INACTIVO = "inactivo";

    // Appointment Status (DOM-CIT-001)
    public static final String CITA_ESTADO_PENDIENTE = "pendiente";
    public static final String CITA_ESTADO_CONFIRMADA = "confirmada";
    public static final String CITA_ESTADO_CANCELADA = "cancelada";
    public static final String CITA_ESTADO_COMPLETADA = "completada";

    // Document Types (DOM-DOC-001)
    public static final String DOC_TIPO_CONSENTIMIENTO = "consentimiento";
    public static final String DOC_TIPO_RECETA = "receta";
    public static final String DOC_TIPO_INFORME = "informe";
    public static final String DOC_TIPO_ORDEN = "orden";

}
