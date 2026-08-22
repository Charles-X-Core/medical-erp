package com.medicalerp.paciente.dto;

import lombok.Data;

/**
 * Resultado de importación masiva de pacientes
 */
@Data
public class ImportResult {
    private int totalFilas;
    private int importados;
    private int saltados;
    private int errores;
    private java.util.List<String> mensajesError = new java.util.ArrayList<>();
    private java.util.List<String> pacientesImportados = new java.util.ArrayList<>();
    private java.util.List<String> pacientesSaltados = new java.util.ArrayList<>();

    public void addImportado(String nombre) {
        importados++;
        pacientesImportados.add(nombre);
    }

    public void addSaltado(String nombre, String motivo) {
        saltados++;
        pacientesSaltados.add(nombre + " — " + motivo);
    }

    public void addError(String fila, String error) {
        errores++;
        mensajesError.add("Fila " + fila + ": " + error);
    }
}
