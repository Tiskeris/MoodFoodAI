import React, { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const db = getFirestore();

function Register() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleRegister = async () => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            await setDoc(doc(db, "users", user.uid), {
                email: user.email,
                uid: user.uid
            });
            alert("Registration successful!");
        } catch (error) {
            alert(`Registration failed: ${error.message}`);
        }
    };

    return (
        <div>
            <input type="email" className="input" placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
            <input type="password" className="input" placeholder="Password" onChange={(e) => setPassword(e.target.value)} />
            <button className="submit-btn" onClick={handleRegister}>Register</button>
        </div>
    );
}

export default Register;