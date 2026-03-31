import { useState, useRef, useEffect } from "react";
import { Send, Bot, Plus, MessageSquare, Trash2, Menu, X, Sun, Moon, Headphones, Volume2, VolumeX } from "lucide-react";
import "./index.css";

const speakText = (text) => {
  if (!window.speechSynthesis) return;
  // Strip emojis so it doesn't try to read them out loud
  const cleanText = text.replace(/[\u{1F600}-\u{1F6FF}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}]/gu, '');
  
  const utterance = new SpeechSynthesisUtterance(cleanText);
  
  // Try to select a smoother, more human-sounding voice if available on the OS
  const voices = window.speechSynthesis.getVoices();
  const calmingVoice = voices.find(v => 
    v.name.includes('Samantha') || 
    v.name.includes('Zira') || 
    v.name.includes('Google UK English Female') ||
    v.name.includes('Serena') ||
    (v.name.includes('Female') && v.lang.startsWith('en'))
  );
  
  if (calmingVoice) {
    utterance.voice = calmingVoice;
  }
  
  utterance.rate = 0.9; // Slightly slower pacing
  utterance.pitch = 1.0;
  window.speechSynthesis.speak(utterance);
};

const TypewriterMessage = ({ text, msgId }) => {
  const [displayedText, setDisplayedText] = useState("");
  const isRecent = Date.now() - msgId < 10000; // Only animate if created in the last 10 seconds

  useEffect(() => {
    if (!isRecent) {
      setDisplayedText(text);
      return;
    }

    let i = 0;
    const intervalId = setInterval(() => {
      setDisplayedText(text.slice(0, i));
      i++;
      if (i > text.length) {
        clearInterval(intervalId);
      }
    }, 30); // 30ms typing speed

    return () => clearInterval(intervalId);
  }, [text, isRecent]);

  return <>{displayedText}</>;
};

const BreathingWidget = () => {
  const [phase, setPhase] = useState("Breathe In...");
  
  useEffect(() => {
    const cycle = () => {
      setPhase("Breathe In...");
      setTimeout(() => {
        setPhase("Hold...");
        setTimeout(() => {
          setPhase("Breathe Out...");
        }, 7000); // Hold for 7s
      }, 4000); // Breathe in for 4s
    };
    
    cycle();
    const interval = setInterval(cycle, 19000); // 4 + 7 + 8 = 19s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="breathing-widget-container">
      <div className={`breathing-circle ${phase.split(" ")[0].toLowerCase()}-${phase.split(" ")[1].toLowerCase().replace("...","")}`}>
        <span className="breathing-text">{phase}</span>
      </div>
    </div>
  );
};

const systemAvatarColor = "linear-gradient(135deg, #10b981, #3b82f6)";

function App() {
  const createDefaultMessage = () => ({
    id: Date.now(),
    role: "ai",
    text: "hey! i am here for you. how are things?",
    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  });

  // State
  const [chats, setChats] = useState(() => {
    const saved = localStorage.getItem("innerVoiceChats");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error("Could not parse chats"); }
    }
    return [{ id: `chat-${Date.now()}`, name: "Chat 1", messages: [createDefaultMessage()] }];
  });

  const [activeChatId, setActiveChatId] = useState(() => {
    const savedId = localStorage.getItem("innerVoiceActiveChatId");
    if (savedId) return savedId;
    return chats[0]?.id || "";
  });

  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("innerVoiceTheme");
    return saved || "dark";
  });

  const endOfMessagesRef = useRef(null);
  const isSendingRef = useRef(false);
  const audioRef = useRef(null);

  // Derived state
  const activeChat = chats.find((c) => c.id === activeChatId) || chats[0];
  const activeMessages = activeChat?.messages || [];

  // Effects
  useEffect(() => {
    localStorage.setItem("innerVoiceChats", JSON.stringify(chats));
  }, [chats]);

  useEffect(() => {
    if (activeChatId) localStorage.setItem("innerVoiceActiveChatId", activeChatId);
  }, [activeChatId]);

  useEffect(() => {
    localStorage.setItem("innerVoiceTheme", theme);
    if (theme === "soothing") {
      document.body.classList.add("theme-soothing");
    } else {
      document.body.classList.remove("theme-soothing");
    }
  }, [theme]);

  // Handle ambient rain audio
  useEffect(() => {
    if (audioRef.current) {
      if (isAudioPlaying) {
        audioRef.current.volume = 0.4;
        audioRef.current.play().catch(e => console.log("Audio play failed:", e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isAudioPlaying]);

  const scrollToBottom = () => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeMessages, isTyping, activeChatId]);

  // Actions
  const createNewChat = () => {
    const newId = `chat-${Date.now()}`;
    const newChat = {
      id: newId,
      name: `Chat ${chats.length + 1}`,
      messages: [createDefaultMessage()],
    };
    setChats([newChat, ...chats]);
    setActiveChatId(newId);
    setIsSidebarOpen(false);
  };

  const deleteChat = (e, idToDelete) => {
    e.stopPropagation();
    const newChats = chats.filter((c) => c.id !== idToDelete);
    
    if (newChats.length === 0) {
      const freshChat = { id: `chat-${Date.now()}`, name: "Chat 1", messages: [createDefaultMessage()] };
      setChats([freshChat]);
      setActiveChatId(freshChat.id);
    } else {
      setChats(newChats);
      if (activeChatId === idToDelete) {
        setActiveChatId(newChats[0].id);
      }
    }
  };

  // API Call
  const sendToAPI = async (messagesToSend, chatId) => {
    try {
      const requestBody = messagesToSend.map((m) => ({
        role: m.role === "ai" ? "assistant" : "user",
        content: m.text,
      }));

      const response = await fetch("http://localhost:5000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: requestBody }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || `HTTP ${response.status}`);

      const aiMessage = {
        id: Date.now() + 1,
        role: "ai",
        text: "i'm sorry, I'm having trouble connecting right now. i'm still here for you though.",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      if (data && data.reply) {
        aiMessage.text = data.reply;
        
        if (isSpeakerOn) {
          speakText(aiMessage.text);
        }
      }

      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat.id === chatId ? { ...chat, messages: [...chat.messages, aiMessage] } : chat
        )
      );
    } catch (err) {
      console.error("API Error:", err);
      const errorMessage = {
        id: Date.now() + 1,
        role: "ai",
        text: `hey… something went wrong (${err.message}). try again in a moment?`,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat.id === chatId ? { ...chat, messages: [...chat.messages, errorMessage] } : chat
        )
      );
    } finally {
      if (activeChatId === chatId) setIsTyping(false);
      isSendingRef.current = false;
    }
  };

  const submitMessage = (textToSubmit) => {
    if (!textToSubmit.trim() || !activeChat || isSendingRef.current) return;
    isSendingRef.current = true;

    const userMessage = {
      id: Date.now(),
      role: "user",
      text: textToSubmit,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const currentChatId = activeChat.id;
    const currentMessages = [...activeChat.messages, userMessage];

    // Attempt to auto-name the chat based on the first user message
    let updatedChatName = activeChat.name;
    if (activeChat.messages.length === 1) {
      updatedChatName = textToSubmit.trim();
      if (updatedChatName.length > 25) {
        updatedChatName = updatedChatName.substring(0, 22) + '...';
      }
    }

    setIsTyping(true);

    // Update state optimistically
    setChats((prevChats) =>
      prevChats.map((chat) =>
        chat.id === currentChatId ? { ...chat, messages: currentMessages, name: updatedChatName } : chat
      )
    );

    // If panic mode triggered, drop the widget instead of the API request
    if (textToSubmit.toLowerCase().includes("panic")) {
      setTimeout(() => {
        const breathingMessage = {
          id: Date.now() + 1,
          role: "widget",
          type: "breathing",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setIsTyping(false);
        isSendingRef.current = false;
        setChats((prevChats) =>
          prevChats.map((chat) =>
            chat.id === currentChatId ? { ...chat, messages: [...currentMessages, breathingMessage] } : chat
          )
        );
        
        if (isSpeakerOn) {
          speakText("Let's take a breath together. Follow the circle.");
        }
      }, 1500);
      return;
    }

    sendToAPI(currentMessages, currentChatId);
  };

  const handleSend = () => {
    if (!input.trim()) return;
    submitMessage(input);
    setInput("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="layout-container">
      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="sidebar-overlay open" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar Area */}
      <div className={`sidebar ${isSidebarOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <button className="new-chat-btn" onClick={createNewChat}>
            <Plus size={18} />
            <span>New Chat</span>
          </button>
          <button className="close-sidebar-btn" onClick={() => setIsSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <div className="chat-list">
          {chats.map((chat) => (
            <div
              key={chat.id}
              className={`chat-item ${chat.id === activeChatId ? "active" : ""}`}
              onClick={() => {
                setActiveChatId(chat.id);
                setIsSidebarOpen(false);
              }}
            >
              <MessageSquare size={16} className="chat-icon" />
              <span className="chat-name">{chat.name}</span>
              <button
                className="delete-btn"
                onClick={(e) => deleteChat(e, chat.id)}
                aria-label="Delete chat"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="app-container">
        {/* Header */}
        <div className="header">
          <button className="menu-btn" onClick={() => setIsSidebarOpen(true)} aria-label="Open Map">
            <Menu size={24} color="var(--text-main)" />
          </button>
          <div className="header-avatar" style={{ background: theme === "soothing" ? "linear-gradient(135deg, #c4b5fd, #a78bfa)" : systemAvatarColor }}>
            <Bot size={24} color="#fff" />
          </div>
          <div className="header-info" style={{ flex: 1 }}>
            <h1>InnerVoice</h1>
            <p>
              <span className="status-dot"></span> 
              {activeChat ? activeChat.name : "always online"}
            </p>
          </div>
          
          <div style={{ display: "flex", gap: "4px" }}>
            <button 
              className="theme-toggle-btn"
              onClick={() => setIsAudioPlaying(!isAudioPlaying)}
              style={{ background: "transparent", border: "none", color: isAudioPlaying ? "var(--accent-color)" : "var(--text-muted)", cursor: "pointer", padding: "8px", display: "flex", alignItems: "center" }}
              aria-label="Toggle Ambient Audio"
            >
              <Headphones size={20} />
            </button>
            
            <button 
              className="theme-toggle-btn"
              onClick={() => setIsSpeakerOn(!isSpeakerOn)}
              style={{ background: "transparent", border: "none", color: isSpeakerOn ? "var(--accent-color)" : "var(--text-muted)", cursor: "pointer", padding: "8px", display: "flex", alignItems: "center" }}
              aria-label="Toggle AI Voice"
            >
              {isSpeakerOn ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </button>
            
            <button 
              className="theme-toggle-btn"
              onClick={() => setTheme(theme === "dark" ? "soothing" : "dark")}
              style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "8px", display: "flex", alignItems: "center" }}
              aria-label="Toggle Theme"
            >
              {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="chat-area">
          {activeMessages.map((msg) => (
            <div
              key={msg.id}
              className={`message-wrapper ${
                msg.role === "ai" ? "message-ai" : msg.role === "widget" ? "message-widget" : "message-user"
              }`}
            >
              {msg.role === "widget" ? (
                <BreathingWidget />
              ) : (
                <div className="message-bubble">
                  {msg.role === "ai" ? <TypewriterMessage text={msg.text} msgId={msg.id} /> : msg.text}
                </div>
              )}
              <span className="message-time">{msg.time}</span>
            </div>
          ))}

          {activeMessages.length === 1 && !isTyping && (
            <div className="quick-emotions-container">
              {["I feel panicked", "I feel lonely", "I feel stressed", "I need comfort"].map((emotion, idx) => (
                <button
                  key={idx}
                  className="quick-emotion-btn"
                  onClick={() => submitMessage(emotion)}
                >
                  {emotion}
                </button>
              ))}
            </div>
          )}

          {isTyping && (
            <div className="typing-indicator">
              <span className="typing-dot"></span>
              <span className="typing-dot"></span>
              <span className="typing-dot"></span>
            </div>
          )}

          <div ref={endOfMessagesRef} />
        </div>

        {/* Input Area */}
        <div className="input-area">
          <div className="input-container">
            <textarea
              className="input-field"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              rows={1}
              style={{ height: "auto" }}
              onInput={(e) => (e.target.style.height = e.target.scrollHeight + "px")}
            />
            <button
              className="send-button"
              onClick={handleSend}
              disabled={!input.trim() || isTyping || !activeChat}
              aria-label="Send message"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
      
      {/* Background Ambient Audio */}
      <audio ref={audioRef} src="https://cdn.pixabay.com/audio/2022/11/21/audio_1919cb9bfa.mp3" loop />
    </div>
  );
}

export default App;