import { useState } from "react";
import { useAppointments } from "../context/AppointmentContext";
import { useAuth } from "../context/AuthContext";
import CalendarGrid from "../components/CalendarGrid";
import { todayISO } from "../utils";

export default function Appointments() {
  const { appointments, blockedDates, addAppointment, deleteAppointment, toggleBlocked } = useAppointments();
  const { users, user } = useAuth();
  const [date, setDate] = useState("");
  const [form, setForm] = useState({ clientId: "", time: "", title: "" });
  const submit = async (event) => {
    event.preventDefault();
    try {
      const result = await addAppointment({ ...form, date });
      if (result?.error) {
        alert(result.error === "time" ? "That time is already booked." : result.error === "blocked" ? "This date is unavailable." : "You cannot create an appointment for a past date.");
        return;
      }
      setForm({ clientId: "", time: "", title: "" });
      alert("Appointment created.");
    } catch (error) {
      alert(error?.message || "Could not create the appointment.");
    }
  };
  const selected = appointments.filter((item) => item.date === date);
  if (user?.role !== "engineer") return <div className="container page-container"><div className="empty-state">Unauthorized</div></div>;
  return <div className="container page-container"><div className="page-header"><span className="eyebrow">SCHEDULING</span><h1>Appointments</h1><p>Select a date, create a slot, or mark a non-working day unavailable.</p></div><div className="calendar-full card"><CalendarGrid engineer appointments={appointments} blockedDates={blockedDates} onToggleBlocked={toggleBlocked} selectedDate={date} onSelect={setDate} /></div><div className="two-column"><form className="card form-card" onSubmit={submit}><h3>Create appointment</h3><label>Selected date</label><input type="date" min={todayISO()} value={date} onChange={(e) => setDate(e.target.value)} required /><label>Client</label><select value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })} required><option value="">Select client</option>{users.filter((item) => item.role === "client" && item.status !== "inactive").map((item) => <option value={item.id} key={item.id}>{item.name} — {item.association}</option>)}</select><label>Time</label><input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} required /><label>Appointment title</label><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required placeholder="Validation meeting" /><button className="primary-btn full">Create appointment</button></form><section className="card"><h3>{date ? `Appointments on ${date}` : "Select a date"}</h3>{selected.map((item) => <div className="activity-row" key={item.id}><div><strong>{item.title}</strong><span>{item.time} · {users.find((client) => client.id === item.clientId)?.name || "Client"}</span></div><button className="danger-btn small" onClick={() => deleteAppointment(item.id)}>Remove</button></div>)}{date && selected.length === 0 && <p className="muted">No appointments for this date.</p>}</section></div></div>;
}
