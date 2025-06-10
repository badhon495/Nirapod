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
        <div className="livechat-header-left">
          <img src={logo} alt="Nirapod Logo" className="livechat-logo" />
          <div className="livechat-title">Nirapod Live Chat</div>
        </div>
        <div className="livechat-connection-status">
          <div className={`livechat-status-indicator ${joined ? '' : 'disconnected'}`}></div>
          <span>{joined ? 'Connected' : 'Connecting...'}</span>
        </div>
      </div>

      <div className="livechat-main">
        <div className="livechat-messages">
          {!joined ? (
            <div className="livechat-empty-state">
              <div className="livechat-empty-icon">💬</div>
              <div className="livechat-empty-title">Loading chat...</div>
              <div className="livechat-empty-subtitle">Connecting to the chat server...</div>
            </div>
          ) : messages.length === 0 ? (
            <div className="livechat-empty-state">
              <div className="livechat-empty-icon">💬</div>
              <div className="livechat-empty-title">No messages yet</div>
              <div className="livechat-empty-subtitle">Say hi to start the conversation!</div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div key={i} className={`livechat-message ${msg.user === username ? 'own' : 'other'}`}>
                <div className="livechat-message-header">
                  <span className="livechat-message-username">{msg.user}</span>
                  <span className="livechat-message-time">{msg.time}</span>
                </div>
                <div className="livechat-message-bubble">{msg.text}</div>
              </div>
            ))
          )}
          <div ref={chatEndRef} />
        </div>
        
        {joined && (
          <div className="livechat-input-container">
            <form onSubmit={handleSend} className="livechat-input-form">
              <input
                type="text"
                placeholder="Type a message..."
                value={input}
                onChange={e => setInput(e.target.value)}
                className="livechat-input"
                autoFocus
              />
              <button type="submit" className="livechat-send-btn" disabled={!input.trim()}>
                <span>✈️</span>
              </button>
            </form>
          </div>
        )}
      </div>

      <footer className="livechat-footer">
        <div className="livechat-user-info">
          {joined && (
            <>
              <span>Welcome, <strong>{username}</strong></span>
              <button onClick={handleLogoutClick} className="livechat-logout-btn">
                Logout
              </button>
            </>
          )}
        </div>
      </footer>
    </div>
  );
}

export default LiveChat;
