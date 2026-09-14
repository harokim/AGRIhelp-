import { useState } from "react";
import { useRequests } from "../context/RequestContext";
import { useAuth } from "../context/AuthContext";

export default function EngineerRequests() {
  const { requests, documents, decide } = useRequests();
  const { users } = useAuth();
  const [search, setSearch] = useState("");
  const [note, setNote] = useState("");
  const [selected, setSelected] = useState(null);
  const list = requests.filter((request) => `${request.association} ${request.referenceNumber || request.id}`.toLowerCase().includes(search.toLowerCase()));
  const clientFor = (id) => users.find((user) => user.id === id);
  const setDecision = (request, status) => {
    if (!["Submitted", "Under Review"].includes(request.status)) return;
    if (status === "Documents Pending") { setSelected(request); setNote(""); return; }
    if (confirm(`Set ${request.referenceNumber || request.id} as ${status}?`)) decide(request.id, status);
  };
  const confirmPending = () => {
    if (!note.trim()) { alert("An internal note is required."); return; }
    decide(selected.id, "Documents Pending", note.trim());
    setSelected(null);
  };
  return <div className="container page-container"><div className="page-header"><span className="eyebrow">REQUEST MANAGEMENT</span><h1>Client requests</h1><p>Review requests and record the next decision.</p></div><input className="search-input wide-search" placeholder="Search association or request ID..." value={search} onChange={(e) => setSearch(e.target.value)} /><div className="request-list">{list.map((request) => { const client = clientFor(request.clientId); const docs = documents.filter((document) => document.requestId === request.id); return <div className="card request-review" key={request.id}><div className="request-top"><div><span className="request-id">{request.referenceNumber || request.id}</span><h3>{request.association}</h3><p>{request.details}</p><small>Client: {client?.name || "Unknown"} · {client?.email || ""}</small></div><span className={`status ${String(request.status).toLowerCase().replaceAll(" ", "-")}`}>{request.status}</span></div>{docs.length > 0 && <div className="file-list">{docs.map((document) => <span key={document.id}>📄 {document.fileName}</span>)}</div>}{["Submitted", "Under Review"].includes(request.status) ? <div className="decision-actions"><button className="primary-btn" onClick={() => setDecision(request, "Approved")}>Approve</button><button className="danger-btn" onClick={() => setDecision(request, "Rejected")}>Reject</button><button className="secondary-btn" onClick={() => setDecision(request, "Documents Pending")}>Documents Pending</button></div> : <div className="locked-note">Current status: {request.status}. {request.notes && `Note: ${request.notes}`}</div>}</div>; })}{list.length === 0 && <div className="empty-state">No requests found.</div>}</div>{selected && <div className="modal-backdrop"><div className="modal card"><h2>Request additional documents</h2><p>Add an internal note explaining what the client needs to provide.</p><textarea rows="5" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Internal note..." /><div className="form-actions"><button className="secondary-btn" onClick={() => setSelected(null)}>Cancel</button><button className="primary-btn" onClick={confirmPending}>Confirm</button></div></div></div>}</div>;
}
