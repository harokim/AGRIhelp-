import { createContext, useContext, useEffect, useState } from "react";
import { addDoc, collection, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { db, firebaseConfigured } from "../firebase";
import { useAuth } from "./AuthContext";

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  useEffect(() => {
    if (!firebaseConfigured || !db || !user?.id) { setNotifications([]); return; }
    const q = query(collection(db, "notifications"), where("userId", "==", user.id), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snapshot) => setNotifications(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))), () => setNotifications([]));
  }, [user?.id]);
  const markRead = async (id) => updateDoc(doc(db, "notifications", id), { read: true });
  const createNotification = async (data) => addDoc(collection(db, "notifications"), { ...data, read: false, createdAt: serverTimestamp() });
  const unreadCount = notifications.filter((item) => !item.read).length;
  return <NotificationContext.Provider value={{ notifications, unreadCount, markRead, createNotification }}>{children}</NotificationContext.Provider>;
}

export const useNotifications = () => useContext(NotificationContext);
