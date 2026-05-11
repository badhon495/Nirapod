package com.nirapod.service;

import com.nirapod.dto.chat.ChatMessageResponse;
import com.nirapod.model.ChatMessage;
import com.nirapod.model.User;
import com.nirapod.repository.ChatMessageRepository;
import com.nirapod.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<ChatMessageResponse> getHistory(int limit) {
        List<ChatMessageResponse> messages = chatMessageRepository
                .findLatest(PageRequest.of(0, Math.min(limit, 100)))
                .stream()
                .map(ChatMessageResponse::from)
                .toList();
        // reverse so oldest first
        return messages.reversed();
    }

    @Transactional
    public ChatMessageResponse save(UUID userId, String content) {
        User user = userRepository.getReferenceById(userId);
        ChatMessage msg = new ChatMessage();
        msg.setUser(user);
        msg.setContent(content);
        chatMessageRepository.save(msg);
        // reload with user eager for response
        return new ChatMessageResponse(
                msg.getId(),
                userId,
                user.getName(),
                msg.getContent(),
                msg.getCreatedAt()
        );
    }
}
