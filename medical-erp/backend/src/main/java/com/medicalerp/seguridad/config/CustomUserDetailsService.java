package com.medicalerp.seguridad.config;

import com.medicalerp.seguridad.entity.Usuario;
import com.medicalerp.seguridad.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.stream.Collectors;

/**
 * UserDetailsService Implementation (SEC-002)
 */
@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UsuarioRepository usuarioRepository;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado: " + email));

        return new User(
                usuario.getEmail(),
                usuario.getPassword(),
                usuario.getActivo(),
                true,
                true,
                               true,
                usuario.getRoles().stream()
                        .map(rol -> new SimpleGrantedAuthority("ROLE_" + rol.getNombre().toUpperCase()))
                        .collect(Collectors.toList())
        );
    }

}
