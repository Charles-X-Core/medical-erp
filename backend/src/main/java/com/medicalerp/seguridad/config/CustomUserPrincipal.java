package com.medicalerp.seguridad.config;

import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.User;

import java.util.Collection;

@Getter
public class CustomUserPrincipal extends User {

    private final Long id;
    private final Long clinicaId;
    private final String role;

    public CustomUserPrincipal(String username, String password,
                               Collection<? extends GrantedAuthority> authorities,
                               Long id, Long clinicaId, String role) {
        super(username, password, authorities);
        this.id = id;
        this.clinicaId = clinicaId;
        this.role = role;
    }
}
