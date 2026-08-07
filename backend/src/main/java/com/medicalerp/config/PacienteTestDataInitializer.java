package com.medicalerp.config;

import com.medicalerp.cita.entity.Cita;
import com.medicalerp.cita.repository.CitaRepository;
import com.medicalerp.consulta.entity.Consulta;
import com.medicalerp.consulta.repository.ConsultaRepository;
import com.medicalerp.historia.entity.HistoriaClinica;
import com.medicalerp.historia.repository.HistoriaClinicaRepository;
import com.medicalerp.paciente.entity.Paciente;
import com.medicalerp.paciente.repository.PacienteRepository;
import com.medicalerp.tratamiento.entity.SesionTratamiento;
import com.medicalerp.tratamiento.entity.Tratamiento;
import com.medicalerp.tratamiento.enums.EstadoTratamiento;
import com.medicalerp.tratamiento.repository.SesionTratamientoRepository;
import com.medicalerp.tratamiento.repository.TratamientoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Component
@Profile({"dev", "test"})
@RequiredArgsConstructor
public class PacienteTestDataInitializer implements CommandLineRunner {

    private final PacienteRepository pacienteRepository;
    private final HistoriaClinicaRepository historiaRepository;
    private final TratamientoRepository tratamientoRepository;
    private final SesionTratamientoRepository sesionRepository;
    private final ConsultaRepository consultaRepository;
    private final CitaRepository citaRepository;

    @Override
    @Transactional
    public void run(String... args) {
        // Guard: skip if patients already seeded
        if (pacienteRepository.existsByDni("10000001")) {
            return;
        }

        Long clinicaId = 1L;

        // ==================== PACIENTE 1: María Elena García ====================
        Paciente p1 = createPaciente(clinicaId, "10000001", "María Elena", "García",
            "F", "1981-03-15", "987654321", "maria.garcia@test.com",
            "Av. Los Olivos 123, Lima", "Casada", "Ingeniera Industrial",
            "Jose García", "987111222", "Esposo",
            "Penicilina, Sulfas", "Hipertensión arterial controlada, Diabetes tipo 2",
            "Padre: Hipertensión, Madre: Diabetes", "Miguel García (esposo)");

        HistoriaClinica h1 = createHistoria(p1, "HCL-001",
            "Penicilina", "Hipertensión arterial", "Padre: Hipertensión",
            "Diabetes tipo 2 controlada", "Madre: Diabetes", "No",
            "Antecedente de cirugía de vesícula (2019)", "Paciente estable, en seguimiento");

        // Treatment 1: PRP — EN_CURSO, 6/8 sesiones
        Tratamiento t1a = createTratamiento(clinicaId, p1.getId(), h1.getId(), "PRP",
            "Regeneración de tejido articular rodilla derecha", 8, 6,
            EstadoTratamiento.EN_CURSO, new BigDecimal("2400.00"), "2026-05-01");
        createSesion(t1a.getId(), clinicaId, 1, 2, "2026-05-08", "Evaluación inicial completa", "Sin hallazgos adversos");
        createSesion(t1a.getId(), clinicaId, 2, 2, "2026-05-15", "Primera aplicación PRP", "Leve inflamación post-procedimiento, normal");
        createSesion(t1a.getId(), clinicaId, 3, 2, "2026-05-22", "Segunda aplicación", "Mejora subjetiva reportada");
        createSesion(t1a.getId(), clinicaId, 4, 2, "2026-05-29", "Tercera aplicación", "Redució dosis de analgésicos");
        createSesion(t1a.getId(), clinicaId, 5, 2, "2026-06-05", "Control post-aplicación", "Buena tolerancia general");
        createSesion(t1a.getId(), clinicaId, 6, 2, "2026-06-12", "Cuarta aplicación", "Movilidad mejorada significativamente");

        // Treatment 2: NAD — EN_CURSO, 3/6 sesiones
        Tratamiento t1b = createTratamiento(clinicaId, p1.getId(), h1.getId(), "NAD",
            "Rejuvenecimiento celular, aumento de energía", 6, 3,
            EstadoTratamiento.EN_CURSO, new BigDecimal("1800.00"), "2026-06-01");
        createSesion(t1b.getId(), clinicaId, 1, 2, "2026-06-05", "Primera infusión NAD", "Sin reacciones adversas");
        createSesion(t1b.getId(), clinicaId, 2, 2, "2026-06-12", "Segunda infusión", "Paciente reporta más energía");
        createSesion(t1b.getId(), clinicaId, 3, 2, "2026-06-19", "Tercera infusión", "Mejora en calidad de sueño");

        // Consultas for María
        createConsulta(h1, "2026-01-10", "Dolor articular rodilla derecha", "Evaluación inicial para PRP", "Artrosis incipiente rodilla derecha");
        createConsulta(h1, "2026-02-15", "Seguimiento tratamiento PRP", "Control de evolución", "Buena respuesta al tratamiento");
        createConsulta(h1, "2026-03-20", "Fatiga crónica", "Evaluación para NAD", "Déficit de NAD celular sugerido");
        createConsulta(h1, "2026-04-10", "Control general", "Revisión de ambos tratamientos", "Estable, continuar tratamientos");
        createConsulta(h1, "2026-05-01", "Inicio PRP rodilla", "Primera sesión programada", "Procedimiento sin complicaciones");
        createConsulta(h1, "2026-05-15", "Control post-PRP", "Evolución post-aplicación", "Leve inflamación esperada");
        createConsulta(h1, "2026-06-01", "Inicio NAD", "Primera infusión", "Tolerancia perfecta");
        createConsulta(h1, "2026-06-19", "Control combo PRP+NAD", "Revisión integral", "Paciente muy satisfecha");

        // Cita pendiente
        createCita(p1, "2026-08-15", "10:00", "Quinta sesión PRP rodilla", "pendiente");
        // Cita completada
        createCita(p1, "2026-06-19", "09:00", "Tercera infusión NAD", "completada");

        // ==================== PACIENTE 2: Juan Carlos López ====================
        Paciente p2 = createPaciente(clinicaId, "10000002", "Juan Carlos", "López",
            "M", "1964-07-22", "987654322", "juan.lopez@test.com",
            "Jr. Tacna 456, Lima", "Divorciado", "Abogado",
            "María López", "987222333", "Ex-esposa",
            "No conocidas", "Colesterol alto, Próstata agrandada",
            "Padre: Infarto a los 70", "Carlos López (hijo)");

        HistoriaClinica h2 = createHistoria(p2, "HCL-002",
            "No alergias", "Colesterol alto", "Padre: Infarto",
            "No", "Madre: Sana", "No", "Prostatectomía parcial (2020)", "Paciente controlado con medicación");

        // Treatment: HORM_M — FINALIZADO, 4/4 sesiones
        Tratamiento t2a = createTratamiento(clinicaId, p2.getId(), h2.getId(), "HORM_M",
            "Terapia de reemplazo hormonal biodéntica", 4, 4,
            EstadoTratamiento.FINALIZADO, new BigDecimal("3200.00"), "2026-02-01");
        createSesion(t2a.getId(), clinicaId, 1, 1, "2026-02-05", "Evaluación hormonal completa", "Niveles de testosterona bajos confirmados");
        createSesion(t2a.getId(), clinicaId, 2, 2, "2026-02-19", "Implante pellets", "Procedimiento exitoso, sin complicaciones");
        createSesion(t2a.getId(), clinicaId, 3, 3, "2026-03-19", "Control post-implante", "Niveles en rango óptimo");
        createSesion(t2a.getId(), clinicaId, 4, 5, "2026-04-16", "Cierre tratamiento", "Resultado excelente, paciente satisfecho");

        // Treatment 2: MYERS — EN_CURSO, 2/4 sesiones
        Tratamiento t2b = createTratamiento(clinicaId, p2.getId(), h2.getId(), "MYERS",
            "Cóctel de Myers — terapia nutricional", 4, 2,
            EstadoTratamiento.EN_CURSO, new BigDecimal("800.00"), "2026-06-15");
        createSesion(t2b.getId(), clinicaId, 1, 2, "2026-06-18", "Primera infusión Myers", "Sin reacciones adversas");
        createSesion(t2b.getId(), clinicaId, 2, 2, "2026-07-02", "Segunda infusión", "Mejora en energía reportada");

        createConsulta(h2, "2026-01-20", "Evaluación hormonal", "Síntomas de déficit de testosterona", "Déficit confirmado");
        createConsulta(h2, "2026-02-05", "Inicio terapia hormonal", "Implante de pellets", "Procedimiento exitoso");
        createConsulta(h2, "2026-03-19", "Control hormonal", "Revisión de niveles", "En rango óptimo");
        createConsulta(h2, "2026-04-16", "Cierre tratamiento hormonal", "Evaluación final", "Resultado excelente");
        createConsulta(h2, "2026-06-15", "Inicio Myers Cocktail", "Terapia nutricional", "Primera infusión");

        createCita(p2, "2026-07-16", "11:00", "Tercera infusión Myers", "completada");

        // ==================== PACIENTE 3: Ana Sofía Martínez ====================
        Paciente p3 = createPaciente(clinicaId, "10000003", "Ana Sofía", "Martínez",
            "F", "1988-11-08", "987654323", "ana.martinez@test.com",
            "Calle Las Flores 789, Miraflores", "Soltera", "Diseñadora Gráfica",
            "Pedro Martínez", "987333444", "Padre",
            "Ibuprofeno", "Migraña crónica", "Madre: Migraña",
            "Andrea Martínez (hermana)");

        HistoriaClinica h3 = createHistoria(p3, "HCL-003",
            "Ibuprofeno", "Migraña crónica", "Madre: Migraña",
            "No", "Padre: Sano", "No", "Sin cirugías previas", "Paciente joven, migraña controlada");

        // Treatment: EXOSOMES — PROGRAMADO, 0/3 sesiones
        Tratamiento t3a = createTratamiento(clinicaId, p3.getId(), h3.getId(), "EXOSOMES",
            "Terapia con exosomas para migraña", 3, 0,
            EstadoTratamiento.PROGRAMADO, new BigDecimal("2700.00"), null);

        createConsulta(h3, "2026-06-01", "Migraña crónica", "Evaluación para terapia con exosomas", "Candidata ideal para exosomas");
        createConsulta(h3, "2026-06-20", "Segunda evaluación", "Confirmación de tratamiento", "Paciente decide iniciar");

        // ==================== PACIENTE 4: Roberto Díaz Silva ====================
        Paciente p4 = createPaciente(clinicaId, "10000004", "Roberto", "Díaz Silva",
            "M", "1971-04-30", "987654324", "roberto.diaz@test.com",
            "Av. Javier Prado 1010, San Isidro", "Casado", "Médico Cirujano",
            "Laura Díaz", "987444555", "Esposa",
            "No conocidas", "Artrosis de cadera, Hipertensión",
            "Madre: Artritis reumatoide", "Roberto Díaz Jr. (hijo)");

        HistoriaClinica h4 = createHistoria(p4, "HCL-004",
            "No alergias", "Artrosis de cadera, Hipertensión arterial", "Madre: Artritis reumatoide",
            "No", "Padre: Sano", "No", "Artroscopia de rodilla (2018)", "Médico, muy compliance con tratamiento");

        // Treatment: ORTHOPEDIC — PAUSADO, 2/6 sesiones
        Tratamiento t4a = createTratamiento(clinicaId, p4.getId(), h4.getId(), "ORTHOPEDIC",
            "Tratamiento regenerativo artrosis cadera", 6, 2,
            EstadoTratamiento.PAUSADO, new BigDecimal("3600.00"), "2026-04-01");
        createSesion(t4a.getId(), clinicaId, 1, 1, "2026-04-05", "Evaluación ortopédica", "Artrosis grado II confirmada");
        createSesion(t4a.getId(), clinicaId, 2, 2, "2026-04-19", "Primera aplicación", "Leve dolor post-procedimiento");

        createConsulta(h4, "2026-03-15", "Dolor cadera", "Evaluación para medicina regenerativa", "Artrosis grado II");
        createConsulta(h4, "2026-04-05", "Inicio tratamiento ortopédico", "Primera sesión", "Procedimiento exitoso");
        createConsulta(h4, "2026-04-19", "Control post-aplicación", "Evolución", "Paciente decide pausar por viaje");

        // ==================== PACIENTE 5: Carmen Rosa Flores ====================
        Paciente p5 = createPaciente(clinicaId, "10000005", "Carmen Rosa", "Flores",
            "F", "1956-09-12", "987654325", "carmen.flores@test.com",
            "Calle San Martín 234, Barranco", "Viuda", "Profesora Jubilada",
            "Miguel Flores", "987555666", "Hijo",
            "Metformina", "Diabetes tipo 2, Osteopenia", "Padre: Diabetes",
            "Lucía Flores (hija)");

        HistoriaClinica h5 = createHistoria(p5, "HCL-005",
            "Metformina (intolerancia leve)", "Diabetes tipo 2, Osteopenia", "Padre: Diabetes",
            "Diabetes tipo 2", "Madre: Osteoporosis", "No", "Cesárea (1985), Apendicectomía (1992)", "Paciente con多个 comorbilidades, seguimiento estrecho");

        // Treatment 1: BONE — FINALIZADO, 4/4 sesiones
        Tratamiento t5a = createTratamiento(clinicaId, p5.getId(), h5.getId(), "BONE",
            "Terapia regenerativa ósea para osteopenia", 4, 4,
            EstadoTratamiento.FINALIZADO, new BigDecimal("1600.00"), "2026-01-15");
        createSesion(t5a.getId(), clinicaId, 1, 1, "2026-01-20", "Evaluación ósea", "Densitometría: osteopenia lumbar");
        createSesion(t5a.getId(), clinicaId, 2, 2, "2026-02-03", "Primera infusión", "Sin reacciones");
        createSesion(t5a.getId(), clinicaId, 3, 2, "2026-02-17", "Segunda infusión", "Mejora en marcadores");
        createSesion(t5a.getId(), clinicaId, 4, 5, "2026-03-03", "Cierre tratamiento", "Resultados satisfactorios");

        // Treatment 2: EXOSOMES — EN_CURSO, 1/5 sesiones
        Tratamiento t5b = createTratamiento(clinicaId, p5.getId(), h5.getId(), "EXOSOMES",
            "Exosomas para rejuvenecimiento celular avanzado", 5, 1,
            EstadoTratamiento.EN_CURSO, new BigDecimal("4500.00"), "2026-07-01");
        createSesion(t5b.getId(), clinicaId, 1, 1, "2026-07-05", "Evaluación inicial", "Paciente candidata idónea");

        createConsulta(h5, "2026-01-10", "Osteopenia", "Evaluación para terapia ósea", "Iniciar tratamiento BONE");
        createConsulta(h5, "2026-01-20", "Inicio BONE", "Primera infusión", "Procedimiento sin incidentes");
        createConsulta(h5, "2026-02-03", "Segunda infusión BONE", "Control", "Tolerancia excelente");
        createConsulta(h5, "2026-03-03", "Cierre BONE", "Evaluación final", "Resultados positivos");
        createConsulta(h5, "2026-06-20", "Nueva consulta", "Interés en exosomas", "Evaluación para nuevo tratamiento");
        createConsulta(h5, "2026-07-01", "Inicio exosomas", "Primera sesión", "Paciente informada y consentida");

        createCita(p5, "2026-08-01", "14:00", "Segunda sesión exosomas", "pendiente");

        // ==================== PACIENTE 6: Luis Fernando Torres ====================
        Paciente p6 = createPaciente(clinicaId, "10000006", "Luis Fernando", "Torres",
            "M", "1998-01-25", "987654326", "luis.torres@test.com",
            "Av. La Marina 567, San Miguel", "Soltero", "Modelo",
            "Carmen Torres", "987666777", "Madre",
            "No conocidas", "Acné quístico severo", "No familares relevantes",
            "Sofía Torres (hermana)");

        HistoriaClinica h6 = createHistoria(p6, "HCL-006",
            "No alergias", "Acné quístico severo", "No relevantes",
            "No", "No", "No", "No cirugías", "Paciente joven, acné resistente a tratamientos tópicos");

        // Treatment: FACIAL — EN_CURSO, 2/4 sesiones
        Tratamiento t6a = createTratamiento(clinicaId, p6.getId(), h6.getId(), "FACIAL",
            "Rejuvenecimiento facial y tratamiento acné", 4, 2,
            EstadoTratamiento.EN_CURSO, new BigDecimal("2000.00"), "2026-06-15");
        createSesion(t6a.getId(), clinicaId, 1, 1, "2026-06-18", "Evaluación facial", "Acné quístico activo, cicatrices");
        createSesion(t6a.getId(), clinicaId, 2, 2, "2026-07-02", "Primera aplicación facial", "Leve enrojecimientopost-procedimiento");

        createConsulta(h6, "2026-06-10", "Acné quístico", "Evaluación para rejuvenecimiento facial", "Candidato a FACIAL");
        createConsulta(h6, "2026-06-18", "Inicio FACIAL", "Primera sesión", "Procedimiento exitoso");

        // ==================== PACIENTE 7: Patricia Mendoza ====================
        Paciente p7 = createPaciente(clinicaId, "10000007", "Patricia", "Mendoza",
            "F", "1990-06-18", "987654327", "patricia.mendoza@test.com",
            "Calle Los Pinos 890, La Molina", "Soltera", "Contadora",
            "Raúl Mendoza", "987777888", "Padre",
            "No conocidas", "Sin antecedentes relevantes", "No relevantes",
            "Diego Mendoza (hermano)");

        HistoriaClinica h7 = createHistoria(p7, "HCL-007",
            "No alergias", "Sin antecedentes", "No relevantes",
            "No", "No", "No", "No cirugías", "Paciente sana, sin tratamientos activos");

        // No treatments — just registered
        createConsulta(h7, "2026-07-01", "Consulta general", "Primera vez en la clínica", "Paciente sana, sin hallazgos");

        // ==================== PACIENTE 8: Fernando Castillo ====================
        Paciente p8 = createPaciente(clinicaId, "10000008", "Fernando", "Castillo",
            "M", "1976-12-03", "987654328", "fernando.castillo@test.com",
            "Jr. Unión 345, Cercado", "Casado", "Empresario",
            "Rosa Castillo", "987888999", "Esposa",
            "No conocidas", "Estrés crónico, Insomnio, Dolor lumbar", "Padre: Cáncer de colon",
            "Ana Castillo (hermana)");

        HistoriaClinica h8 = createHistoria(p8, "HCL-008",
            "No alergias", "Estrés crónico, Insomnio", "Padre: Cáncer de colon",
            "No", "Madre: Sana", "No", "Hernia discal L4-L5 (2019)", "Paciente con múltiples factores de estrés");

        // Treatment 1: DETOX — EN_CURSO, 3/4 sesiones
        Tratamiento t8a = createTratamiento(clinicaId, p8.getId(), h8.getId(), "DETOX",
            "Desintoxicación intravenosa para estrés crónico", 4, 3,
            EstadoTratamiento.EN_CURSO, new BigDecimal("1200.00"), "2026-05-10");
        createSesion(t8a.getId(), clinicaId, 1, 2, "2026-05-14", "Evaluación y primera infusión", "Paciente relajado post-infusión");
        createSesion(t8a.getId(), clinicaId, 2, 2, "2026-05-28", "Segunda infusión", "Mejora en calidad de sueño");
        createSesion(t8a.getId(), clinicaId, 3, 2, "2026-06-11", "Tercera infusión", "Reducción notable de estrés");

        // Treatment 2: PRP — FINALIZADO, 3/3 sesiones
        Tratamiento t8b = createTratamiento(clinicaId, p8.getId(), h8.getId(), "PRP",
            "PRP para dolor lumbar crónico", 3, 3,
            EstadoTratamiento.FINALIZADO, new BigDecimal("900.00"), "2026-03-01");
        createSesion(t8b.getId(), clinicaId, 1, 1, "2026-03-05", "Evaluación lumbar", "Hernia discal L4-L5 estable");
        createSesion(t8b.getId(), clinicaId, 2, 2, "2026-03-19", "Aplicación PRP lumbar", "Procedimiento sin complicaciones");
        createSesion(t8b.getId(), clinicaId, 3, 5, "2026-04-02", "Cierre PRP lumbar", "Dolor reducido 70%");

        // Treatment 3: GLUT — CANCELADO
        Tratamiento t8c = createTratamiento(clinicaId, p8.getId(), h8.getId(), "GLUT",
            "Glutatión — potenciador inmunológico", 4, 0,
            EstadoTratamiento.CANCELADO, new BigDecimal("800.00"), null);

        createConsulta(h8, "2026-02-10", "Estrés e insomnio", "Primera consulta", "Estrés laboral severo");
        createConsulta(h8, "2026-03-01", "Dolor lumbar", "Evaluación para PRP", "Hernia discal conocida");
        createConsulta(h8, "2026-03-05", "Inicio PRP lumbar", "Primera sesión", "Procedimiento exitoso");
        createConsulta(h8, "2026-04-02", "Cierre PRP", "Evaluación final", "Dolor reducido significativamente");
        createConsulta(h8, "2026-05-10", "Desintoxicación", "Evaluación para DETOX", "Iniciar terapia IV");
        createConsulta(h8, "2026-05-14", "Inicio DETOX", "Primera infusión", "Tolerancia excelente");
        createConsulta(h8, "2026-05-28", "Segunda infusión DETOX", "Control", "Mejora subjetiva");
        createConsulta(h8, "2026-06-11", "Tercera infusión DETOX", "Control", "Paciente satisfecho");
        createConsulta(h8, "2026-06-25", "Evaluación GLUT", "Interés en glutatión", "Decide cancelar por costo");
        createConsulta(h8, "2026-07-01", "Control general", "Revisión de tratamientos", "Estable, continuar DETOX");

        createCita(p8, "2026-07-25", "10:30", "Cuarta infusión DETOX", "pendiente");

        // ==================== PACIENTE 9: Gabriela Ruiz ====================
        Paciente p9 = createPaciente(clinicaId, "10000009", "Gabriela", "Ruiz",
            "F", "1991-08-14", "987654329", "gabriela.ruiz@test.com",
            "Av. Angamos 678, Surquillo", "Soltera", "Nutricionista",
            "Fernando Ruiz", "987999000", "Padre",
            "No conocidas", "Fatiga crónica, Déficit vitamínico", "Madre: Hipotiroidismo",
            "Camila Ruiz (hermana)");

        HistoriaClinica h9 = createHistoria(p9, "HCL-009",
            "No alergias", "Fatiga crónica, Déficit de Vitamina D", "Madre: Hipotiroidismo",
            "No", "Padre: Sano", "No", "No cirugías", "Paciente joven, déficit nutricional");

        // Treatment: OXYVIT — EN_CURSO, 4/6 sesiones
        Tratamiento t9a = createTratamiento(clinicaId, p9.getId(), h9.getId(), "OXYVIT",
            "Oxigenación y vitaminización celular", 6, 4,
            EstadoTratamiento.EN_CURSO, new BigDecimal("1800.00"), "2026-05-20");
        createSesion(t9a.getId(), clinicaId, 1, 1, "2026-05-23", "Evaluación nutricional", "Déficit Vitamina D severo");
        createSesion(t9a.getId(), clinicaId, 2, 2, "2026-06-06", "Primera infusión vitamínica", "Sin reacciones");
        createSesion(t9a.getId(), clinicaId, 3, 2, "2026-06-20", "Segunda infusión", "Paciente reporta más energía");
        createSesion(t9a.getId(), clinicaId, 4, 2, "2026-07-04", "Tercera infusión", "Niveles de Vitamina D mejorados");

        createConsulta(h9, "2026-05-15", "Fatiga crónica", "Evaluación nutricional", "Déficit Vitamina D severo");
        createConsulta(h9, "2026-05-20", "Inicio OXYVIT", "Primera sesión", "Plan de 6 sesiones");
        createConsulta(h9, "2026-06-06", "Segunda infusión", "Control", "Mejora notable");
        createConsulta(h9, "2026-06-20", "Tercera infusión", "Control", "Energía mejorada");
        createConsulta(h9, "2026-07-04", "Cuarta infusión", "Control", "En progreso, buena evolución");

        createCita(p9, "2026-07-18", "09:30", "Quinta infusión OXYVIT", "completada");
        createCita(p9, "2026-08-01", "09:30", "Sexta infusión OXYVIT", "pendiente");

        // ==================== PACIENTE 10: Miguel Ángel Herrera ====================
        Paciente p10 = createPaciente(clinicaId, "10000010", "Miguel Ángel", "Herrera",
            "M", "1968-02-28", "987654330", "miguel.herrera@test.com",
            "Calle Argolla 123, Pueblo Libre", "Casado", "Ingeniero de Sistemas",
            "Sandra Herrera", "987000111", "Esposa",
            "No conocadas", "Hipertensión arterial, Sobrepeso", "Padre: Infarto",
            "Miguel Herrera Jr. (hijo)");

        HistoriaClinica h10 = createHistoria(p10, "HCL-010",
            "No alergias", "Hipertensión arterial, Sobrepeso", "Padre: Infarto a los 65",
            "No", "Madre: Hipertensión", "No", "Apendicectomía (1995)", "Paciente confactores de riesgo cardiovascular");

        // Treatment: MYERS — FINALIZADO, 4/4 sesiones
        Tratamiento t10a = createTratamiento(clinicaId, p10.getId(), h10.getId(), "MYERS",
            "Cóctel de Myers — mejora nutricional general", 4, 4,
            EstadoTratamiento.FINALIZADO, new BigDecimal("800.00"), "2026-03-10");
        createSesion(t10a.getId(), clinicaId, 1, 1, "2026-03-14", "Evaluación nutricional", "Déficits múltiples");
        createSesion(t10a.getId(), clinicaId, 2, 2, "2026-03-28", "Primera infusión", "Sin reacciones");
        createSesion(t10a.getId(), clinicaId, 3, 2, "2026-04-11", "Segunda infusión", "Mejora en energía");
        createSesion(t10a.getId(), clinicaId, 4, 5, "2026-04-25", "Cierre Myers", "Resultados positivos");

        createConsulta(h10, "2026-03-05", "Evaluación general", "Consulta preventiva", "Factores de riesgo CV");
        createConsulta(h10, "2026-03-10", "Inicio Myers", "Terapia nutricional", "Plan de 4 sesiones");
        createConsulta(h10, "2026-03-28", "Segunda infusión Myers", "Control", "Tolerancia excelente");
        createConsulta(h10, "2026-04-25", "Cierre Myers", "Evaluación final", "Paciente satisfecho");

        System.out.println("=== 10 TEST PATIENTS SEEDED ===");
    }

    // ==================== HELPER METHODS ====================

    private Paciente createPaciente(Long clinicaId, String dni, String nombres, String apellido,
                                     String sexo, String fechaNac, String telefono, String email,
                                     String direccion, String estadoCivil, String ocupacion,
                                     String contactoEmerg, String telEmerg, String parentesco,
                                     String alergias, String antPersonales, String antFamiliares,
                                     String acompanante) {
        return pacienteRepository.save(Paciente.builder()
                .clinicaId(clinicaId)
                .nombres(nombres)
                .apellidoPaterno(apellido)
                .tipoDocumento("dni")
                .dni(dni)
                .telefono(telefono)
                .email(email)
                .fechaNacimiento(LocalDate.parse(fechaNac))
                .sexo(sexo)
                .estadoCivil(estadoCivil)
                .direccionLinea1(direccion)
                .direccionPais("PE")
                .ciudad("Lima")
                .estadoProvincia("Lima")
                .ocupacion(ocupacion)
                .nombreAcompanante(acompanante)
                .contactoEmergencia(contactoEmerg)
                .telefonoEmergencia(telEmerg)
                .parentescoEmergencia(parentesco)
                .alergias(alergias)
                .antecedentesPersonales(antPersonales)
                .antecedentesFamiliares(antFamiliares)
                .estado("activo")
                .build());
    }

    private HistoriaClinica createHistoria(Paciente paciente, String numero,
                                            String alergias, String cardiopatias, String cardiopatiasFam,
                                            String diabetes, String diabetesFam, String hepatitis,
                                            String otrasEnf, String observaciones) {
        return historiaRepository.save(HistoriaClinica.builder()
                .paciente(paciente)
                .numeroHistoria(numero)
                .alergiaMedicamentos(alergias)
                .cardiopatiasPersonales(cardiopatias)
                .cardiopatiasFamiliares(cardiopatiasFam)
                .diabetesPersonal(diabetes)
                .diabetesFamiliar(diabetesFam)
                .hepatitis(hepatitis)
                .otrasEnfermedades(otrasEnf)
                .observaciones(observaciones)
                .build());
    }

    private Tratamiento createTratamiento(Long clinicaId, Long pacienteId, Long historiaId,
                                           String tipoTratamiento, String objetivo,
                                           int planeadas, int realizadas,
                                           EstadoTratamiento estado, BigDecimal costo,
                                           String fechaInicio) {
        Tratamiento t = Tratamiento.builder()
                .clinicaId(clinicaId)
                .pacienteId(pacienteId)
                .historiaClinicaId(historiaId)
                .tipoTratamiento(tipoTratamiento)
                .objetivo(objetivo)
                .sesionesPlaneadas(planeadas)
                .sesionesRealizadas(realizadas)
                .estado(estado)
                .costoEstimado(costo)
                .build();
        if (fechaInicio != null) {
            t.setFechaInicio(LocalDate.parse(fechaInicio));
        }
        if (estado == EstadoTratamiento.FINALIZADO) {
            t.setFechaFin(LocalDate.now());
            t.setResultadoFinal("Tratamiento completado satisfactoriamente");
        }
        return tratamientoRepository.save(t);
    }

    private SesionTratamiento createSesion(Long tratamientoId, Long clinicaId,
                                            int numero, int tipoSesionId,
                                            String fecha, String evolucion, String observaciones) {
        return sesionRepository.save(SesionTratamiento.builder()
                .tratamientoId(tratamientoId)
                .clinicaId(clinicaId)
                .tipoSesionId((long) tipoSesionId)
                .numeroSesion(numero)
                .fecha(LocalDateTime.parse(fecha + "T10:00:00"))
                .evolucion(evolucion)
                .observaciones(observaciones)
                .costoSesion(BigDecimal.ZERO)
                .requiereCita(true)
                .build());
    }

    private Consulta createConsulta(HistoriaClinica historia, String fecha, String motivo,
                                     String signosSintomas, String diagnostico) {
        return consultaRepository.save(Consulta.builder()
                .historia(historia)
                .fecha(LocalDateTime.parse(fecha + "T09:00:00"))
                .motivo(motivo)
                .signosSintomas(signosSintomas)
                .diagnosticoLista("[{\"descripcion\":\"" + diagnostico + "\",\"principal\":true}]")
                .build());
    }

    private void createCita(Paciente paciente, String fecha, String hora, String motivo, String estado) {
        LocalDateTime fechaHora = LocalDateTime.parse(fecha + "T" + hora + ":00");
        Cita cita = new Cita();
        cita.setPaciente(paciente);
        cita.setFechaHora(fechaHora);
        cita.setMotivo(motivo);
        cita.setEstado(estado);
        cita.setPrioridad("NORMAL");
        cita.setDuracionMinutos(30);
        citaRepository.save(cita);
    }
}
