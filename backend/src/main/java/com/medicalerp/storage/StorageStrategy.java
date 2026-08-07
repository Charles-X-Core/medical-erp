package com.medicalerp.storage;

import org.springframework.web.multipart.MultipartFile;

/**
 * StorageStrategy Interface
 * Interfaz para estrategias de almacenamiento (Local, S3, Azure, etc.)
 */
public interface StorageStrategy {

    String store(MultipartFile file, String path);

    byte[] load(String path);

    void delete(String path);

    String getMimeType(String filename);

}
