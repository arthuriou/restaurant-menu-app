// Initialisation de Firebase désactivée - Mode Démo
// import { initializeApp, getApps, getApp } from "firebase/app";
// import { getAuth } from "firebase/auth";
// import { getFirestore } from "firebase/firestore";
// import { firebaseConfig } from "@/config/firebase";

// const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
// const auth = getAuth(app);
// const db = getFirestore(app);

// Objets factices pour le développement sans clés
const app = {} as { name?: string; [key: string]: unknown };
const auth = {} as { currentUser: null; [key: string]: unknown };
const db = {} as { app: typeof app; [key: string]: unknown };

export { app, auth, db };
