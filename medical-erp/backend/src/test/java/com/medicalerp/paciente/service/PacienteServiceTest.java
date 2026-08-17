package com.medicalerp.paciente.service;

import com.medicalerp.common.exception.BusinessRuleException;
import com.medicalerp.common.exception.DuplicateResourceException;
import com.medicalerp.common.exception.ResourceNotFoundException;
import com.medicalerp.paciente.dto.PacienteRequest;
import com.medicalerp.paciente.dto.PacienteResponse;
import com.medicalerp.paciente.entity.Paciente;
import com.medicalerp.paciente.mapper.PacienteMapper;
import com.medicalerp.paciente.repository.PacienteRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Paciente Service Unit Tests (DOM-PAC-001)
 */
@ExtendWith(MockitoExtension.class)
class PacienteServiceTest {

    @Mock
    private PacienteRepository pacienteRepository;

    @Mock
    private PacienteMapper pacienteMapper;

    @InjectMocks
    private PacienteService pacienteService;

    private PacienteRequest request;
    private Paciente paciente;
    private PacienteResponse response;

    @BeforeEach
    void setUp() {
        request = PacienteRequest.builder()
                .apellidoPaterno("Garcia")
                .nombres("Maria Elena")
                .licenciaConducir("A1234567")
                .email("maria@email.com")
                .fechaNacimiento(LocalDate.of(1990, 5, 15))
                .build();

        paciente = Paciente.builder()
                .id(1L)
                .apellidoPaterno("Garcia")
                .nombres("Maria Elena")
                .licenciaConducir("A1234567")
                .estado("activo")
                .build();

        response = PacienteResponse.builder()
                .id(1L)
                .apellidoPaterno("Garcia")
                .nombres("Maria Elena")
                .build();
    }

    // --- Licencia de Conducir Format Validation (VR-PAC-012/013) ---

    @Test
    void create_WithValidLicencia_ShouldSucceed() {
        when(pacienteRepository.existsByLicenciaConducir("A1234567")).thenReturn(false);
        when(pacienteMapper.toEntity(request)).thenReturn(paciente);
        when(pacienteRepository.save(any(Paciente.class))).thenReturn(paciente);
        when(pacienteMapper.toResponse(paciente)).thenReturn(response);

        PacienteResponse result = pacienteService.create(request);

        assertNotNull(result);
        verify(pacienteRepository).save(any(Paciente.class));
    }

    @Test
    void create_WithInvalidLicenciaFormat_ShouldThrowBusinessRuleException() {
        request.setLicenciaConducir("12345"); // Only 5 chars, too short

        BusinessRuleException ex = assertThrows(BusinessRuleException.class,
                () -> pacienteService.create(request));

        assertEquals("VR-PAC-012", ex.getRuleCode());
    }

    @Test
    void create_WithEmptyLicencia_ShouldSkipValidation() {
        request.setLicenciaConducir("");
        when(pacienteMapper.toEntity(request)).thenReturn(paciente);
        when(pacienteRepository.save(any(Paciente.class))).thenReturn(paciente);
        when(pacienteMapper.toResponse(paciente)).thenReturn(response);

        assertDoesNotThrow(() -> pacienteService.create(request));
    }

    // --- Duplicate Licencia (BR-PAC-001) ---

    @Test
    void create_WithDuplicateLicencia_ShouldThrowDuplicateResourceException() {
        when(pacienteRepository.existsByLicenciaConducir("A1234567")).thenReturn(true);

        assertThrows(DuplicateResourceException.class,
                () -> pacienteService.create(request));
    }

    // --- Date of Birth Validation (VR-PAC-008) ---

    @Test
    void create_WithFutureBirthDate_ShouldThrowBusinessRuleException() {
        request.setFechaNacimiento(LocalDate.now().plusDays(1));

        BusinessRuleException ex = assertThrows(BusinessRuleException.class,
                () -> pacienteService.create(request));

        assertEquals("VR-PAC-008", ex.getRuleCode());
    }

    // --- Soft Delete ---

    @Test
    void delete_ShouldSetEstadoToInactivo() {
        when(pacienteRepository.findById(1L)).thenReturn(Optional.of(paciente));
        when(pacienteRepository.save(paciente)).thenReturn(paciente);

        pacienteService.delete(1L);

        assertEquals("inactivo", paciente.getEstado());
        verify(pacienteRepository).save(paciente);
    }

    @Test
    void delete_NonExistent_ShouldThrowResourceNotFoundException() {
        when(pacienteRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> pacienteService.delete(99L));
    }

    // --- Update ---

    @Test
    void update_WithChangedLicencia_ShouldCheckDuplicate() {
        when(pacienteRepository.findById(1L)).thenReturn(Optional.of(paciente));
        when(pacienteRepository.existsByLicenciaConducir("B8765432")).thenReturn(false);
        when(pacienteRepository.save(any(Paciente.class))).thenReturn(paciente);
        when(pacienteMapper.toResponse(paciente)).thenReturn(response);

        request.setLicenciaConducir("B8765432");
        PacienteResponse result = pacienteService.update(1L, request);

        assertNotNull(result);
    }

    @Test
    void getById_NonExistent_ShouldThrowResourceNotFoundException() {
        when(pacienteRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> pacienteService.getById(99L));
    }

}
