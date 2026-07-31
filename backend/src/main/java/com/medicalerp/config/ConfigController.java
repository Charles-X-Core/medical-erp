package com.medicalerp.config;

import com.medicalerp.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/config")
@RequiredArgsConstructor
public class ConfigController {

    private final PaisConfigService paisConfigService;

    @GetMapping("/paises")
    public ResponseEntity<ApiResponse<List<PaisConfig>>> getPaises() {
        return ResponseEntity.ok(ApiResponse.success(paisConfigService.getAllConfigs()));
    }
}
