import { useMemo, useState } from "react";
import { useRequests } from "../context/RequestContext";
import { useAppointments } from "../context/AppointmentContext";
import { useAuth } from "../context/AuthContext";

const statuses = ["All", "Submitted", "Under Review", "Documents Pending", "Approved", "Rejected"];

function escapeCsv(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function getRequestDate(request) {
  const value = request.createdAt?.toDate ? request.createdAt.toDate() : request.createdAt || request.date;
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? String(value).slice(0, 10) : date.toISOString().slice(0, 10);
}

export default function Reports() {
  const { requests } = useRequests();
  const { appointments } = useAppointments();
  const { users } = useAuth();
  const [status, setStatus] = useState("All");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const filtered = useMemo(() => requests.filter((request) => {
    const requestDate = getRequestDate(request);
    return (status === "All" || request.status === status) && (!from || requestDate >= from) && (!to || requestDate <= to);
  }), [requests, status, from, to]);

  const getClient = (id) => users.find((user) => user.id === id);
  const approved = filtered.filter((request) => request.status === "Approved").length;
  const rejected = filtered.filter((request) => request.status === "Rejected").length;
  const pending = filtered.filter((request) => !["Approved", "Rejected"].includes(request.status)).length;

  const printReport = () => {
    const rows = filtered.map((request) => {
      const client = getClient(request.clientId);
      return `<tr><td>${escapeHtml(request.referenceNumber || request.id)}</td><td>${escapeHtml(client?.name || "Unknown")}</td><td>${escapeHtml(request.association || "")}</td><td>${escapeHtml(request.details || "")}</td><td>${escapeHtml(request.status || "")}</td><td>${escapeHtml(getRequestDate(request))}</td></tr>`;
    }).join("");
    const reportWindow = window.open("", "_blank", "width=1100,height=800");
    if (!reportWindow) return;
    reportWindow.document.write(`<!doctype html><html><head><title>AGRIhelp Request Report</title><style>body{font-family:Arial,sans-serif;padding:32px;color:#17231a}h1{margin-bottom:4px}p{color:#66736a}.summary{display:flex;gap:24px;margin:24px 0}.summary div{border:1px solid #ddd;padding:12px 18px;border-radius:8px}.summary strong{display:block;font-size:22px}table{width:100%;border-collapse:collapse;font-size:11px}th,td{padding:8px;border:1px solid #ddd;text-align:left;vertical-align:top}th{background:#f0f4f0}@media print{button{display:none}}</style></head><body><h1>AGRIhelp Request Report</h1><p>Municipal Agricultural and Biosystems Engineering Office</p><p>Generated: ${new Date().toLocaleString()}</p><p>Filters: Status = ${status}; From = ${from || "Any"}; To = ${to || "Any"}</p><div class="summary"><div><span>Total</span><strong>${filtered.length}</strong></div><div><span>Pending</span><strong>${pending}</strong></div><div><span>Approved</span><strong>${approved}</strong></div><div><span>Rejected</span><strong>${rejected}</strong></div></div><table><thead><tr><th>Reference</th><th>Client</th><th>Association</th><th>Request</th><th>Status</th><th>Date</th></tr></thead><tbody>${rows || '<tr><td colspan="6">No requests match the selected filters.</td></tr>'}</tbody></table><script>window.onload=()=>window.print();</script></body></html>`);
    reportWindow.document.close();
  };

  const exportCsv = () => {
    const header = ["Reference", "Client", "Email", "Association", "Request", "Status", "Date"];
    const rows = filtered.map((request) => {
      const client = getClient(request.clientId);
      return [request.referenceNumber || request.id, client?.name || "Unknown", client?.email || "", request.association || "", request.details || "", request.status || "", getRequestDate(request)];
    });
    const csv = [header, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `AGRIhelp-request-report-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return <div className="container page-container"><div className="page-header"><div><span className="eyebrow">ENGINEER REPORTS</span><h1>Report generation</h1><p>Generate a printable request report or export the filtered records as CSV.</p></div><div className="report-actions"><button className="secondary-btn" onClick={exportCsv}>Export CSV</button><button className="primary-btn" onClick={printReport}>Generate Report</button></div></div><section className="card report-filters"><div className="field"><label>Status</label><select value={status} onChange={(e) => setStatus(e.target.value)}>{statuses.map((item) => <option key={item}>{item}</option>)}</select></div><div className="field"><label>From date</label><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div><div className="field"><label>To date</label><input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div></section><div className="stats-grid report-stats"><div className="stat-card"><span>Total requests</span><strong>{filtered.length}</strong></div><div className="stat-card"><span>Pending</span><strong>{pending}</strong></div><div className="stat-card"><span>Approved</span><strong>{approved}</strong></div><div className="stat-card"><span>Rejected</span><strong>{rejected}</strong></div></div><section className="table-card"><div className="section-title"><div><h3>Report preview</h3><p>{filtered.length} request(s) match the selected filters.</p></div></div><table><thead><tr><th>Reference</th><th>Client</th><th>Association</th><th>Request</th><th>Status</th><th>Date</th></tr></thead><tbody>{filtered.map((request) => { const client = getClient(request.clientId); return <tr key={request.id}><td>{request.referenceNumber || request.id}</td><td><div className="table-user"><strong>{client?.name || "Unknown"}</strong><small>{client?.email || ""}</small></div></td><td>{request.association || ""}</td><td>{request.details || ""}</td><td><span className="status">{request.status}</span></td><td>{getRequestDate(request)}</td></tr>; })}{filtered.length === 0 && <tr><td colSpan="6" className="muted">No requests match the selected filters.</td></tr>}</tbody></table></section><section className="card report-appointment-note"><h3>Appointment records</h3><p>{appointments.length} appointment record(s) are currently available in the system. Appointment details remain available in the Appointments and Calendar modules.</p></section></div>;
}
