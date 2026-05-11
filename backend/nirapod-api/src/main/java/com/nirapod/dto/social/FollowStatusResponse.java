package com.nirapod.dto.social;

public record FollowStatusResponse(
    boolean following,
    long followerCount
) {}
