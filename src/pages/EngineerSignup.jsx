import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function EngineerSignup() {
  const navigate = useNavigate();
  const { registerEngineer } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "", contactNumber: "" });
  const [busy, setBusy] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    if (!form.name || !form.email || form.password.length < 6 || !/^09\d{9}$/.test(form.contactNumber)) { alert("Complete the form. Use a valid Philippine mobile number and a password with at least 6 characters."); return; }
    try { setBusy(true); await registerEngineer(form); alert("Engineer account created. Please sign in."); navigate("/", { replace: true }); } catch (error) { alert(error?.code === "auth/email-already-in-use" ? "That email is already registered." : error?.message || "Account creation failed."); } finally { setBusy(false); }
  };
  return <div className="simple-auth"><form className="auth-card" onSubmit={submit}><img className="login-logo" src="/favicon.svg" alt="AGRIhelp" /><span className="eyebrow">ENGINEER ACCOUNT</span><h1>Create engineer account</h1><p>Create a system administrator account for the municipal office.</p><label>Full name</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /><label>Office email</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /><label>Contact number</label><input inputMode="numeric" value={form.contactNumber} onChange={(e) => setForm({ ...form, contactNumber: e.target.value.replace(/\D/g, "") })} required /><label>Password</label><input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /><button className="primary-btn full" disabled={busy}>{busy ? "Creating..." : "Create account"}</button><button type="button" className="text-btn full" onClick={() => navigate("/")}>Back to login</button></form></div>;
}
