package com.medicalerp.config;

import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class PaisConfigService {

    private final Map<String, PaisConfig> configs;

    public PaisConfigService() {
        configs = Map.of(
                "PE", new PaisConfig(
                        "PE",
                        "Perú",
                        "America/Lima",
                        "PEN",
                        true,
                        List.of(
                                new PaisConfig.TipoDocumentoConfig("DNI", "DNI", 8, "^\\d{8}$"),
                                new PaisConfig.TipoDocumentoConfig("CE", "Carné de Extranjería", 12, "^[a-zA-Z0-9]+$"),
                                new PaisConfig.TipoDocumentoConfig("PASSPORT", "Pasaporte", 20, "^[a-zA-Z0-9]+")
                        ),
                        "DNI",
                        false,
                        List.of(),
                        new PaisConfig.ConsentConfig(false, List.of())
                ),
                "US", new PaisConfig(
                        "US",
                        "United States",
                        "America/New_York",
                        "USD",
                        true,
                        List.of(
                                new PaisConfig.TipoDocumentoConfig("SSN", "Social Security Number", 11, "^\\d{3}-?\\d{2}-?\\d{4}$"),
                                new PaisConfig.TipoDocumentoConfig("ITIN", "ITIN", 10, "^\\d{2}-?\\d{7}$"),
                                new PaisConfig.TipoDocumentoConfig("DL", "Driver's License", 20, "^[a-zA-Z0-9]+$"),
                                new PaisConfig.TipoDocumentoConfig("PASSPORT", "Passport", 20, "^[a-zA-Z0-9]+$"),
                                new PaisConfig.TipoDocumentoConfig("INSURANCE_CARD", "Insurance Card", 20, "^[a-zA-Z0-9]+")
                        ),
                        "SSN",
                        true,
                        List.of("PRINCIPAL", "SECUNDARIO", "SUPLEMENTARIO"),
                        new PaisConfig.ConsentConfig(true, List.of(
                                new PaisConfig.TipoConsentimiento("TRATAMIENTO", "Consentimiento de Tratamiento"),
                                new PaisConfig.TipoConsentimiento("PRIVACIDAD", "Aviso de Privacidad (HIPAA)"),
                                new PaisConfig.TipoConsentimiento("INFORMADO", "Consentimiento Informado")
                        ))
                )
        );
    }

    public PaisConfig getConfig(String pais) {
        return configs.getOrDefault(pais, configs.get("PE"));
    }

    public List<PaisConfig> getAllConfigs() {
        return List.copyOf(configs.values());
    }
}
