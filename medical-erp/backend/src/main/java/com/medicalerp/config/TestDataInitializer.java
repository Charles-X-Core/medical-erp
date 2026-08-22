package com.medicalerp.config;

import com.medicalerp.clinica.entity.Clinica;
import com.medicalerp.clinica.repository.ClinicaRepository;
import com.medicalerp.seguridad.entity.Permiso;
import com.medicalerp.seguridad.entity.Rol;
import com.medicalerp.seguridad.entity.Usuario;
import com.medicalerp.seguridad.repository.PermisoRepository;
import com.medicalerp.seguridad.repository.RolRepository;
import com.medicalerp.seguridad.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;

/**
 * Test Data Initializer
 * Seeds initial admin user, roles and permissions for manual testing (test profile only)
 */
@Component
@Profile("test")
@RequiredArgsConstructor
public class TestDataInitializer implements CommandLineRunner {

    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final PermisoRepository permisoRepository;
    private final PasswordEncoder passwordEncoder;
    private final ClinicaRepository clinicaRepository;

    @Override
    @Transactional
    public void run(String... args) {
        // Create clinica
        Clinica clinica = clinicaRepository.findById(1L).orElseGet(() ->
            clinicaRepository.save(Clinica.builder()
                .nombre("Clínica Demo - Optimal Health")
                .pais("PE")
                .timezone("America/Lima")
                .moneda("PEN")
                .activa(true)
                .build())
        );

        // Create permissions
        Permiso pRead = createPermisoIfNotExists("paciente:leer");
        Permiso pWrite = createPermisoIfNotExists("paciente:escribir");
        Permiso pDelete = createPermisoIfNotExists("paciente:eliminar");
        Permiso cRead = createPermisoIfNotExists("cita:leer");
        Permiso cWrite = createPermisoIfNotExists("cita:escribir");
        Permiso aRead = createPermisoIfNotExists("agenda:leer");
        Permiso aWrite = createPermisoIfNotExists("agenda:escribir");

        // Create roles
        Set<Permiso> adminPerms = new HashSet<>();
        adminPerms.add(pRead); adminPerms.add(pWrite); adminPerms.add(pDelete);
        adminPerms.add(cRead); adminPerms.add(cWrite);
        adminPerms.add(aRead); adminPerms.add(aWrite);
        Rol rolAdmin = createRolIfNotExists("admin", adminPerms);

        Set<Permiso> doctoraPerms = new HashSet<>();
        doctoraPerms.add(pRead); doctoraPerms.add(pWrite);
        doctoraPerms.add(cRead); doctoraPerms.add(cWrite);
        doctoraPerms.add(aRead); doctoraPerms.add(aWrite);
        Rol rolDoctora = createRolIfNotExists("doctora", doctoraPerms);

        // Create admin user
        if (usuarioRepository.findByEmail("admin@clinica.com").isEmpty()) {
            Usuario admin = Usuario.builder()
                    .clinicaId(clinica.getId())
                    .nombre("Admin Sistema")
                    .email("admin@clinica.com")
                    .password(passwordEncoder.encode("Admin123"))
                    .activo(true)
                    .roles(new HashSet<>(Set.of(rolAdmin)))
                    .build();
            usuarioRepository.save(admin);
        }

        // Create test doctora
        if (usuarioRepository.findByEmail("maria@clinica.com").isEmpty()) {
            Usuario doctora = Usuario.builder()
                    .clinicaId(clinica.getId())
                    .nombre("Dr. Maria Garcia")
                    .email("maria@clinica.com")
                    .password(passwordEncoder.encode("Doctora123"))
                    .activo(true)
                    .roles(new HashSet<>(Set.of(rolDoctora)))
                    .build();
            usuarioRepository.save(doctora);
        }

        System.out.println("=== TEST DATA SEEDED ===");
        System.out.println("Admin: admin@clinica.com / Admin123");
        System.out.println("Doctora: maria@clinica.com / Doctora123");
        System.out.println("========================");
    }

    private Permiso createPermisoIfNotExists(String nombre) {
        return permisoRepository.findByNombre(nombre)
                .orElseGet(() -> {
                    String[] parts = nombre.split(":");
                    String modulo = parts.length > 0 ? parts[0] : "general";
                    String accion = parts.length > 1 ? parts[1] : "acceder";
                    return permisoRepository.save(Permiso.builder()
                            .nombre(nombre)
                            .modulo(modulo)
                            .accion(accion)
                            .build());
                });
    }

    private Rol createRolIfNotExists(String nombre, Set<Permiso> permisos) {
        return rolRepository.findByNombre(nombre)
                .orElseGet(() -> {
                    Rol rol = Rol.builder().nombre(nombre).build();
                    rol.setPermisos(permisos);
                    return rolRepository.save(rol);
                });
    }

}
