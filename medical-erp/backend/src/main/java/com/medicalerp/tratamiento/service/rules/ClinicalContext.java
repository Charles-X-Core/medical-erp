package com.medicalerp.tratamiento.service.rules;

import com.medicalerp.tratamiento.entity.ProtocoloClinico;
import com.medicalerp.tratamiento.entity.SesionTratamiento;
import com.medicalerp.tratamiento.entity.Tratamiento;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

/**
 * ClinicalContext
 * Contexto de evaluacion para las reglas clinicas
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClinicalContext {

    private Tratamiento tratamiento;
    private ProtocoloClinico protocolo;
    private List<SesionTratamiento> sesiones;
    private SesionTratamiento ultimaSesion;
    private Long clinicaId;
    private Instant now;

}
