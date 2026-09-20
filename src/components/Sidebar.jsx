import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { initials } from "../utils";

export default function Sidebar({
  collapsed = false,
  setCollapsed = () => {},
  mobileOpen = false,
  setMobileOpen = () => {}
}) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  if (!user) return null;

  const links =
    user.role === "engineer"
      ? [
          ["/engineer", "⌂", "Dashboard"],
          ["/engineer-requests", "▣", "Client Requests"],
          ["/appointments", "◷", "Appointments"],
          ["/calendar", "▦", "Calendar"],
          ["/engineer-messages", "✉", "Messages"],
          ["/users", "♙", "User Management"],
          ["/reports", "▤", "Reports"]
        ]
      : [
          ["/client", "⌂", "Dashboard"],
          ["/requests", "▣", "My Requests"],
          ["/calendar", "▦", "Calendar"],
          ["/client-messages", "✉", "Messages"]
        ];

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  const handleNavClick = () => {
    setMobileOpen(false);
  };

  return (
    <aside
      className={`sidebar ${collapsed ? "collapsed" : "expanded"} ${
        mobileOpen ? "mobile-open" : ""
      }`}
    >
      <div className="sidebar-inner">
        <div className="sidebar-header">
          <div className="sidebar-brand">
            {!collapsed && (
              <>
                <div className="sidebar-brand-mark">A</div>

                <div className="sidebar-brand-text">
                  <strong>AGRIhelp</strong>
                  <span>Agricultural Services</span>
                </div>
              </>
            )}

            {collapsed && (
              <div className="sidebar-brand-mark">A</div>
            )}
          </div>

          <button
            type="button"
            className="sidebar-toggle"
            onClick={() => setCollapsed((value) => !value)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? "›" : "‹"}
          </button>
        </div>

        <nav className="sidebar-nav">
          {links.map(([to, icon, label]) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/client" || to === "/engineer"}
              onClick={handleNavClick}
              title={collapsed ? label : undefined}
              className={({ isActive }) =>
                `nav-item ${isActive ? "active" : ""}`
              }
            >
              <span className="nav-icon">{icon}</span>
              <span className="nav-label">{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            title={
              collapsed
                ? theme === "light"
                  ? "Switch to dark mode"
                  : "Switch to light mode"
                : undefined
            }
          >
            <span className="theme-icon">
              {theme === "light" ? "☾" : "☀"}
            </span>

            {!collapsed && (
              <span className="theme-label">
                {theme === "light" ? "Dark mode" : "Light mode"}
              </span>
            )}
          </button>

          <button
            type="button"
            className="user-mini"
            onClick={() => {
              navigate("/profile");
              setMobileOpen(false);
            }}
            title={collapsed ? user.name || user.email : undefined}
          >
            <span className="avatar">
              {user.avatar ? (
                <img src={user.avatar} alt="" />
              ) : (
                initials(user.name || user.email)
              )}
            </span>

            <span className="user-details">
              <strong>{user.name || "User"}</strong>
              <small>{user.role}</small>
            </span>
          </button>

          <button
            type="button"
            className="logout-btn"
            onClick={handleLogout}
            title={collapsed ? "Sign out" : undefined}
          >
            <span>↪</span>
            <strong>Sign out</strong>
          </button>
        </div>
      </div>
    </aside>
  );
}