package com.nirapod.repository;

import com.nirapod.model.ChatMessage;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, UUID> {

    @Query("SELECT m FROM ChatMessage m JOIN FETCH m.user ORDER BY m.createdAt DESC")
    List<ChatMessage> findLatest(Pageable pageable);
}
