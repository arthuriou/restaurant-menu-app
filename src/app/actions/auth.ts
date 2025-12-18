"use server";

import { adminAuth, adminDb } from "@/lib/firebase-admin";

export async function loginWithPinAction(pin: string) {
  try {
    // 1. Verify PIN in Firestore (Admin SDK bypasses rules)
    const snapshot = await adminDb
      .collection("staff")
      .where("pin", "==", pin)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return { success: false, error: "Code PIN invalide" };
    }

    const doc = snapshot.docs[0];
    const staffData = doc.data();

    if (staffData.active === false) {
      return { success: false, error: "Ce compte est désactivé" };
    }

    // 2. Generate Custom Token
    // We use the Firestore Document ID as the Auth UID
    const uid = doc.id;
    
    // Add custom claims (role) for Security Rules
    const additionalClaims = {
      role: staffData.role,
      name: staffData.name
    };

    const token = await adminAuth.createCustomToken(uid, additionalClaims);

    return { success: true, token };
  } catch (error) {
    console.error("Login error:", error);
    return { success: false, error: "Erreur serveur lors de l'authentification" };
  }
}
