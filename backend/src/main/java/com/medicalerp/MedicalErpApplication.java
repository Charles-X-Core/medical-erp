package com.medicalerp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * Medical ERP Application
 * Spring Boot 3.x + Java 21
 */
@SpringBootApplication
@EnableJpaAuditing
@EnableAsync
public class MedicalErpApplication {

    public static void main(String[] args) {
        SpringApplication.run(MedicalErpApplication.class, args);
    }

}
