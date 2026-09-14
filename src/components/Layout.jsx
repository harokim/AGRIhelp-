import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import Sidebar from "./Sidebar";

export default function Layout({ children }) {
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  if (!user) return children;
  return <div className="app-shell"><Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />{mobileOpen && <button type="button" className="mobile-backdrop" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}<main className="app-content"><button type="button" className="mobile-menu-btn" aria-label="Open navigation" onClick={() => setMobileOpen(true)}><span /><span /><span /></button>{children}</main></div>;
}
