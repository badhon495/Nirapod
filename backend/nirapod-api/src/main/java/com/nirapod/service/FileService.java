package com.nirapod.service;

import com.cloudinary.Cloudinary;
import com.nirapod.exception.ApiException;
import lombok.RequiredArgsConstructor;
import org.apache.tika.Tika;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class FileService {

    private final Cloudinary cloudinary;

    private static final Set<String> ALLOWED_MIME_TYPES = Set.of(
            "image/jpeg", "image/png", "image/webp"
    );
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    private static final Tika TIKA = new Tika();

    public String upload(MultipartFile file, String folder) {
        if (file.isEmpty())
            throw ApiException.badRequest("File is empty");
        if (file.getSize() > MAX_FILE_SIZE)
            throw ApiException.badRequest("File exceeds 10MB limit");

        String mimeType = detectMimeType(file);
        if (!ALLOWED_MIME_TYPES.contains(mimeType))
            throw ApiException.badRequest("Only JPEG, PNG, and WebP images are allowed");

        try {
            Map<?, ?> result = cloudinary.uploader().upload(
                    file.getBytes(),
                    Map.of(
                            "folder", "nirapod/" + folder,
                            "resource_type", "image"
                    )
            );
            return (String) result.get("public_id");
        } catch (IOException e) {
            throw ApiException.badRequest("File upload failed: " + e.getMessage());
        }
    }

    public void delete(String publicId) {
        try {
            cloudinary.uploader().destroy(publicId, Map.of());
        } catch (IOException e) {
            throw ApiException.badRequest("File deletion failed: " + e.getMessage());
        }
    }

    private String detectMimeType(MultipartFile file) {
        try {
            return TIKA.detect(file.getInputStream());
        } catch (IOException e) {
            throw ApiException.badRequest("Cannot read file");
        }
    }
}
