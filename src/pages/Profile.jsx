import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { fileToDataURL } from "../services/documentService";
import { MAX_PROFILE_IMAGE_SIZE } from "../utils";
import { Avatar } from "./ClientMessages";

export default function Profile({ viewEngineer = false }) {
  const { user, users, updateProfile } = useAuth();
  const target = viewEngineer ? users.find((item) => item.role === "engineer" && item.status !== "inactive") : user;
  const [form, setForm] = useState(target || {});
  useEffect(() => setForm(target || {}), [target?.id]);
  if (!target) return <div className="container page-container"><div className="empty-state">Engineer profile not available.</div></div>;
  const editable = !viewEngineer && user?.role === "engineer";
  const save = async () => { try { await updateProfile(target.id, { name: form.name, contactNumber: form.contactNumber, profileBio: form.profileBio }); alert("Profile updated."); } catch (error) { alert(error?.message || "Profile update failed."); } };
  const upload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_PROFILE_IMAGE_SIZE) { alert("Profile pictures must be 350KB or smaller."); return; }
    try { const avatar = await fileToDataURL(file); await updateProfile(target.id, { avatar }); setForm((current) => ({ ...current, avatar })); } catch (error) { alert(error?.message || "Could not update the profile picture."); }
  };
  return <div className="container page-container"><div className="profile-card card"><div className="profile-hero"><Avatar u={form} /><div><span className="eyebrow">ACCOUNT PROFILE</span><h1>{form.name}</h1><p>{form.role === "engineer" ? "Municipal Agricultural and Biosystems Engineering Office" : form.association}</p></div></div><div className="form-grid"><Field label="Full name" value={form.name || ""} disabled={!editable} onChange={(value) => setForm({ ...form, name: value })} /><Field label="Email" value={form.email || ""} disabled /><Field label="Contact number" value={form.contactNumber || ""} disabled={!editable} onChange={(value) => setForm({ ...form, contactNumber: value.replace(/\D/g, "") })} /><Field label="Position / profile" value={form.profileBio || form.position || ""} disabled={!editable} onChange={(value) => setForm({ ...form, profileBio: value })} /></div>{editable && <label className="secondary-btn upload-btn">Change profile picture<input hidden type="file" accept="image/*" onChange={upload} /></label>}{editable && <button className="primary-btn" onClick={save}>Save profile</button>}{!editable && <p className="muted">Contact information shown here is provided by the Engineer.</p>}</div></div>;
}
function Field({ label, value, onChange, disabled }) { return <div className="field"><label>{label}</label><input value={value} disabled={disabled} onChange={(e) => onChange?.(e.target.value)} /></div>; }
