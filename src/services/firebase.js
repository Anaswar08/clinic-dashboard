// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getFunctions, httpsCallable } from 'firebase/functions';


const firebaseConfig = {
  apiKey: "AIzaSyBI999o0pBQID13sV0PqNlgPFyR3DDmKIU",
  authDomain: "clinicconnect-24750.firebaseapp.com",
  projectId: "clinicconnect-24750",
  storageBucket: "clinicconnect-24750.firebasestorage.app",
  messagingSenderId: "1087665195305",
  appId: "1:1087665195305:web:9ea021bd9036cd29554f38"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);