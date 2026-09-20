import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useMessages } from "../context/MessageContext";
import { Avatar } from "./ClientMessages";

export default function EngineerMessages() {
  const { user, users } = useAuth();
  const { messages, sendMessage } = useMessages();

  const clients = users.filter(
    (item) => item.role === "client" && item.status !== "inactive"
  );

  const [selected, setSelected] = useState(clients[0]?.id || "");
  const [text, setText] = useState("");

  const peer = clients.find((item) => item.id === selected);

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
          <h1>Client messages</h1>
          <p>
            Pick a client and switch conversations whenever you need.
          </p>
        </div>
      </div>

      <div className="messenger-layout card">
        <aside className="conversation-list">
          <div className="conversation-title">
            <strong>Clients</strong>
            <span>{clients.length}</span>
          </div>

          {clients.length > 0 ? (
            clients.map((client) => (
              <button
                type="button"
                className={
                  selected === client.id
                    ? "conversation-item selected"
                    : "conversation-item"
                }
                key={client.id}
                onClick={() => setSelected(client.id)}
              >
                <Avatar u={client} />

                <span className="conversation-info">
                  <strong>{client.name}</strong>
                  <small>{client.association || "Client"}</small>
                </span>
              </button>
            ))
          ) : (
            <div className="conversation-empty">
              No active clients available.
            </div>
          )}
        </aside>

        <section className="chat-pane">
          {peer ? (
            <>
              <div className="chat-head">
                <Avatar u={peer} />

                <div className="chat-person">
                  <strong>{peer.name}</strong>
                  <span>{peer.association || "Client"}</span>
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
                    <span>
                      Start the conversation with this client.
                    </span>
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
              <strong>Select a client</strong>
              <span>
                Choose a client from the list to open the conversation.
              </span>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}