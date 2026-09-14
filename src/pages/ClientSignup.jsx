import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ASSOCIATIONS } from "../utils";

const PSGC_API = "https://psgc.cloud/api/v2";

const empty = {
  firstName: "",
  middleName: "",
  lastName: "",
  birthday: "",
  civilStatus: "",
  contactNumber: "",
  email: "",
  password: "",
  association: "",
  members: "",
  year: "",
  officeAddress: "",
  position: "",
  region: "",
  province: "",
  municipality: "",
  barangay: "",
};

async function getLocations(path) {
  const response = await fetch(`${PSGC_API}${path}`);

  if (!response.ok) {
    throw new Error("Unable to load Philippine location data.");
  }

  const json = await response.json();
  return json.data || [];
}

export default function ClientSignup() {
  const navigate = useNavigate();
  const { registerClient } = useAuth();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState(empty);

  const [regions, setRegions] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [municipalities, setMunicipalities] = useState([]);
  const [barangays, setBarangays] = useState([]);

  const [loadingLocations, setLoadingLocations] = useState(false);
  const [locationError, setLocationError] = useState("");



  const updateField = (name, value) => {
    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };



  const calculateAge = (birthday) => {
    if (!birthday) return "";

    const birthDate = new Date(`${birthday}T00:00:00`);
    const today = new Date();

    let age = today.getFullYear() - birthDate.getFullYear();

    const monthDifference =
      today.getMonth() - birthDate.getMonth();

    if (
      monthDifference < 0 ||
      (monthDifference === 0 &&
        today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  };

  const age = calculateAge(form.birthday);


  useEffect(() => {
    let mounted = true;

    async function loadRegions() {
      try {
        setLoadingLocations(true);
        setLocationError("");

        const data = await getLocations("/regions");

        if (mounted) {
          setRegions(data);
        }
      } catch (error) {
        if (mounted) {
          setLocationError(
            "Philippine address data could not be loaded. Please check your internet connection."
          );
        }
      } finally {
        if (mounted) {
          setLoadingLocations(false);
        }
      }
    }

    loadRegions();

    return () => {
      mounted = false;
    };
  }, []);



  useEffect(() => {
    if (!form.region) {
      setProvinces([]);
      return;
    }

    const selectedRegion = regions.find(
      (region) => region.name === form.region
    );

    if (!selectedRegion) return;

    let mounted = true;

    async function loadProvinces() {
      try {
        setLoadingLocations(true);
        setLocationError("");

        const data = await getLocations(
          `/regions/${encodeURIComponent(
            selectedRegion.code
          )}/provinces`
        );

        if (mounted) {
          setProvinces(data);
        }
      } catch (error) {
        if (mounted) {
          setLocationError(
            "Unable to load provinces for the selected region."
          );
        }
      } finally {
        if (mounted) {
          setLoadingLocations(false);
        }
      }
    }

    loadProvinces();

    return () => {
      mounted = false;
    };
  }, [form.region, regions]);



  useEffect(() => {
    if (!form.region || !form.province) {
      setMunicipalities([]);
      return;
    }

    const selectedRegion = regions.find(
      (region) => region.name === form.region
    );

    const selectedProvince = provinces.find(
      (province) => province.name === form.province
    );

    if (!selectedRegion || !selectedProvince) return;

    let mounted = true;

    async function loadMunicipalities() {
      try {
        setLoadingLocations(true);
        setLocationError("");

        const data = await getLocations(
          `/regions/${encodeURIComponent(
            selectedRegion.code
          )}/provinces/${encodeURIComponent(
            selectedProvince.code
          )}/cities-municipalities`
        );

        if (mounted) {
          setMunicipalities(data);
        }
      } catch (error) {
        if (mounted) {
          setLocationError(
            "Unable to load municipalities and cities."
          );
        }
      } finally {
        if (mounted) {
          setLoadingLocations(false);
        }
      }
    }

    loadMunicipalities();

    return () => {
      mounted = false;
    };
  }, [form.region, form.province, regions, provinces]);



  useEffect(() => {
    if (
      !form.region ||
      !form.province ||
      !form.municipality
    ) {
      setBarangays([]);
      return;
    }

    const selectedMunicipality = municipalities.find(
      (municipality) =>
        municipality.name === form.municipality
    );

    if (!selectedMunicipality) return;

    let mounted = true;

    async function loadBarangays() {
      try {
        setLoadingLocations(true);
        setLocationError("");

        const data = await getLocations(
          `/cities-municipalities/${encodeURIComponent(
            selectedMunicipality.code
          )}/barangays`
        );

        if (mounted) {
          setBarangays(data);
        }
      } catch (error) {
        if (mounted) {
          setLocationError(
            "Unable to load barangays for the selected municipality/city."
          );
        }
      } finally {
        if (mounted) {
          setLoadingLocations(false);
        }
      }
    }

    loadBarangays();

    return () => {
      mounted = false;
    };
  }, [
    form.region,
    form.province,
    form.municipality,
    municipalities,
  ]);



  const validateStep = () => {
    if (step === 1) {
      if (
        !form.firstName.trim() ||
        !form.lastName.trim() ||
        !form.birthday
      ) {
        alert("Please complete all required personal information.");
        return false;
      }

      if (age < 18) {
        alert("Account holders must be at least 18 years old.");
        return false;
      }
    }

    if (step === 2) {
      if (
        !/^09\d{9}$/.test(form.contactNumber)
      ) {
        alert(
          "Enter a valid Philippine mobile number, for example 09171234567."
        );
        return false;
      }

      if (
        !/^[^\s@]+@(gmail|yahoo)\.com$/i.test(
          form.email
        )
      ) {
        alert("Please use a valid Gmail or Yahoo email address.");
        return false;
      }

      if (form.password.length < 6) {
        alert("Password must contain at least 6 characters.");
        return false;
      }

      if (!form.association) {
        alert("Please select your association.");
        return false;
      }
    }

    if (step === 3) {
      if (
        !form.members ||
        !form.year ||
        !form.officeAddress.trim() ||
        !form.position
      ) {
        alert(
          "Please complete all required association information."
        );
        return false;
      }
    }

    if (step === 4) {
      if (
        !form.region ||
        !form.province ||
        !form.municipality ||
        !form.barangay
      ) {
        alert("Please complete your Philippine address.");
        return false;
      }
    }

    return true;
  };



  const nextStep = () => {
    if (!validateStep()) return;

    setStep((previous) => previous + 1);
  };


  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateStep()) return;

    const fullName = [
      form.firstName,
      form.middleName,
      form.lastName,
    ]
      .filter(Boolean)
      .join(" ");

    try {
      await registerClient({
        ...form,
        age,
        name: fullName,
      });
    } catch (error) {
      alert(error?.code === "auth/email-already-in-use" ? "That email is already registered." : error?.message || "Account creation failed.");
      return;
    }

    alert(
      "Account created successfully. Please sign in using your new account."
    );

    navigate("/", {
      replace: true,
    });
  };



  return (
    <div className="signup-page">
      <div className="signup-shell">

    
        <div className="signup-intro">

          <button
            type="button"
            className="back-link"
            onClick={() => navigate("/")}
          >
            ← Back to sign in
          </button>

          <img
            className="signup-logo"
            src="/favicon.svg"
            alt="AGRIhelp"
          />

          <h1>Create your AGRIhelp account</h1>

          <p>
            Register the association representative account
            used to submit requests and coordinate appointments.
          </p>

          {[
            "Personal information",
            "Contact & association",
            "Association details",
            "Verification & address",
          ].map((title, index) => {
            const number = index + 1;

            return (
              <div
                className={`progress-step ${
                  step >= number ? "done" : ""
                }`}
                key={title}
              >
                <span>{number}</span>

                <div>
                  <strong>{title}</strong>

                  <small>
                    {step > number
                      ? "Completed"
                      : step === number
                      ? "Current"
                      : "Upcoming"}
                  </small>
                </div>
              </div>
            );
          })}
        </div>

    
        <form
          className="signup-card"
          onSubmit={handleSubmit}
        >
          <span className="eyebrow">
            STEP {step} OF 4
          </span>

          <h2>
            {
              [
                "Personal information",
                "Contact information",
                "Association details",
                "Verification & address",
              ][step - 1]
            }
          </h2>

          {step === 1 && (
            <div className="form-grid">

              <Field
                label="First name"
                name="firstName"
                value={form.firstName}
                onChange={updateField}
                required
              />

              <Field
                label="Middle name"
                name="middleName"
                value={form.middleName}
                onChange={updateField}
              />

              <Field
                label="Last name"
                name="lastName"
                value={form.lastName}
                onChange={updateField}
                required
              />

              <Field
                label="Birthday"
                name="birthday"
                type="date"
                value={form.birthday}
                onChange={updateField}
                required
                max={new Date()
                  .toISOString()
                  .split("T")[0]}
              />

              <Field
                label="Age"
                name="age"
                value={age}
                readOnly
              />

              <SelectField
                label="Civil status"
                name="civilStatus"
                value={form.civilStatus}
                onChange={updateField}
                options={[
                  "Single",
                  "Married",
                  "Widowed",
                  "Separated",
                ]}
              />
            </div>
          )}

          {step === 2 && (
            <div className="form-grid">

              <Field
                label="Contact number"
                name="contactNumber"
                value={form.contactNumber}
                onChange={updateField}
                required
                inputMode="numeric"
                placeholder="09XXXXXXXXX"
                maxLength={11}
              />

              <Field
                label="Email address"
                name="email"
                type="email"
                value={form.email}
                onChange={updateField}
                required
                placeholder="example@gmail.com"
              />

              <Field
                label="Password"
                name="password"
                type="password"
                value={form.password}
                onChange={updateField}
                required
                minLength={6}
              />

              <div className="field wide">
                <label>
                  Association name *
                </label>

                <select
                  value={form.association}
                  onChange={(event) =>
                    updateField(
                      "association",
                      event.target.value
                    )
                  }
                  required
                >
                  <option value="">
                    Select association
                  </option>

                  {ASSOCIATIONS.map((association) => (
                    <option
                      key={association}
                      value={association}
                    >
                      {association}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="form-grid">

              <Field
                label="Total number of members"
                name="members"
                type="number"
                value={form.members}
                onChange={updateField}
                required
                min="1"
              />

              <Field
                label="Year of registration"
                name="year"
                type="number"
                value={form.year}
                onChange={updateField}
                required
                min="1900"
                max={new Date().getFullYear()}
              />

              <Field
                label="Farm / Association office address"
                name="officeAddress"
                value={form.officeAddress}
                onChange={updateField}
                required
                wide
                placeholder="Enter complete office address"
              />

              <SelectField
                label="Member's position in association"
                name="position"
                value={form.position}
                onChange={updateField}
                required
                options={[
                  "President",
                  "Vice President",
                  "Secretary",
                  "Treasurer",
                  "Representative",
                  "Other",
                ]}
              />
            </div>
          )}

          {step === 4 && (
            <div className="form-grid">

              <LocationSelect
                label="Region"
                value={form.region}
                items={regions}
                disabled={
                  loadingLocations &&
                  regions.length === 0
                }
                onChange={(value) => {
                  updateField("region", value);
                  updateField("province", "");
                  updateField("municipality", "");
                  updateField("barangay", "");
                }}
                required
              />

              <LocationSelect
                label="Province"
                value={form.province}
                items={provinces}
                disabled={
                  !form.region ||
                  loadingLocations
                }
                onChange={(value) => {
                  updateField("province", value);
                  updateField("municipality", "");
                  updateField("barangay", "");
                }}
                required
              />

              <LocationSelect
                label="Municipality / City"
                value={form.municipality}
                items={municipalities}
                disabled={
                  !form.province ||
                  loadingLocations
                }
                onChange={(value) => {
                  updateField("municipality", value);
                  updateField("barangay", "");
                }}
                required
              />

              <LocationSelect
                label="Barangay"
                value={form.barangay}
                items={barangays}
                disabled={
                  !form.municipality ||
                  loadingLocations
                }
                onChange={(value) =>
                  updateField("barangay", value)
                }
                required
              />

              <div className="field wide">
                <small>
                  {loadingLocations
                    ? "Loading Philippine location data..."
                    : locationError ||
                      "Address data follows the Philippine Standard Geographic Code (PSGC)."}
                </small>
              </div>
            </div>
          )}

          <div className="form-actions">

            <button
              type="button"
              className="secondary-btn"
              onClick={() =>
                step === 1
                  ? navigate("/")
                  : setStep((previous) => previous - 1)
              }
            >
              Back
            </button>

            {step < 4 ? (
              <button
                type="button"
                className="primary-btn"
                onClick={nextStep}
              >
                Continue →
              </button>
            ) : (
              <button
                type="submit"
                className="primary-btn"
              >
                Create account
              </button>
            )}

          </div>
        </form>
      </div>
    </div>
  );
}



function Field({
  label,
  name,
  type = "text",
  value = "",
  onChange,
  required = false,
  inputMode,
  readOnly = false,
  placeholder,
  min,
  max,
  maxLength,
  wide = false,
}) {
  return (
    <div className={`field ${wide ? "wide" : ""}`}>
      <label>
        {label}
        {required && " *"}
      </label>

      <input
        name={name}
        type={type}
        value={value ?? ""}
        onChange={(event) =>
          onChange?.(name, event.target.value)
        }
        required={required}
        inputMode={inputMode}
        readOnly={readOnly}
        placeholder={placeholder}
        min={min}
        max={max}
        maxLength={maxLength}
      />
    </div>
  );
}


function SelectField({
  label,
  name,
  value = "",
  onChange,
  options = [],
  required = false,
}) {
  return (
    <div className="field">
      <label>
        {label}
        {required && " *"}
      </label>

      <select
        name={name}
        value={value}
        onChange={(event) =>
          onChange?.(name, event.target.value)
        }
        required={required}
      >
        <option value="">
          Select an option
        </option>

        {options.map((option) => (
          <option
            key={option}
            value={option}
          >
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

function LocationSelect({
  label,
  value,
  items,
  disabled,
  onChange,
  required = false,
}) {
  return (
    <div className="field">
      <label>
        {label}
        {required && " *"}
      </label>

      <select
        value={value || ""}
        onChange={(event) =>
          onChange(event.target.value)
        }
        disabled={disabled}
        required={required}
      >
        <option value="">
          {disabled
            ? `Select ${
                label.toLowerCase()
              } first`
            : `Select ${label.toLowerCase()}`}
        </option>

        {items.map((item) => (
          <option
            key={item.code || item.name}
            value={item.name}
          >
            {item.name}
          </option>
        ))}
      </select>
    </div>
  );
}
