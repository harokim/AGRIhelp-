import { createContext, useContext, useEffect, useState } from "react";
import { addDoc, collection, deleteDoc, doc, getDoc, onSnapshot, query, serverTimestamp, setDoc, updateDoc, where } from "firebase/firestore";
import { db, firebaseConfigured } from "../firebase";
import { sendSemaphoreSMS } from "../services/semaphoreService";
import { todayISO } from "../utils";
import { useAuth } from "./AuthContext";

const AppointmentContext = createContext(null);

export function AppointmentProvider({ children }) {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [blockedDates, setBlockedDates] = useState([]);

  useEffect(() => {
    if (!firebaseConfigured || !db || !user?.id) { setAppointments([]); setBlockedDates([]); return; }
    const appointmentQuery = user.role === "engineer" ? collection(db, "appointments") : query(collection(db, "appointments"), where("clientId", "==", user.id));
    const unsubAppointments = onSnapshot(appointmentQuery, (snapshot) => setAppointments(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })).sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))), () => setAppointments([]));
    const unsubBlocked = onSnapshot(collection(db, "blockedDates"), (snapshot) => setBlockedDates(snapshot.docs.map((item) => item.id)), () => setBlockedDates([]));
    return () => { unsubAppointments(); unsubBlocked(); };
  }, [user?.id, user?.role]);

  const addAppointment = async (data) => {
    if (data.date < todayISO()) return { error: "past" };
    if (blockedDates.includes(data.date)) return { error: "blocked" };
    if (appointments.some((item) => item.date === data.date && item.time === data.time && item.status !== "Cancelled")) return { error: "time" };
    const client = await getDoc(doc(db, "users", data.clientId));
    const clientName = client.exists() ? client.data().name : "Client";
    const clientPhone = client.exists() ? client.data().contactNumber : "";
    const result = await addDoc(collection(db, "appointments"), { ...data, clientName, status: "Approved", createdBy: user?.id || "", createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    const message = `Your AGRIhelp appointment is approved for ${data.date} at ${data.time}. ${data.title}`;
    await addDoc(collection(db, "notifications"), { userId: data.clientId, title: "Appointment approved", message, appointmentId: result.id, read: false, createdAt: serverTimestamp() });
    if (clientPhone) {
      try { await sendSemaphoreSMS({ phoneNumber: clientPhone, message: `AGRIhelp: ${message}` }); } catch {}
    }
    return { id: result.id, ...data, status: "Approved" };
  };

  const deleteAppointment = async (id) => deleteDoc(doc(db, "appointments", id));
  const updateAppointment = async (id, patch) => updateDoc(doc(db, "appointments", id), { ...patch, updatedAt: serverTimestamp() });
  const toggleBlocked = async (date) => {
    const ref = doc(db, "blockedDates", date);
    if (blockedDates.includes(date)) await deleteDoc(ref);
    else await setDoc(ref, { date, createdBy: user?.id || "", createdAt: serverTimestamp() });
  };

  return <AppointmentContext.Provider value={{ appointments, blockedDates, addAppointment, deleteAppointment, updateAppointment, toggleBlocked }}>{children}</AppointmentContext.Provider>;
}

export const useAppointments = () => useContext(AppointmentContext);
