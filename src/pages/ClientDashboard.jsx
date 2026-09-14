import { useState } from "react";
import { useRequests } from "../context/RequestContext";
import { useAppointments } from "../context/AppointmentContext";
import { useAuth } from "../context/AuthContext";
import CalendarGrid from "../components/CalendarGrid";
import { formatDate } from "../utils";

export default function ClientDashboard() {
  const { user } = useAuth();
  const { requests } = useRequests();
  const { appointments, blockedDates } = useAppointments();
  const [search, setSearch] = useState("");
  const mine = requests.filter((request) => request.clientId === user.id);
  const upcoming = appointments.filter((appointment) => appointment.clientId === user.id);
  const list = mine.filter((request) => `${request.referenceNumber || request.id} ${request.association}`.toLowerCase().includes(search.toLowerCase()));
  return <div className="container page-container"><div className="welcome-banner"><div><span className="eyebrow">CLIENT PORTAL</span><h1>Welcome, {user.name?.split(" ")[0] || "Client"}</h1><p>{user.association || "Association account"}</p></div></div><div className="stats-grid"><div className="stat-card"><span>Total requests</span><strong>{mine.length}</strong></div><div className="stat-card"><span>Submitted</span><strong>{mine.filter((request) => ["Submitted", "Under Review"].includes(request.status)).length}</strong></div><div className="stat-card"><span>Approved</span><strong>{mine.filter((request) => request.status === "Approved").length}</strong></div><div className="stat-card"><span>Appointments</span><strong>{upcoming.length}</strong></div></div><button className="card profile-link-card" onClick={() => window.location.href = "/engineer-profile"}><strong>View Engineer profile</strong><span>See office contact information and profile.</span></button><div className="dashboard-grid"><section className="card"><div className="section-title"><div><h3>Recent requests</h3><p>Search your submitted requests.</p></div></div><input className="search-input" placeholder="Search request or association..." value={search} onChange={(e) => setSearch(e.target.value)} />{list.slice(0, 7).map((request) => <div className="activity-row" key={request.id}><div><strong>{request.association}</strong><span>{request.referenceNumber || request.id} · {formatDate(request.createdAt)}</span></div><span className={`status ${String(request.status).toLowerCase().replaceAll(" ", "-")}`}>{request.status}</span></div>)}{list.length === 0 && <p className="muted">No requests yet.</p>}</section><section className="card"><h3>Upcoming appointments</h3><CalendarGrid appointments={upcoming} blockedDates={blockedDates} /></section></div></div>;
}
