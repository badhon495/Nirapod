package com.nirapod.repository;

import com.nirapod.model.PostPhoto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PostPhotoRepository extends JpaRepository<PostPhoto, Long> {
    List<PostPhoto> findByPostId(Long postId);
}