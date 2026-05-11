package com.nirapod.dto.complaint;

import com.nirapod.model.ComplaintCategory;
import com.nirapod.model.ComplaintUrgency;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;

public record ComplaintCreateRequest(

    @NotNull(message = "Category is required")
    ComplaintCategory category,

    @NotNull(message = "Urgency is required")
    ComplaintUrgency urgency,

    @NotBlank(message = "Title is required")
    @Size(max = 500, message = "Title must not exceed 500 characters")
    String title,

    @NotBlank(message = "Details are required")
    @Size(min = 20, max = 5000, message = "Details must be between 20 and 5000 characters")
    String details,

    @NotBlank(message = "District is required")
    @Size(max = 100)
    String district,

    @NotBlank(message = "Area is required")
    @Size(max = 100)
    String area,

    @DecimalMin(value = "-90.0") @DecimalMax(value = "90.0")
    BigDecimal locationLat,

    @DecimalMin(value = "-180.0") @DecimalMax(value = "180.0")
    BigDecimal locationLng,

    @Size(max = 500)
    String locationText,

    boolean isPublic,

    @Size(max = 10, message = "Maximum 10 tags allowed")
    Set<@Size(max = 100) String> tags,

    // Cloudinary public_ids of already-uploaded photos
    @Size(max = 5, message = "Maximum 5 photos allowed")
    List<String> photoPublicIds
) {}
