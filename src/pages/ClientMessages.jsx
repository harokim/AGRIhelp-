import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useMessages } from "../context/MessageContext";
import { initials } from "../utils";

export function Avatar({ u }) {
  return (
    <div className="avatar">
      {u?.avatar ? (
        <img src={u.avatar} alt="" />
      ) : (
        initials(u?.name || u?.email || "User")
      )}
    </div>
  );
}

export default function ClientMessages() {
  const { user, users } = useAuth();
  const { messages, sendMessage } = useMessages();

  const peer = users.find(
    (item) => item.role === "engineer" && item.status !== "inactive"
  );

  const [text, setText] = useState("");

  const thread = peer
    ? messages.filter(
        (message) =>
          (message.from === user.id && message.to === peer.id) ||
          (message.from === peer.id && message.to === user.id)
      )
    : [];

  const submit = async (event) => {
    event.preventDefault();

    if (!peer || !text.trim()) return;

    await sendMessage(user.id, peer.id, text.trim());
    setText("");
  };

  return (
    <div className="container page-container">
      <div className="page-header">
        <div>
          <span className="eyebrow">MESSENGER</span>
          <h1>Messages</h1>
          <p>
            Direct conversation with the Municipal Agricultural and
            Biosystems Engineer.
          </p>
        </div>
      </div>

      <div className="messenger card">
        {peer ? (
          <>
            <div className="chat-head">
              <Avatar u={peer} />

              <div className="chat-person">
                <strong>{peer.name}</strong>
                <span>{peer.profileBio || "Engineer"}</span>
              </div>
            </div>

            <div className="chat-body">
              {thread.length > 0 ? (
                thread.map((message) => (
                  <div
                    key={message.id}
                    className={`bubble ${
                      message.from === user.id ? "mine" : "theirs"
                    }`}
                  >
                    <p>{message.text}</p>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <strong>No messages yet</strong>
                  <span>Send a message to the engineer.</span>
                </div>
              )}
            </div>

            <form className="message-compose" onSubmit={submit}>
              <input
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder="Write a message..."
              />

              <button type="submit" className="primary-btn">
                Send
              </button>
            </form>
          </>
        ) : (
          <div className="empty-state">
            <strong>No engineer account is available yet.</strong>
            <span>Please contact the system administrator.</span>
          </div>
        )}
      </div>
    </div>
  );
}