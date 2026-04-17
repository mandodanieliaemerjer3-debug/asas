import admin from "firebase-admin";

let dbAdmin;

if (!admin.apps.length) {
  try {
    const app = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      }),
    });

    dbAdmin = app.firestore();

    console.log("🔥 Firebase Admin inicializado");
  } catch (error) {
    console.error("❌ Erro ao inicializar Firebase Admin:", error);
  }
} else {
  dbAdmin = admin.app().firestore();
}

export { dbAdmin };