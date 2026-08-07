package com.medicalerp.config;

import com.medicalerp.clinica.entity.Clinica;
import com.medicalerp.clinica.repository.ClinicaRepository;
import com.medicalerp.tratamiento.entity.TipoSesionTratamiento;
import com.medicalerp.tratamiento.repository.TipoSesionTratamientoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Seeds 22 Optimal Health NOW treatments into TipoSesionTratamiento catalog.
 * Runs for dev and test profiles.
 */
@Component
@Profile({"dev", "test"})
@RequiredArgsConstructor
public class TratamientoDataInitializer implements CommandLineRunner {

    private final TipoSesionTratamientoRepository tipoSesionRepository;
    private final ClinicaRepository clinicaRepository;

    @Override
    @Transactional
    public void run(String... args) {
        Clinica clinica = clinicaRepository.findById(1L).orElse(null);
        if (clinica == null) return;

        if (tipoSesionRepository.findByClinicaIdAndCodigo(clinica.getId(), "PRISTINE").isPresent()) {
            return; // Already seeded
        }

        int orden = 1;

        // Medicina Regenerativa Celular (8)
        createTipoSesion(clinica.getId(), "PRISTINE", "Pristine Autologous Regenerative Cells",
            "Terapias con tus propias células, menor rechazo inmunológico", orden++);
        createTipoSesion(clinica.getId(), "VICELL", "Vicell Regenerative Cells",
            "Regeneración celular con precisión mitocondrial", orden++);
        createTipoSesion(clinica.getId(), "EXOSOMES", "Exosomes",
            "Nanopartículas derivadas de células para regeneración avanzada", orden++);
        createTipoSesion(clinica.getId(), "ESC", "Embryonic Regenerative Cells",
            "Células pluripotentes con potencial ilimitado", orden++);
        createTipoSesion(clinica.getId(), "MSC", "Mesenchymal Regenerative Cells",
            "Células multipotentes para reparación de tejidos", orden++);
        createTipoSesion(clinica.getId(), "PLURIPOTENT", "Pluripotent Regenerative Cells",
            "Células versátiles que pueden convertirse en cualquier tipo celular", orden++);
        createTipoSesion(clinica.getId(), "PRP", "Platelet-Rich Plasma (PRP)",
            "Factores de crecimiento del propio cuerpo para sanación", orden++);
        createTipoSesion(clinica.getId(), "OXYVIT", "Oxygenation & Vitaminization Therapy",
            "Aumento de energía celular y rendimiento físico/mental", orden++);

        // Medicina Estética Celular (6)
        createTipoSesion(clinica.getId(), "FACIAL", "Facial Rejuvenation",
            "Mejora de textura, firmeza y luminosidad de la piel", orden++);
        createTipoSesion(clinica.getId(), "HAIR", "Hair Regeneration",
            "Estimulación de folículos capilares, frenar caída", orden++);
        createTipoSesion(clinica.getId(), "ORTHOPEDIC", "Regenerative Medicine & Orthopedics",
            "Tratamiento de lesiones articulares, tendinitis, artritis", orden++);
        createTipoSesion(clinica.getId(), "WOUND", "Wound & Ulcer Healing",
            "Sanación de heridas crónicas y úlceras diabéticas", orden++);
        createTipoSesion(clinica.getId(), "PLACENTAL", "Placental Cell Therapy",
            "Medicina regenerativa de vanguardia con células de placenta", orden++);
        createTipoSesion(clinica.getId(), "DERMAL", "Rejuvenation Dermal Fillers with Cells",
            "Rellenos dérmicos de nueva generación con células regenerativas", orden++);

        // Medicina Regenerativa Intravenosa (6)
        createTipoSesion(clinica.getId(), "NAD", "NAD Plus Cellular Rejuvenation",
            "Restauración de niveles celulares de NAD Plus", orden++);
        createTipoSesion(clinica.getId(), "GLUT", "Glutathione - Immune System Booster",
            "Antioxidante y potenciador inmunológico", orden++);
        createTipoSesion(clinica.getId(), "MYERS", "Myers Cocktail - Nutritional Therapy",
            "Mezcla potente de nutrientes directo al torrente sanguíneo", orden++);
        createTipoSesion(clinica.getId(), "DETOX", "Detoxification Therapy",
            "Desintoxicación intravenosa con antioxidantes", orden++);
        createTipoSesion(clinica.getId(), "VITC", "Vitamin C - Ascorbic Acid Therapy",
            "Pilar fundamental en terapias regenerativas y antienvejecimiento", orden++);
        createTipoSesion(clinica.getId(), "BONE", "Osteopenia & Bone Fracture Therapy",
            "Terapias regenerativas para salud ósea y cicatrización de fracturas", orden++);

        // Medicina Hormonal Biodéntica (2)
        createTipoSesion(clinica.getId(), "HORM_M", "Men's Hormone Pellets",
            "Terapia de reemplazo hormonal biodéntica para hombres 40+", orden++);
        createTipoSesion(clinica.getId(), "HORM_W", "Women's Hormone Pellets",
            "Terapia de reemplazo hormonal biodéntica para mujeres 35+", orden++);

        System.out.println("=== 22 OPTIMAL HEALTH NOW TREATMENTS SEEDED ===");
    }

    private void createTipoSesion(Long clinicaId, String codigo, String nombre, String descripcion, int orden) {
        tipoSesionRepository.save(TipoSesionTratamiento.builder()
                .clinicaId(clinicaId)
                .codigo(codigo)
                .nombre(nombre)
                .descripcion(descripcion)
                .duracionMinutos(60)
                .requiereProtocolo(false)
                .activo(true)
                .orden(orden)
                .build());
    }
}
