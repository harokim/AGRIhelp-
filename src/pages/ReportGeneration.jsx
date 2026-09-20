import { useEffect, useMemo, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { PDFDocument } from "pdf-lib";
import { useAuth } from "../context/AuthContext";
import { useRequests } from "../context/RequestContext";
import { db, firebaseConfigured } from "../firebase";
import { deleteReportDocument, saveReportDocument } from "../services/reportService";
import { MAX_FILE_SIZE } from "../utils";

function dataUrlToBytes(dataUrl) {
  const base64 = String(dataUrl || "").split(",")[1] || "";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function isSupported(item) {
  return item.contentType === "application/pdf" || item.contentType === "image/png" || item.contentType === "image/jpeg" || item.fileName?.toLowerCase().endsWith(".pdf") || /\.(png|jpe?g)$/i.test(item.fileName || "");
}

async function appendDocument(pdf, item) {
  const bytes = dataUrlToBytes(item.data);
  const type = item.contentType || "";
  const name = item.fileName || "";
  const isPdf = type === "application/pdf" || name.toLowerCase().endsWith(".pdf");
  if (isPdf) {
    const source = await PDFDocument.load(bytes);
    const pages = await pdf.copyPages(source, source.getPageIndices());
    pages.forEach((page) => pdf.addPage(page));
    return;
  }
  const image = type === "image/png" || name.toLowerCase().endsWith(".png") ? await pdf.embedPng(bytes) : await pdf.embedJpg(bytes);
  const maxWidth = 595;
  const maxHeight = 842;
  const scale = Math.min(maxWidth / image.width, maxHeight / image.height, 1);
  const width = image.width * scale;
  const height = image.height * scale;
  const page = pdf.addPage([595, 842]);
  page.drawImage(image, { x: (595 - width) / 2, y: (842 - height) / 2, width, height });
}

export default function ReportGeneration() {
  const { user } = useAuth();
  const { requests, documents } = useRequests();
  const [selectedRequestId, setSelectedRequestId] = useState("");
  const [engineerDocuments, setEngineerDocuments] = useState([]);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  const clientRequests = useMemo(() => [...requests].sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || ""))), [requests]);
  const selectedRequest = clientRequests.find((request) => request.id === selectedRequestId);
  const clientDocuments = useMemo(() => selectedRequestId ? documents.filter((item) => item.requestId === selectedRequestId && item.clientId === selectedRequest?.clientId) : [], [documents, selectedRequestId, selectedRequest?.clientId]);
  const allDocuments = useMemo(() => [...clientDocuments, ...engineerDocuments], [clientDocuments, engineerDocuments]);
  const unsupported = allDocuments.filter((item) => !isSupported(item));

  useEffect(() => {
    if (!firebaseConfigured || !db || !selectedRequestId) {
      setEngineerDocuments([]);
      return undefined;
    }
    const reportQuery = query(collection(db, "reportDocuments"), where("requestId", "==", selectedRequestId));
    return onSnapshot(reportQuery, (snapshot) => {
      setEngineerDocuments(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })).sort((a, b) => String(a.fileName || "").localeCompare(String(b.fileName || ""))));
    }, () => setEngineerDocuments([]));
  }, [selectedRequestId]);

  const addEngineerDocuments = async (event) => {
    const selected = Array.from(event.target.files || []);
    event.target.value = "";
    if (!selected.length || !selectedRequestId || !user?.id) return;
    const invalid = selected.find((file) => file.size > MAX_FILE_SIZE || !["application/pdf", "image/png", "image/jpeg"].includes(file.type));
    if (invalid) {
      alert("Only PDF, PNG, and JPG files up to 600 KB can be added to a report.");
      return;
    }
    setUploading(true);
    try {
      for (const file of selected) await saveReportDocument({ file, requestId: selectedRequestId, engineerId: user.id });
      alert("Engineer document added.");
    } catch (error) {
      alert(error?.message || "The document could not be added.");
    } finally {
      setUploading(false);
    }
  };

  const removeEngineerDocument = async (documentId) => {
    if (!confirm("Remove this engineer document from the report?")) return;
    try {
      await deleteReportDocument(documentId);
    } catch (error) {
      alert(error?.message || "The document could not be removed.");
    }
  };

  const exportPdf = async () => {
    if (!selectedRequestId || !allDocuments.length) {
      alert("Select a client submission with documents first.");
      return;
    }
    if (unsupported.length) {
      alert("All report documents must be PDF, PNG, or JPG files before exporting.");
      return;
    }
    setBusy(true);
    try {
      const pdf = await PDFDocument.create();
      for (const item of allDocuments) await appendDocument(pdf, item);
      if (!pdf.getPageCount()) throw new Error("There are no readable documents to export.");
      const bytes = await pdf.save();
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = \`AGRIhelp-Documents-\${selectedRequest?.referenceNumber || selectedRequestId}.pdf\`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert(error?.message || "The PDF could not be generated.");
    } finally {
      setBusy(false);
    }
  };

  return <div className="container page-container report-page">
    <div className="page-header"><div><span className="eyebrow">DOCUMENT REPORTS</span><h1>Generate Report</h1><p>Compile client documents and engineer-provided documents into one readable PDF.</p></div></div>
    <div className="report-layout">
      <section className="card report-control-card">
        <h3>Select client submission</h3>
        <p className="muted">The exported PDF contains documents only. Request details and status are not included.</p>
        <label>Client submission</label>
        <select value={selectedRequestId} onChange={(event) => setSelectedRequestId(event.target.value)}>
          <option value="">Select a submission</option>
          {clientRequests.map((request) => <option value={request.id} key={request.id}>{request.referenceNumber || request.id} — {request.association}</option>)}
        </select>
        <div className="report-upload-box">
          <div><strong>Add engineer documents</strong><span>PDF, PNG, or JPG · maximum 600 KB each</span></div>
          <label className="secondary-btn report-upload-button">{uploading ? "Adding..." : "Add files"}<input type="file" multiple accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg" onChange={addEngineerDocuments} disabled={!selectedRequestId || uploading} /></label>
        </div>
        <button type="button" className="primary-btn full report-export-button" onClick={exportPdf} disabled={busy || !selectedRequestId || !allDocuments.length || unsupported.length}>{busy ? "Generating PDF..." : "Export Documents as PDF"}</button>
      </section>
      <section className="card report-documents-card">
        <div className="section-title"><div><h3>Documents</h3><p>{allDocuments.length} document{allDocuments.length === 1 ? "" : "s"} included</p></div></div>
        {!selectedRequestId && <div className="empty-state">Select a client submission to view its documents.</div>}
        {selectedRequestId && allDocuments.length === 0 && <div className="empty-state">No documents have been added to this submission.</div>}
        {selectedRequestId && clientDocuments.length > 0 && <div className="report-document-group"><span className="report-group-label">Client documents</span>{clientDocuments.map((item) => <div className="report-document-row" key={item.id}><div className="report-document-icon">{item.contentType === "application/pdf" ? "PDF" : "IMG"}</div><div className="report-document-name"><strong>{item.fileName}</strong><span>{(item.fileSize / 1024).toFixed(0)} KB</span></div><span className="report-source">Client</span></div>)}</div>}
        {selectedRequestId && engineerDocuments.length > 0 && <div className="report-document-group"><span className="report-group-label">Engineer documents</span>{engineerDocuments.map((item) => <div className="report-document-row" key={item.id}><div className="report-document-icon">{item.contentType === "application/pdf" ? "PDF" : "IMG"}</div><div className="report-document-name"><strong>{item.fileName}</strong><span>{(item.fileSize / 1024).toFixed(0)} KB</span></div><span className="report-source engineer">Engineer</span><button type="button" className="danger-btn small" onClick={() => removeEngineerDocument(item.id)}>Remove</button></div>)}</div>}
        {unsupported.length > 0 && <div className="report-warning">Unsupported files are present. Export requires PDF, PNG, or JPG documents so every document can remain readable in the final PDF.</div>}
      </section>
    </div>
  </div>;
}
