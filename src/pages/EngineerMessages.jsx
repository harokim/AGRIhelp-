import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useMessages } from "../context/MessageContext";
import { Avatar } from "./ClientMessages";

export default function EngineerMessages() {
  const { user, users } = useAuth();
  const clients = users.filter((item) => item.role === "client" && item.status !== "inactive");
  const [selected, setSelected] = useState(clients[0]?.id || "");
  const [text, setText] = useState("");
  const peer = clients.find((item) => item.id === selected);
  const { messages, sendMessage } = useMessages();
  const thread = peer ? messages.filter((message) => (message.from === user.id && message.to === peer.id) || (message.from === peer.id && message.to === user.id)) : [];
  const submit = async (event) => { event.preventDefault(); if (!peer || !text.trim()) return; await sendMessage(user.id, peer.id, text); setText(""); };
  return <div className="container page-container"><div className="page-header"><span className="eyebrow">MESSENGER</span><h1>Client messages</h1><p>Pick a client and switch conversations whenever you need.</p></div><div className="messenger-layout card"><aside className="conversation-list">{clients.map((client) => <button className={selected === client.id ? "selected" : ""} key={client.id} onClick={() => setSelected(client.id)}><Avatar u={client} /><span><strong>{client.name}</strong><small>{client.association}</small></span></button>)}</aside><section className="chat-pane">{peer ? <><div className="chat-head"><Avatar u={peer} /><div><strong>{peer.name}</strong><span>{peer.association}</span></div></div><div className="chat-body">{thread.map((message) => <div key={message.id} className={`bubble ${message.from === user.id ? "mine" : "theirs"}`}><p>{message.text}</p></div>)}</div><form className="message-compose" onSubmit={submit}><input value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a message..." /><button className="primary-btn">Send</button></form></> : <div className="empty-state">Select a client.</div>}</section></div></div>;
}
