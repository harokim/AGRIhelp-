import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Brand from "./Brand";
import { initials } from "../utils";

export default function Sidebar({ mobileOpen = false, setMobileOpen = () => {} }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;
  const links = user.role === "engineer" ? [["/engineer", "⌂", "Dashboard"], ["/engineer-requests", "▣", "Client Requests"], ["/appointments", "◷", "Appointments"], ["/calendar", "▦", "Calendar"], ["/engineer-messages", "✉", "Messages"], ["/users", "♙", "User Management"]] : [["/client", "⌂", "Dashboard"], ["/requests", "▣", "My Requests"], ["/calendar", "▦", "Calendar"], ["/client-messages", "✉", "Messages"]];
  const handleLogout = async () => { await logout(); navigate("/", { replace: true }); };
  return <aside className={`sidebar ${mobileOpen ? "mobile-open" : ""}`}><div className="sidebar-inner"><Brand /><nav className="sidebar-nav">{links.map(([to, icon, label]) => <NavLink key={to} to={to} end={to === "/client" || to === "/engineer"} onClick={() => setMobileOpen(false)} className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}><span className="nav-icon">{icon}</span><span className="nav-label">{label}</span></NavLink>)}</nav><div className="sidebar-bottom"><button type="button" className="user-mini" onClick={() => { navigate("/profile"); setMobileOpen(false); }}><span className="avatar">{user.avatar ? <img src={user.avatar} alt="" /> : initials(user.name || user.email)}</span><span className="user-details"><strong>{user.name || "User"}</strong><small>{user.role}</small></span></button><button type="button" className="logout-btn" onClick={handleLogout}><span>↪</span><strong>Sign out</strong></button></div></div></aside>;
}
