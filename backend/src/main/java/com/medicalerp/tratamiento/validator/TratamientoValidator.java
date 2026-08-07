package com.medicalerp.tratamiento.validator;

import com.medicalerp.common.exception.BusinessRuleException;
import com.medicalerp.tratamiento.dto.EstadoTratamientoRequest;
import com.medicalerp.tratamiento.dto.TratamientoRequest;
import com.medicalerp.tratamiento.entity.Tratamiento;
import com.medicalerp.tratamiento.enums.EstadoTratamiento;
import org.springframework.stereotype.Component;

/**
 * TratamientoValidator
 * Validaciones de negocio para tratamientos
 */
@Component
public class TratamientoValidator {

    public void validarCreacion(TratamientoRequest request) {
        if (request.getPacienteId() == null) {
            throw new BusinessRuleException("BR-TRAT-VAL-001", "El paciente es requerido");
        }
        if (request.getTipoTratamiento() == null || request.getTipoTratamiento().isBlank()) {
            throw new BusinessRuleException("BR-TRAT-VAL-002", "El tipo de tratamiento es requerido");
        }
        if (request.getObjetivo() == null || request.getObjetivo().isBlank()) {
            throw new BusinessRuleException("BR-TRAT-VAL-003", "El objetivo es requerido");
        }
        if (request.getSesionesPlaneadas() == null || request.getSesionesPlaneadas() < 1) {
            throw new BusinessRuleException("BR-TRAT-VAL-004", "Minimo 1 sesion planeada");
        }
    }

    public void validarCambioEstado(Tratamiento tratamiento, EstadoTratamientoRequest request) {
        if (tratamiento.getEstado() == EstadoTratamiento.FINALIZADO
                || tratamiento.getEstado() == EstadoTratamiento.CANCELADO) {
            throw new BusinessRuleException("BR-TRAT-VAL-005",
                    "No se puede cambiar estado de un tratamiento " + tratamiento.getEstado().name().toLowerCase());
        }
    }

    public void validarTransicion(EstadoTratamiento actual, String accion) {
        boolean valido = switch (accion.toUpperCase()) {
            case "PROGRAMAR" -> actual == EstadoTratamiento.PENDIENTE;
            case "INICIAR" -> actual == EstadoTratamiento.PROGRAMADO;
            case "PAUSAR" -> actual == EstadoTratamiento.EN_CURSO;
            case "REANUDAR" -> actual == EstadoTratamiento.PAUSADO;
            case "FINALIZAR" -> actual == EstadoTratamiento.EN_CURSO || actual == EstadoTratamiento.PAUSADO;
            case "CANCELAR" -> actual != EstadoTratamiento.FINALIZADO && actual != EstadoTratamiento.CANCELADO;
            default -> false;
        };

        if (!valido) {
            throw new BusinessRuleException("BR-TRAT-VAL-006",
                    "Transicion no valida: " + actual.name() + " -> " + accion);
        }
    }

}
