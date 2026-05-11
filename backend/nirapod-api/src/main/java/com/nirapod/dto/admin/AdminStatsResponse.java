package com.nirapod.dto.admin;

import java.util.Map;

public record AdminStatsResponse(
    long totalComplaints,
    long unsolvedComplaints,
    long inProgressComplaints,
    long solvedComplaints,
    long totalUsers,
    long activeUsers,
    long pendingUsers,
    long suspendedUsers,
    Map<String, Long> complaintsByCategory,
    Map<String, Long> complaintsByDistrict
) {}
