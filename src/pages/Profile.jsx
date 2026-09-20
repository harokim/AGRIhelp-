import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { fileToDataURL } from "../services/documentService";
import { MAX_PROFILE_IMAGE_SIZE } from "../utils";
import { Avatar } from "./ClientMessages";

export default function Profile({ viewEngineer = false }) {
  const { user, users, updateProfile } = useAuth();

  const target = viewEngineer
    ? users.find(
        (item) =>
          item.role === "engineer" && item.status !== "inactive"
      )
    : user;

  const [form, setForm] = useState(target || {});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(target || {});
  }, [target?.id]);

  if (!target) {
    return (
      <div className="container page-container">
        <div className="empty-state">
          Engineer profile not available.
        </div>
      </div>
    );
  }

  const editable = !viewEngineer && target.id === user?.id;

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const save = async () => {
    if (!form.name?.trim()) {
      alert("Full name is required.");
      return;
    }

    if (!form.contactNumber?.trim()) {
      alert("Contact number is required.");
      return;
    }

    setSaving(true);

    try {
      await updateProfile(target.id, {
        name: form.name.trim(),
        contactNumber: form.contactNumber.replace(/\D/g, ""),
        profileBio: form.profileBio?.trim() || "",
      });

      alert("Profile updated successfully.");
    } catch (error) {
      alert(error?.message || "Profile update failed.");
    } finally {
      setSaving(false);
    }
  };

  const upload = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (file.size > MAX_PROFILE_IMAGE_SIZE) {
      alert("Profile pictures must be 350KB or smaller.");
      event.target.value = "";
      return;
    }

    try {
      const avatar = await fileToDataURL(file);

      await updateProfile(target.id, {
        avatar,
      });

      setForm((current) => ({
        ...current,
        avatar,
      }));

      alert("Profile picture updated.");
    } catch (error) {
      alert(
        error?.message || "Could not update the profile picture."
      );
    } finally {
      event.target.value = "";
    }
  };

  return (
    <div className="container page-container">
      <div className="page-header">
        <div>
          <span className="eyebrow">ACCOUNT PROFILE</span>
          <h1>My Profile</h1>
          <p>
            View and manage the information connected to your AGRIhelp
            account.
          </p>
        </div>
      </div>

      <div className="profile-card card">
        <div className="profile-hero">
          <Avatar u={form} />

          <div>
            <span className="eyebrow">ACCOUNT PROFILE</span>

            <h1>{form.name || "User"}</h1>

            <p>
              {form.role === "engineer"
                ? "Municipal Agricultural and Biosystems Engineering Office"
                : form.association || "Client"}
            </p>
          </div>
        </div>

        <div className="form-grid">
          <Field
            label="Full name"
            value={form.name || ""}
            disabled={!editable}
            onChange={(value) => updateField("name", value)}
          />

          <Field
            label="Email"
            value={form.email || ""}
            disabled
          />

          <Field
            label="Contact number"
            value={form.contactNumber || ""}
            disabled={!editable}
            onChange={(value) =>
              updateField(
                "contactNumber",
                value.replace(/\D/g, "")
              )
            }
          />

          <Field
            label={
              form.role === "engineer"
                ? "Position / profile"
                : "Position / profile"
            }
            value={form.profileBio || form.position || ""}
            disabled={!editable}
            onChange={(value) =>
              updateField("profileBio", value)
            }
          />

          <Field
            label="Association"
            value={form.association || ""}
            disabled
          />

          <Field
            label="Barangay"
            value={form.barangay || ""}
            disabled
          />
        </div>

        {editable && (
          <div className="profile-actions">
            <label className="secondary-btn upload-btn">
              Change profile picture

              <input
                hidden
                type="file"
                accept="image/*"
                onChange={upload}
              />
            </label>

            <button
              type="button"
              className="primary-btn"
              onClick={save}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save profile"}
            </button>
          </div>
        )}

        {!editable && viewEngineer && (
          <p className="muted">
            This is the Engineer's profile information.
          </p>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  disabled,
}) {
  return (
    <div className="field">
      <label>{label}</label>

      <input
        value={value}
        disabled={disabled}
        onChange={(event) =>
          onChange?.(event.target.value)
        }
      />
    </div>
  );
}