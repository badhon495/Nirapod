package com.nirapod.repository;

import com.nirapod.model.PostUpdate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PostUpdateRepository extends JpaRepository<PostUpdate, Long> {
    List<PostUpdate> findByPostId(Long postId);
}