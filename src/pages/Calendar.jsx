import { useState } from "react";
import { useAppointments } from "../context/AppointmentContext";
import { useAuth } from "../context/AuthContext";
import CalendarGrid from "../components/CalendarGrid";

export default function Calendar() {
  const { appointments, blockedDates } = useAppointments();
  const { users } = useAuth();

  const [search, setSearch] = useState("");
  const [date, setDate] = useState("");

  const filtered = appointments.filter((appointment) => {
    const client = users.find(
      (user) => user.id === appointment.clientId
    );

    const searchText = `
      ${appointment.title || ""}
      ${client?.name || ""}
      ${client?.association || ""}
    `.toLowerCase();

    return (
      searchText.includes(search.toLowerCase()) &&
      (date ? appointment.date === date : true)
    );
  });

  const selectedDateUnavailable =
    date && blockedDates.includes(date);

  return (
    <div className="container page-container calendar-screen">
      <div className="page-header">
        <span className="eyebrow">SCHEDULE</span>

        <h1>Calendar</h1>

        <p>
          View appointments in a full calendar layout and search
          the request and client schedule.
        </p>
      </div>

      <div className="calendar-status-legend">
        <div>
          <span className="calendar-legend-dot available"></span>
          <span>Available</span>
        </div>

        <div>
          <span className="calendar-legend-dot unavailable"></span>
          <span>Unavailable</span>
        </div>

        <div>
          <span className="calendar-legend-dot appointment"></span>
          <span>Appointment</span>
        </div>
      </div>

      <CalendarGrid
        appointments={appointments}
        blockedDates={blockedDates}
        selectedDate={date}
        onSelect={setDate}
      />

      {selectedDateUnavailable && (
        <div className="calendar-unavailable-notice">
          <strong>Unavailable date</strong>
          <span>
            The selected date is currently unavailable for
            appointments.
          </span>
        </div>
      )}

      <div className="calendar-search">
        <input
          className="search-input"
          placeholder="Search appointments, association, or client..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        {date && (
          <button
            type="button"
            className="secondary-btn"
            onClick={() => setDate("")}
          >
            Show all dates
          </button>
        )}
      </div>

      <div className="request-list calendar-results">
        {filtered.map((appointment) => {
          const client = users.find(
            (user) => user.id === appointment.clientId
          );

          return (
            <div
              className="card activity-row"
              key={appointment.id}
            >
              <div>
                <strong>{appointment.title}</strong>

                <span>
                  {appointment.date} · {appointment.time} ·{" "}
                  {client?.name || "Client"}
                </span>
              </div>

              <span className="tag">
                {client?.association || ""}
              </span>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="empty-state">
            <strong>No matching appointments.</strong>

            <span>
              Try another search or select a different date.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}