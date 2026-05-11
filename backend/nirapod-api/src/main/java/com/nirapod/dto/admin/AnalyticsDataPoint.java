package com.nirapod.dto.admin;

public record AnalyticsDataPoint(
    String district,
    String category,
    long count
) {}
