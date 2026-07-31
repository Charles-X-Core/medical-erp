package com.medicalerp.config;

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

    @Override
    @Transactional
    public void run(String... args) {
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

        Set<Permiso> enfermeraPerms = new HashSet<>();
        enfermeraPerms.add(pRead); enfermeraPerms.add(pWrite);
        enfermeraPerms.add(cRead); enfermeraPerms.add(cWrite);
        enfermeraPerms.add(aRead);
        Rol rolEnfermera = createRolIfNotExists("enfermera", enfermeraPerms);

        // Create admin user
        if (usuarioRepository.findByEmail("admin@clinica.com").isEmpty()) {
            Usuario admin = Usuario.builder()
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
                    .nombre("Dr. Maria Garcia")
                    .email("maria@clinica.com")
                    .password(passwordEncoder.encode("Doctora123"))
                    .activo(true)
                    .roles(new HashSet<>(Set.of(rolDoctora)))
                    .build();
            usuarioRepository.save(doctora);
        }

        // Create test enfermera
        if (usuarioRepository.findByEmail("ana@clinica.com").isEmpty()) {
            Usuario enfermera = Usuario.builder()
                    .nombre("Enfermera Ana Lopez")
                    .email("ana@clinica.com")
                    .password(passwordEncoder.encode("Enfermera123"))
                    .activo(true)
                    .roles(new HashSet<>(Set.of(rolEnfermera)))
                    .build();
            usuarioRepository.save(enfermera);
        }

        System.out.println("=== TEST DATA SEEDED ===");
        System.out.println("Admin: admin@clinica.com / Admin123");
        System.out.println("Doctora: maria@clinica.com / Doctora123");
        System.out.println("Enfermera: ana@clinica.com / Enfermera123");
        System.out.println("========================");
    }

    private Permiso createPermisoIfNotExists(String nombre) {
        return permisoRepository.findByNombre(nombre)
                .orElseGet(() -> permisoRepository.save(Permiso.builder().nombre(nombre).build()));
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
