package com.nirapod.repository;

import com.nirapod.model.PostFollow;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface PostFollowRepository extends JpaRepository<PostFollow, Long> {
    Optional<PostFollow> findByPostIdAndUserId(Long postId, Long userId);
    List<PostFollow> findByUserId(Long userId);
}