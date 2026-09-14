import { createContext, useContext, useEffect, useState } from "react";
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut, updateProfile as updateAuthProfile } from "firebase/auth";
import { collection, doc, getDoc, onSnapshot, query, serverTimestamp, setDoc, updateDoc, where } from "firebase/firestore";
import { auth, db, firebaseConfigured } from "../firebase";

const AuthContext = createContext(null);

function mapUser(snapshot) {
  return { id: snapshot.id, ...snapshot.data() };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firebaseConfigured || !auth || !db) {
      setUser(null);
      setLoading(false);
      return undefined;
    }

    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }
      try {
        const snapshot = await getDoc(doc(db, "users", firebaseUser.uid));
        const profile = snapshot.exists() ? mapUser(snapshot) : { id: firebaseUser.uid, email: firebaseUser.email, name: firebaseUser.displayName || "User", role: "client", status: "active" };
        if (profile.status === "inactive") {
          await signOut(auth);
          setUser(null);
        } else {
          setUser(profile);
        }
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    });
  }, []);

  useEffect(() => {
    if (!firebaseConfigured || !db || !user?.id) {
      setUsers([]);
      return;
    }
    const usersRef = collection(db, "users");
    const userQuery = user.role === "engineer" ? usersRef : query(usersRef, where("role", "==", "engineer"));
    return onSnapshot(userQuery, (snapshot) => setUsers(snapshot.docs.map(mapUser)), () => setUsers([]));
  }, [user?.id, user?.role]);

  const login = async (email, password) => {
    if (!firebaseConfigured || !auth || !db) throw new Error("Firebase is not configured yet. Create a .env file from .env.example and add your Firebase Web App settings.");
    const credential = await signInWithEmailAndPassword(auth, String(email).trim().toLowerCase(), password);
    const snapshot = await getDoc(doc(db, "users", credential.user.uid));
    if (!snapshot.exists()) {
      await signOut(auth);
      throw new Error("Your account profile has not been created.");
    }
    const profile = mapUser(snapshot);
    if (profile.status === "inactive") {
      await signOut(auth);
      throw new Error("This account is inactive.");
    }
    setUser(profile);
    return profile;
  };

  const register = async (data, role) => {
    if (!firebaseConfigured || !auth || !db) throw new Error("Firebase is not configured yet. Create a .env file from .env.example and add your Firebase Web App settings.");
    const email = String(data.email || "").trim().toLowerCase();
    const credential = await createUserWithEmailAndPassword(auth, email, data.password);
    const profile = {
      name: data.name || "",
      email,
      role,
      contactNumber: data.contactNumber || "",
      association: data.association || "",
      address: data.address || data.officeAddress || "",
      officeAddress: data.officeAddress || "",
      barangay: data.barangay || "",
      municipality: data.municipality || "",
      province: data.province || "",
      region: data.region || "",
      position: data.position || "",
      profileBio: data.profileBio || "",
      status: "active",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    try {
      await setDoc(doc(db, "users", credential.user.uid), profile);
      await updateAuthProfile(credential.user, { displayName: profile.name });
      await signOut(auth);
      return { id: credential.user.uid, ...profile };
    } catch (error) {
      await signOut(auth);
      throw error;
    }
  };

  const registerClient = (data) => register(data, "client");
  const registerEngineer = (data) => register(data, "engineer");

  const updateProfile = async (id, patch) => {
    if (!firebaseConfigured || !db) throw new Error("Firebase is not configured yet.");
    await updateDoc(doc(db, "users", id), { ...patch, updatedAt: serverTimestamp() });
    if (id === user?.id) setUser((current) => ({ ...current, ...patch }));
  };

  const deleteUser = async (id) => {
    if (!firebaseConfigured || !db || !auth) throw new Error("Firebase is not configured yet.");
    if (id === auth.currentUser?.uid) return;
    await updateDoc(doc(db, "users", id), { status: "inactive", updatedAt: serverTimestamp() });
  };

  const logout = () => auth ? signOut(auth) : Promise.resolve();

  return <AuthContext.Provider value={{ user, users, loading, login, logout, registerClient, registerEngineer, updateProfile, deleteUser }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
