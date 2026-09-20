import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useRequests } from "../context/RequestContext";
import { ASSOCIATIONS, MAX_FILE_SIZE } from "../utils";
import { saveDocument, fileToDataURL } from "../services/documentService";

export default function Requests() {
  const { user } = useAuth();
  const { requests, createRequest } = useRequests();
  const [form, setForm] = useState({ association: user?.association || "", details: "" });
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [search, setSearch] = useState("");
  const [previewFile, setPreviewFile] = useState(null);
  const updateForm = (name, value) => setForm((previous) => ({ ...previous, [name]: value }));

  const changeFiles = async (event) => {
    const selected = Array.from(event.target.files || []);
    if (!selected.length) return;
    const invalid = selected.find((file) => file.size > MAX_FILE_SIZE);
    if (invalid) { alert(`"${invalid.name}" is larger than 600KB.`); event.target.value = ""; return; }
    const fresh = selected.filter((file) => !files.some((old) => old.name === file.name && old.size === file.size));
    if (!fresh.length) { alert("The selected files are already in the list."); event.target.value = ""; return; }
    const nextPreviews = [];
    for (const file of fresh) {
      let url = null;
      if (file.type.startsWith("image/") || file.type === "application/pdf") {
        try { url = await fileToDataURL(file); } catch { url = null; }
      }
      nextPreviews.push({ name: file.name, type: file.type, url });
    }
    setFiles((previous) => [...previous, ...fresh]);
    setPreviews((previous) => [...previous, ...nextPreviews]);
    event.target.value = "";
  };

  const removeFile = (index) => {
    setFiles((previous) => previous.filter((_, i) => i !== index));
    setPreviews((previous) => previous.filter((_, i) => i !== index));
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!form.association || !form.details.trim()) { alert("Please complete the request."); return; }
    if (!user?.id) { alert("Please sign in again."); return; }
    try {
      const request = await createRequest({ clientId: user.id, association: form.association, details: form.details.trim() });
      for (const file of files) await saveDocument({ file, requestId: request.id, clientId: user.id });
      setForm({ association: user.association || "", details: "" });
      setFiles([]);
      setPreviews([]);
      alert("Request submitted successfully.");
    } catch (error) {
      alert(error?.message || "The request could not be submitted.");
    }
  };

  const mine = requests.filter((request) => request.clientId === user?.id).filter((request) => `${request.referenceNumber || request.id} ${request.association}`.toLowerCase().includes(search.toLowerCase()));
  return <div className="page"><div className="page-header"><span className="eyebrow">SERVICE REQUESTS</span><h1>My Requests</h1><p>Submit requests and keep your documents organized.</p></div><div className="two-column"><form className="card form-card" onSubmit={submit}><h3>New service request</h3><label>Association name</label><select value={form.association} onChange={(e) => updateForm("association", e.target.value)} required><option value="">Select association</option>{ASSOCIATIONS.map((association) => <option key={association} value={association}>{association}</option>)}</select><label>Request details</label><textarea rows="7" value={form.details} onChange={(e) => updateForm("details", e.target.value)} required placeholder="Describe your request..." /><label>Supporting documents</label><p className="upload-help">Without Firebase Storage, each file is limited to 600KB. PDF and image files are recommended.</p><label className="file-upload-box"><span className="file-upload-icon">📁</span><strong>Click to select documents</strong><small>Maximum 600KB per file</small><input type="file" multiple accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg" onChange={changeFiles} /></label>{files.length > 0 && <div className="upload-section"><div className="upload-section-header"><strong>Selected documents ({files.length})</strong><button type="button" className="text-btn" onClick={() => { setFiles([]); setPreviews([]); }}>Clear all</button></div><div className="upload-file-list">{files.map((file, index) => { const preview = previews[index]; const image = file.type.startsWith("image/"); return <div className="upload-file-item" key={`${file.name}-${file.size}-${index}`}><div className="upload-thumbnail">{image && preview?.url ? <img src={preview.url} alt={file.name} /> : <span className="file-type-icon">{file.type === "application/pdf" ? "PDF" : "FILE"}</span>}</div><div className="upload-file-info"><strong title={file.name}>{file.name}</strong><small>{(file.size / 1024).toFixed(0)} KB</small></div><div className="upload-file-actions">{preview?.url && <button type="button" className="secondary-btn small" onClick={() => setPreviewFile(preview)}>Preview</button>}<button type="button" className="danger-btn small" onClick={() => removeFile(index)}>Remove</button></div></div>; })}</div></div>}<button type="submit" className="primary-btn full">Submit request</button></form><section><div className="section-heading-row"><div><h3>Submitted requests</h3><p>Track your request status.</p></div></div><input className="search-input wide-search" placeholder="Search request or association..." value={search} onChange={(e) => setSearch(e.target.value)} />{mine.map((request) => <div className="card request-row" key={request.id}><div><span className="request-id">{request.referenceNumber || request.id}</span><h3>{request.association}</h3><p>{request.details}</p><small>{request.createdAt}</small></div><span className={`status ${String(request.status).toLowerCase().replaceAll(" ", "-")}`}>{request.status}</span></div>)}{mine.length === 0 && <div className="empty-state">No requests found.</div>}</section></div>{previewFile && <div className="modal-backdrop" onClick={() => setPreviewFile(null)}><div className="modal card" onClick={(e) => e.stopPropagation()}><div className="modal-header"><h2>{previewFile.name}</h2><button className="text-btn" onClick={() => setPreviewFile(null)}>Close</button></div>{previewFile.type === "application/pdf" ? <iframe className="document-preview" src={previewFile.url} title={previewFile.name} /> : <img className="document-preview-image" src={previewFile.url} alt={previewFile.name} />}</div></div>}</div>;
}
