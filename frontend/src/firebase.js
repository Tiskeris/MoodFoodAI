import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyBkxaEI46TpWZ7P53nQQARls-NaFcXlPyo",
    authDomain: "moodfoodai-fee4f.firebaseapp.com",
    databaseURL: "https://moodfoodai-fee4f-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "moodfoodai-fee4f",
    storageBucket: "moodfoodai-fee4f.firebasestorage.app",
    messagingSenderId: "259919496469",
    appId: "1:259919496469:web:3ee8c1a018b0d111ccd51c",
    measurementId: "G-F4LKNJNTWB"
};


const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const storage = getStorage(app);

export { auth, storage };