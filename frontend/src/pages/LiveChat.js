import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './LiveChat.css';
import logo from '../image/logo.png';

function LiveChat() {
  const [messages, setMessages] = useState(() => {
    // Load messages from sessionStorage if available
    const saved = sessionStorage.getItem('livechat-messages');
    return saved ? JSON.parse(saved) : [];
  });
  const [input, setInput] = useState('');
  const [username, setUsername] = useState('');
  const [joined, setJoined] = useState(false);
  const chatEndRef = useRef(null);
  const ws = useRef(null);

  // On mount, fetch username from backend using nirapod_identifier
  useEffect(() => {
    const fetchUserName = async () => {
      const identifier = localStorage.getItem('nirapod_identifier');
      if (!identifier) return;
      try {
        const res = await axios.get(`/api/user/by-identifier?value=${identifier}`);
        if (res.data && res.data.name) {
          setUsername(res.data.name);
          setJoined(true);
        }
      } catch (err) {
        // Optionally show error
        setUsername('');
        setJoined(false);
      }
    };
    fetchUserName();
  }, []);

  useEffect(() => {
    // Save messages to sessionStorage whenever they change
    sessionStorage.setItem('livechat-messages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    // Save username and joined state
    if (joined) {
      sessionStorage.setItem('livechat-username', username);
      sessionStorage.setItem('livechat-joined', '1');
    } else {
      sessionStorage.removeItem('livechat-joined');
    }
  }, [joined, username]);

  useEffect(() => {
    if (joined) {
      ws.current = new window.WebSocket('ws://localhost:8081');
      ws.current.onopen = () => {
        console.log('WebSocket connection opened');
      };
      ws.current.onerror = (err) => {
        console.error('WebSocket error:', err);
      };
      ws.current.onclose = () => {
        console.log('WebSocket connection closed');
      };
      ws.current.onmessage = (event) => {
        if (event.data instanceof Blob) {
          event.data.text().then(text => {
            console.log('WebSocket message received (from Blob):', text);
            try {
              const msg = JSON.parse(text);
              setMessages((msgs) => [...msgs, msg]);
            } catch (e) {
              // Ignore non-JSON messages
            }
          });
        } else {
          console.log('WebSocket message received:', event.data);
          try {
            const msg = JSON.parse(event.data);
            setMessages((msgs) => [...msgs, msg]);
          } catch (e) {
            // Ignore non-JSON messages
          }
        }
      };
      return () => ws.current && ws.current.close();
    }
  }, [joined]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    // On logout or window close, clear chat and session
    const handleLogout = () => {
      sessionStorage.removeItem('livechat-messages');
      sessionStorage.removeItem('livechat-username');
      sessionStorage.removeItem('livechat-joined');
      setMessages([]);
      setUsername('');
      setJoined(false);
    };
    window.addEventListener('beforeunload', handleLogout);
    return () => window.removeEventListener('beforeunload', handleLogout);
  }, []);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const msg = { user: username, text: input, time: new Date().toLocaleTimeString() };
    ws.current.send(JSON.stringify(msg));
    setInput('');
  };

  const handleLogoutClick = () => {
    sessionStorage.removeItem('livechat-messages');
    sessionStorage.removeItem('livechat-username');
    sessionStorage.removeItem('livechat-joined');
    setMessages([]);
    setUsername('');
    setJoined(false);
    if (ws.current) ws.current.close();
  };

  return (
    <div className="livechat-container">
      <div className="livechat-header">
        <div className="livechat-logo-section">
          <img src={logo} alt="Nirapod Logo" className="livechat-logo-img" />
          <div className="livechat-title">
            <div className="livechat-logo-text">Nirapod</div>
            <div className="livechat-subtitle">Global Live Chat</div>
          </div>
        </div>
        <div className="livechat-status">
          <div className={`connection-indicator ${joined ? 'connected' : 'connecting'}`}></div>
          <span className="connection-text">{joined ? 'Connected' : 'Connecting...'}</span>
        </div>
      </div>

      <div className="livechat-main">
        <div className="livechat-box">
          <div className="livechat-header-bar">
            <h2 className="livechat-title-text">Live Chat</h2>
            {joined && (
              <div className="user-info">
                Welcome, <span className="username-display">{username}</span>
              </div>
            )}
          </div>

          {!joined ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <div className="loading-text">Loading chat...</div>
            </div>
          ) : (
            <>
              <div className="chat-messages">
                {messages.length === 0 && (
                  <div className="empty-chat">
                    <div className="empty-icon">💬</div>
                    <div className="empty-text">No messages yet. Say hi!</div>
                  </div>
                )}
                {messages.map((msg, i) => (
                  <div key={i} className="message-item">
                    <div className="message-header">
                      <span className="message-user">{msg.user}</span>
                      <span className="message-time">{msg.time}</span>
                    </div>
                    <div className="message-text">{msg.text}</div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              
              <form onSubmit={handleSend} className="message-input-form">
                <div className="input-container">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    className="message-input"
                    autoFocus
                  />
                  <button type="submit" className="send-button">
                    <span className="send-icon">➤</span>
                    Send
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>

      <footer className="livechat-footer">
        <a href="/faq" className="footer-link">FAQ</a>
        <a href="/ReachOut" className="footer-link">Reach out</a>
        <a href="/contact" className="footer-link">Contact</a>
      </footer>
    </div>
  );
}

export default LiveChat;
