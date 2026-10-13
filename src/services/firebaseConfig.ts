import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

// Firebase 프로젝트 설정 (limbo-cbcc4)
const firebaseConfig = {
  apiKey: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_API_KEY) || "AIzaSyBSBATOxgwq8qh2vUx0OduC-MZlbbQ3J0A",
  authDomain: "limbo-cbcc4.firebaseapp.com",
  databaseURL: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_DATABASE_URL) || "https://limbo-cbcc4-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "limbo-cbcc4",
  storageBucket: "limbo-cbcc4.firebasestorage.app",
  messagingSenderId: "994199040524",
  appId: "1:994199040524:web:bd975d25b265df7ea03429",
  measurementId: "G-J68Z4MNXN1"
};

// 앱 중복 초기화 방지
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);

export const isFirebaseConfigured = true;
