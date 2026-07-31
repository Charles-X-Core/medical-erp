package com.medicalerp.seguridad.controller;

import com.medicalerp.common.dto.ApiResponse;
import com.medicalerp.seguridad.dto.UsuarioRequest;
import com.medicalerp.seguridad.dto.UsuarioResponse;
import com.medicalerp.seguridad.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * User Management Controller (API-002) - Admin Only
 */
@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class UsuarioController {

    private final AuthService authService;

    @PostMapping
    public ResponseEntity<ApiResponse<UsuarioResponse>> create(@Valid @RequestBody UsuarioRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(authService.createUser(request), "Usuario creado exitosamente"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<UsuarioResponse>>> getAll(Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(authService.getAllUsers(pageable)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UsuarioResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(authService.getUserById(id)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<UsuarioResponse>> update(@PathVariable Long id, @Valid @RequestBody UsuarioRequest request) {
        return ResponseEntity.ok(ApiResponse.success(authService.updateUser(id, request), "Usuario actualizado"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        authService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/activate")
    public ResponseEntity<ApiResponse<Void>> activate(@PathVariable Long id) {
        authService.activateUser(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Usuario activado"));
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<ApiResponse<Void>> deactivate(@PathVariable Long id) {
        authService.deactivateUser(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Usuario desactivado"));
    }

    @PatchMapping("/{id}/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(@PathVariable Long id, @RequestParam String newPassword) {
        authService.resetPassword(id, newPassword);
        return ResponseEntity.ok(ApiResponse.success(null, "Contraseña restablecida"));
    }

}
