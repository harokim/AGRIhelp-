import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function EngineerSignup() {
  const navigate = useNavigate();
  const { registerEngineer } = useAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    contactNumber: "",
  });

  const [busy, setBusy] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);

  const showFormError = () => {
    setShowValidationModal(true);
  };

  const isValidEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(email.trim());

  const isValidName = (name) =>
    /^[A-Za-zÑñ .'-]+$/.test(name.trim());

  const updateField = (name, value) => {
    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const submit = async (event) => {
    event.preventDefault();

    const contactNumber = form.contactNumber
      .replace(/\D/g, "")
      .slice(0, 11);

    if (
      !form.name.trim() ||
      !isValidName(form.name) ||
      !isValidEmail(form.email) ||
      form.password.length < 6 ||
      !/^09\d{9}$/.test(contactNumber)
    ) {
      showFormError();
      return;
    }

    try {
      setBusy(true);

      await registerEngineer({
        ...form,
        name: form.name.trim(),
        email: form.email.trim(),
        contactNumber,
      });

      alert("Engineer account created. Please sign in.");

      navigate("/", {
        replace: true,
      });
    } catch (error) {
      if (
        error?.code === "auth/email-already-in-use" ||
        error?.code === "auth/invalid-email" ||
        error?.code === "auth/weak-password"
      ) {
        showFormError();
      } else {
        alert(
          error?.message ||
            "Account creation failed. Please try again."
        );
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="simple-auth">
      <form
        className="auth-card"
        onSubmit={submit}
        noValidate
      >
        <span className="eyebrow">
          ENGINEER ACCOUNT
        </span>

        <h1>Create engineer account</h1>

        <p>
          Create a system administrator account for
          the municipal office.
        </p>

        <label>Full name</label>

        <input
          type="text"
          value={form.name}
          onChange={(event) =>
            updateField("name", event.target.value)
          }
          required
          placeholder="Enter full name"
        />

        <label>Office email</label>

        <input
          type="email"
          value={form.email}
          onChange={(event) =>
            updateField("email", event.target.value)
          }
          required
          placeholder="example@email.com"
        />

        <label>Contact number</label>

        <input
          type="text"
          inputMode="numeric"
          maxLength={11}
          value={form.contactNumber}
          onChange={(event) =>
            updateField(
              "contactNumber",
              event.target.value
                .replace(/\D/g, "")
                .slice(0, 11)
            )
          }
          required
          placeholder="09XXXXXXXXX"
        />

        <label>Password</label>

        <input
          type="password"
          value={form.password}
          onChange={(event) =>
            updateField(
              "password",
              event.target.value
            )
          }
          required
          minLength={6}
          placeholder="At least 6 characters"
        />

        <button
          type="submit"
          className="primary-btn full"
          disabled={busy}
        >
          {busy ? "Creating..." : "Create account"}
        </button>

        <button
          type="button"
          className="text-btn full"
          onClick={() => navigate("/")}
        >
          Back to login
        </button>
      </form>

      {showValidationModal && (
        <div
          className="signup-error-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="engineer-signup-error-title"
        >
          <div className="signup-error-modal">
            <div className="signup-error-icon">
              !
            </div>

            <h2 id="engineer-signup-error-title">
              Please fill out the form correctly
            </h2>

            <p>
              Some of the information entered is
              missing or invalid. Please check your
              details and try again.
            </p>

            <button
              type="button"
              className="primary-btn full"
              onClick={() => {
                setShowValidationModal(false);
                navigate("/", {
                  replace: true,
                });
              }}
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}