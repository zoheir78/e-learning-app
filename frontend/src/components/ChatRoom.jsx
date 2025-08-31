import React, { useEffect, useRef, useState } from "react";

const ChatRoom = ({
  // Accept either prop name
  token,
  accessToken,
  // Default room to the one you created in signals.py
  roomName = "dashboard_chat",
  // Optional: for optimistic display of own sent messages
  username = "You",
}) => {
  const jwt = accessToken || token;
  const [messages, setMessages] = useState([]); // [{user, message, timestamp}]
  const [newMessage, setNewMessage] = useState("");
  const [status, setStatus] = useState("disconnected"); // "connecting" | "connected" | "disconnected"
  const wsRef = useRef(null);
  const endRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (endRef.current) endRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!jwt) return;

    setStatus("connecting");
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const wsUrl = `${protocol}://localhost:8081/ws/chat/${roomName}/?token=${jwt}`;

    // Close any existing socket before creating a new one (helps in StrictMode)
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.close();
    }

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus("connected");
      // Optionally fetch recent messages over REST here if you want history.
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        // Backend broadcasts MessageSerializer:
        // { id, room, sender: {...}, content, timestamp }
        setMessages((prev) => [
          ...prev,
          {
            user: data?.sender?.username || "Unknown",
            message: data?.content ?? "",
            timestamp: data?.timestamp || null,
          },
        ]);
      } catch (e) {
        console.error("Failed to parse message:", e);
      }
    };

    ws.onerror = (err) => {
      console.error("WebSocket error:", err);
    };

    ws.onclose = () => {
      setStatus("disconnected");
    };

    return () => {
      ws.close();
    };
  }, [jwt, roomName]);

  const sendMessage = () => {
    const ws = wsRef.current;
    const text = newMessage.trim();
    if (!text || !ws || ws.readyState !== WebSocket.OPEN) return;

    // Server expects ONLY { message: "..." }
    ws.send(JSON.stringify({ message: text }));

    setMessages((prev) => [
      ...prev,
      {
        user: username || "You",
        message: text,
        timestamp: new Date().toISOString(),
        _local: true,
      },
    ]);

    setNewMessage("");
  };

  const canSend =
    status === "connected" &&
    jwt &&
    wsRef.current &&
    wsRef.current.readyState === WebSocket.OPEN;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-3 border-b">
        <h3 className="text-lg font-semibold">💬 Campus Chat</h3>
        <span
          className={`text-xs px-2 py-1 rounded ${
            status === "connected"
              ? "bg-green-100 text-green-700"
              : status === "connecting"
              ? "bg-yellow-100 text-yellow-700"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {status}
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 bg-white">
        {messages.length === 0 ? (
          <p className="text-sm text-gray-500">No messages yet. Say hi! 👋</p>
        ) : (
          messages.map((m, i) => (
            <div key={i} className="mb-2">
              <span className="font-medium">{m.user}: </span>
              <span>{m.message}</span>
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t bg-gray-50">
        <div className="flex gap-2">
          <input
            type="text"
            className="border flex-1 p-2 rounded"
            placeholder={
              status === "connected"
                ? "Type your message…"
                : "Connecting to chat…"
            }
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            disabled={!canSend}
          />
          <button
            onClick={sendMessage}
            disabled={!canSend || !newMessage.trim()}
            className={`px-4 py-2 rounded text-white ${
              !canSend || !newMessage.trim()
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            Send
          </button>
        </div>
        {!jwt && (
          <p className="text-xs text-red-600 mt-2">
            You must be logged in to use the chat.
          </p>
        )}
      </div>
    </div>
  );
};

export default ChatRoom;

