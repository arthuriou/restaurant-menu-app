import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, memoryLocalCache } from "firebase/firestore";
import { firebaseConfig } from "@/config/firebase";

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

// Use memory-only cache to avoid IndexedDB corruption issues
const db = initializeFirestore(app, {
  localCache: memoryLocalCache()
});

export { app, auth, db };
