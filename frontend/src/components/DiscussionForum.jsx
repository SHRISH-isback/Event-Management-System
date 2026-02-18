import { useState, useEffect, useRef } from "react";
import api from "../api/axios";
import { io } from "socket.io-client";

export default function DiscussionForum({ eventId }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [expandedThreads, setExpandedThreads] = useState(new Set());
  const [selectedEmoji, setSelectedEmoji] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(null);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const role = localStorage.getItem("role");
  const isOrganizer = role === "ORGANIZER";

  const emojis = ["👍", "❤️", "😊", "🎉", "👏", "🔥", "💯", "✅"];

  useEffect(() => {
    fetchMessages();
    initializeSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [eventId]);

  const initializeSocket = () => {
    const token = localStorage.getItem("token");
    
    socketRef.current = io(process.env.REACT_APP_API_URL || "http://localhost:5000", {
      auth: { token },
    });

    socketRef.current.emit("join-forum", eventId);

    socketRef.current.on("new-message", (message) => {
      setMessages((prev) => [message, ...prev]);
      scrollToBottom();
    });

    socketRef.current.on("message-deleted", ({ messageId }) => {
      setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
    });

    socketRef.current.on("message-pinned", ({ messageId, isPinned }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId ? { ...msg, isPinned } : msg
        )
      );
    });

    socketRef.current.on("reaction-update", ({ messageId, reactions }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId ? { ...msg, reactions } : msg
        )
      );
    });
  };

  const fetchMessages = async () => {
    try {
      const res = await api.get(`/forum/${eventId}/messages`);
      setMessages(res.data.messages);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load messages");
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handlePostMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const endpoint = replyingTo
        ? `/forum/${eventId}/messages`
        : `/forum/${eventId}/messages`;

      const payload = {
        content: newMessage,
        ...(replyingTo && { parentMessage: replyingTo._id }),
      };

      await api.post(endpoint, payload);
      setNewMessage("");
      setReplyingTo(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to post message");
    }
  };

  const handlePostAnnouncement = async () => {
    if (!newMessage.trim()) return;

    try {
      await api.post(`/forum/${eventId}/announcements`, {
        content: newMessage,
      });
      setNewMessage("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to post announcement");
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm("Are you sure you want to delete this message?")) return;

    try {
      await api.delete(`/forum/messages/${messageId}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete message");
    }
  };

  const handleTogglePin = async (messageId) => {
    try {
      await api.patch(`/forum/messages/${messageId}/pin`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to toggle pin");
    }
  };

  const handleAddReaction = async (messageId, emoji) => {
    try {
      await api.post(`/forum/messages/${messageId}/reactions`, { emoji });
      setShowEmojiPicker(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add reaction");
    }
  };

  const handleRemoveReaction = async (messageId) => {
    try {
      await api.delete(`/forum/messages/${messageId}/reactions`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to remove reaction");
    }
  };

  const toggleThread = (messageId) => {
    setExpandedThreads((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  };

  const getReplies = (parentId) => {
    return messages.filter((msg) => msg.parentMessage === parentId);
  };

  const getTopLevelMessages = () => {
    return messages.filter((msg) => !msg.parentMessage);
  };

  const renderMessage = (message, isReply = false) => {
    const replies = getReplies(message._id);
    const hasReplies = replies.length > 0;
    const userId = localStorage.getItem("userId");
    const userReaction = message.reactions?.find((r) => r.user === userId);

    return (
      <div
        key={message._id}
        style={{
          marginLeft: isReply ? "40px" : "0",
          marginBottom: "15px",
          padding: "15px",
          backgroundColor: message.isAnnouncement
            ? "#fef3c7"
            : message.isPinned
            ? "#dbeafe"
            : "#f9fafb",
          borderRadius: "8px",
          borderLeft: message.isAnnouncement
            ? "4px solid #f59e0b"
            : message.isPinned
            ? "4px solid #3b82f6"
            : "4px solid #e5e7eb",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "5px" }}>
              <strong>{message.authorName}</strong>
              <span style={{ fontSize: "12px", color: "#6b7280" }}>
                {new Date(message.createdAt).toLocaleString()}
              </span>
              {message.isAnnouncement && (
                <span
                  style={{
                    fontSize: "10px",
                    padding: "2px 8px",
                    backgroundColor: "#f59e0b",
                    color: "white",
                    borderRadius: "4px",
                    fontWeight: "bold",
                  }}
                >
                  ANNOUNCEMENT
                </span>
              )}
              {message.isPinned && !message.isAnnouncement && (
                <span
                  style={{
                    fontSize: "10px",
                    padding: "2px 8px",
                    backgroundColor: "#3b82f6",
                    color: "white",
                    borderRadius: "4px",
                    fontWeight: "bold",
                  }}
                >
                  PINNED
                </span>
              )}
            </div>
            <p style={{ margin: "10px 0", whiteSpace: "pre-wrap" }}>{message.content}</p>

            {}
            <div style={{ display: "flex", gap: "10px", alignItems: "center", marginTop: "10px" }}>
              {message.reactions && message.reactions.length > 0 && (
                <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                  {Object.entries(
                    message.reactions.reduce((acc, r) => {
                      acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                      return acc;
                    }, {})
                  ).map(([emoji, count]) => (
                    <button
                      key={emoji}
                      onClick={() =>
                        userReaction?.emoji === emoji
                          ? handleRemoveReaction(message._id)
                          : handleAddReaction(message._id, emoji)
                      }
                      style={{
                        padding: "4px 8px",
                        border: userReaction?.emoji === emoji ? "2px solid #3b82f6" : "1px solid #d1d5db",
                        borderRadius: "12px",
                        backgroundColor: "white",
                        cursor: "pointer",
                        fontSize: "14px",
                      }}
                    >
                      {emoji} {count}
                    </button>
                  ))}
                </div>
              )}

              {}
              <div style={{ position: "relative" }}>
                <button
                  onClick={() =>
                    setShowEmojiPicker(showEmojiPicker === message._id ? null : message._id)
                  }
                  style={{
                    padding: "4px 8px",
                    border: "1px solid #d1d5db",
                    borderRadius: "12px",
                    backgroundColor: "white",
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  ➕
                </button>
                {showEmojiPicker === message._id && (
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      marginTop: "5px",
                      padding: "10px",
                      backgroundColor: "white",
                      border: "1px solid #d1d5db",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                      zIndex: 10,
                      display: "flex",
                      gap: "5px",
                    }}
                  >
                    {emojis.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => handleAddReaction(message._id, emoji)}
                        style={{
                          padding: "5px",
                          border: "none",
                          backgroundColor: "transparent",
                          cursor: "pointer",
                          fontSize: "18px",
                        }}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {}
            <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
              {!isReply && (
                <button
                  onClick={() => setReplyingTo(message)}
                  style={{
                    padding: "5px 10px",
                    fontSize: "12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "4px",
                    backgroundColor: "white",
                    cursor: "pointer",
                  }}
                >
                  Reply
                </button>
              )}

              {hasReplies && (
                <button
                  onClick={() => toggleThread(message._id)}
                  style={{
                    padding: "5px 10px",
                    fontSize: "12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "4px",
                    backgroundColor: "white",
                    cursor: "pointer",
                  }}
                >
                  {expandedThreads.has(message._id) ? "Hide" : "Show"} {replies.length} {replies.length === 1 ? "Reply" : "Replies"}
                </button>
              )}
            </div>
          </div>

          {}
          {isOrganizer && (
            <div style={{ display: "flex", gap: "5px" }}>
              {!message.isAnnouncement && (
                <button
                  onClick={() => handleTogglePin(message._id)}
                  style={{
                    padding: "5px 10px",
                    fontSize: "12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "4px",
                    backgroundColor: message.isPinned ? "#3b82f6" : "white",
                    color: message.isPinned ? "white" : "black",
                    cursor: "pointer",
                  }}
                >
                  📌
                </button>
              )}
              <button
                onClick={() => handleDeleteMessage(message._id)}
                style={{
                  padding: "5px 10px",
                  fontSize: "12px",
                  border: "1px solid #ef4444",
                  borderRadius: "4px",
                  backgroundColor: "white",
                  color: "#ef4444",
                  cursor: "pointer",
                }}
              >
                🗑️
              </button>
            </div>
          )}
        </div>

        {}
        {hasReplies && expandedThreads.has(message._id) && (
          <div style={{ marginTop: "15px" }}>
            {replies.map((reply) => renderMessage(reply, true))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return <div>Loading forum...</div>;
  }

  return (
    <div
      style={{
        marginTop: "30px",
        padding: "20px",
        backgroundColor: "white",
        borderRadius: "8px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      }}
    >
      <h3 style={{ marginBottom: "20px" }}>Discussion Forum</h3>

      {error && (
        <div
          style={{
            padding: "10px",
            backgroundColor: "#fee2e2",
            color: "#dc2626",
            borderRadius: "4px",
            marginBottom: "15px",
          }}
        >
          {error}
        </div>
      )}

      {}
      <form onSubmit={handlePostMessage} style={{ marginBottom: "20px" }}>
        {replyingTo && (
          <div
            style={{
              padding: "10px",
              backgroundColor: "#f3f4f6",
              borderRadius: "4px",
              marginBottom: "10px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: "14px" }}>
              Replying to <strong>{replyingTo.authorName}</strong>
            </span>
            <button
              type="button"
              onClick={() => setReplyingTo(null)}
              style={{
                padding: "2px 8px",
                fontSize: "12px",
                border: "none",
                backgroundColor: "#ef4444",
                color: "white",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        )}
        <textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={replyingTo ? "Write a reply..." : "Share your thoughts..."}
          style={{
            width: "100%",
            minHeight: "80px",
            padding: "10px",
            border: "1px solid #d1d5db",
            borderRadius: "4px",
            resize: "vertical",
            fontFamily: "inherit",
          }}
        />
        <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
          <button
            type="submit"
            style={{
              padding: "10px 20px",
              backgroundColor: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            {replyingTo ? "Post Reply" : "Post Message"}
          </button>
          {isOrganizer && !replyingTo && (
            <button
              type="button"
              onClick={handlePostAnnouncement}
              style={{
                padding: "10px 20px",
                backgroundColor: "#f59e0b",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              Post as Announcement
            </button>
          )}
        </div>
      </form>

      {}
      <div>
        {getTopLevelMessages().length === 0 ? (
          <p style={{ textAlign: "center", color: "#6b7280", padding: "20px" }}>
            No messages yet. Be the first to start a discussion!
          </p>
        ) : (
          getTopLevelMessages().map((message) => renderMessage(message))
        )}
      </div>

      <div ref={messagesEndRef} />
    </div>
  );
}
