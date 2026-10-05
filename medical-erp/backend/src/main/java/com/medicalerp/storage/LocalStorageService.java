package com.medicalerp.storage;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

/**
 * LocalStorageService
 * Implementacion local de StorageStrategy
 */
@Component
@RequiredArgsConstructor
public class LocalStorageService implements StorageStrategy {

    @Value("${app.upload.dir:./uploads}")
    private String basePath;

    @Override
    public String store(MultipartFile file, String path) {
        try {
            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            String filename = UUID.randomUUID() + extension;

            Path targetPath = Paths.get(basePath, path, filename);
            Files.createDirectories(targetPath.getParent());
            file.transferTo(targetPath.toFile());

            return path + "/" + filename;
        } catch (IOException e) {
            throw new RuntimeException("Error al guardar archivo: " + e.getMessage(), e);
        }
    }

    @Override
    public byte[] load(String path) {
        try {
            Path filePath = Paths.get(basePath, path);
            return Files.readAllBytes(filePath);
        } catch (IOException e) {
            throw new RuntimeException("Error al leer archivo: " + e.getMessage(), e);
        }
    }

    @Override
    public void delete(String path) {
        try {
            Path filePath = Paths.get(basePath, path);
            Files.deleteIfExists(filePath);
        } catch (IOException e) {
            throw new RuntimeException("Error al eliminar archivo: " + e.getMessage(), e);
        }
    }

    @Override
    public String getMimeType(String filename) {
        if (filename == null) return "application/octet-stream";
        String extension = filename.substring(filename.lastIndexOf(".") + 1).toLowerCase();
        return switch (extension) {
            case "jpg", "jpeg" -> "image/jpeg";
            case "png" -> "image/png";
            case "gif" -> "image/gif";
            case "pdf" -> "application/pdf";
            case "mp4" -> "video/mp4";
            case "webm" -> "video/webm";
            default -> "application/octet-stream";
        };
    }

}
