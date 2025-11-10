import { initializeApp, type FirebaseOptions, type FirebaseApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getAnalytics, type Analytics } from 'firebase/analytics'

// Configuración de Firebase para el frontend, usando variables de entorno
const measurementId =
  import.meta.env.VITE_FIREBASE_MEASUREMENT_ID &&
  import.meta.env.VITE_FIREBASE_MEASUREMENT_ID.length > 0
    ? import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
    : undefined

const firebaseConfig: FirebaseOptions = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId,
}

const app: FirebaseApp = initializeApp(firebaseConfig)

// Exporta instancias comunes para reutilizar en la app
export const auth = getAuth(app)

const analytics: Analytics | null =
  typeof window !== 'undefined' && measurementId ? getAnalytics(app) : null

export { app, analytics }

export default app

