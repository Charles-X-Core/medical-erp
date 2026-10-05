package com.medicalerp.tratamiento.util;

import java.util.Map;
import java.util.LinkedHashMap;

/**
 * Catálogo de nombres completos de tratamientos.
 *
 * Igual al catálogo del frontend (frontend/src/config/attentionTypes.js) pero en Java,
 * para poder resolver el nombre completo de una terapia a partir de su código
 * (ej. "OXYVIT" -> "Oxygenation & Vitaminization Therapy") desde el backend
 * (motivo de cita, correos, etc.).
 */
public final class TratamientoNombres {

    private static final Map<String, String> NOMBRES = new LinkedHashMap<>();
    static {
        // Medicina Regenerativa Celular
        NOMBRES.put("PRISTINE", "Pristine Autologous Regenerative Cells");
        NOMBRES.put("VICELL", "Vicell Regenerative Cells");
        NOMBRES.put("EXOSOMES", "Exosomes");
        NOMBRES.put("ESC", "Embryonic Regenerative Cells");
        NOMBRES.put("MSC", "Mesenchymal Regenerative Cells");
        NOMBRES.put("PLURIPOTENT", "Pluripotent Regenerative Cells");
        NOMBRES.put("PRP", "Platelet-Rich Plasma (PRP)");
        NOMBRES.put("OXYVIT", "Oxygenation & Vitaminization Therapy");
        // Medicina Estética Celular
        NOMBRES.put("FACIAL", "Facial Rejuvenation");
        NOMBRES.put("HAIR", "Hair Regeneration");
        NOMBRES.put("ORTHOPEDIC", "Regenerative Medicine & Orthopedics");
        NOMBRES.put("WOUND", "Wound & Ulcer Healing");
        NOMBRES.put("PLACENTAL", "Placental Cell Therapy");
        NOMBRES.put("DERMAL", "Rejuvenation Dermal Fillers with Cells");
        // Medicina Regenerativa Intravenosa
        NOMBRES.put("NAD", "NAD Plus Cellular Rejuvenation");
        NOMBRES.put("GLUT", "Glutathione - Immune System Booster");
        NOMBRES.put("MYERS", "Myers Cocktail - Nutritional Therapy");
        NOMBRES.put("DETOX", "Detoxification Therapy");
        NOMBRES.put("VITC", "Vitamin C - Ascorbic Acid Therapy");
        NOMBRES.put("BONE", "Osteopenia & Bone Fracture Therapy");
        // Medicina Hormonal Biodéntica
        NOMBRES.put("HORM_M", "Men's Hormone Pellets");
        NOMBRES.put("HORM_W", "Women's Hormone Pellets");
    }

    private TratamientoNombres() {
    }

    /**
     * Devuelve el nombre completo del tratamiento a partir de su código.
     * Si el código no está en el catálogo, devuelve el código tal cual (fallback).
     */
    public static String nombre(String codigo) {
        if (codigo == null) {
            return null;
        }
        return NOMBRES.getOrDefault(codigo.trim(), codigo);
    }
}
