package com.medicalerp.seguridad.mapper;

import com.medicalerp.seguridad.dto.UsuarioResponse;
import com.medicalerp.seguridad.entity.Rol;
import com.medicalerp.seguridad.entity.Usuario;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.Set;
import java.util.stream.Collectors;

@Mapper(componentModel = "spring")
public interface UsuarioMapper {

    @Mapping(target = "roles", expression = "java(mapRoles(usuario.getRoles()))")
    UsuarioResponse toResponse(Usuario usuario);

    default Set<String> mapRoles(Set<Rol> roles) {
        if (roles == null) return null;
        return roles.stream()
                .map(Rol::getNombre)
                .collect(Collectors.toSet());
    }

}
