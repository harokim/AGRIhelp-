import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useMessages } from "../context/MessageContext";
import { initials } from "../utils";

export function Avatar({ u }) { return <div className="avatar">{u?.avatar ? <img src={u.avatar} alt="" /> : initials(u?.name || u?.email || "User")}</div>; }

export default function ClientMessages() {
  const { user, users } = useAuth();
  const peer = users.find((item) => item.role === "engineer" && item.status !== "inactive");
  const { messages, sendMessage } = useMessages();
  const [text, setText] = useState("");
  const thread = peer ? messages.filter((message) => (message.from === user.id && message.to === peer.id) || (message.from === peer.id && message.to === user.id)) : [];
  const submit = async (event) => { event.preventDefault(); if (!peer || !text.trim()) return; await sendMessage(user.id, peer.id, text); setText(""); };
  return <div className="container page-container"><div className="page-header"><span className="eyebrow">MESSENGER</span><h1>Messages</h1><p>Direct conversation with the Municipal Agricultural and Biosystems Engineer.</p></div><div className="messenger card">{peer ? <><div className="chat-head"><Avatar u={peer} /><div><strong>{peer.name}</strong><span>{peer.profileBio || "Engineer"}</span></div></div><div className="chat-body">{thread.length ? thread.map((message) => <div key={message.id} className={`bubble ${message.from === user.id ? "mine" : "theirs"}`}><p>{message.text}</p></div>) : <div className="empty-state"><strong>No messages yet</strong><span>Send a message to the engineer.</span></div>}</div><form className="message-compose" onSubmit={submit}><input value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a message..." /><button className="primary-btn">Send</button></form></> : <div className="empty-state">No engineer account is available yet.</div>}</div></div>;
}
