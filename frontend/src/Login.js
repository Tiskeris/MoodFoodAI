import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from './firebase';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleRegister = async () => {
        try {
            const response = await fetch('http://localhost:8080/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                throw new Error(`Register Error: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('Register Success:', data);
        } catch (error) {
            console.error('Register Error:', error.message);
        }
    };

    const handleLogin = async () => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const idToken = await userCredential.user.getIdToken(); // Get Firebase token

            // Send token to Spring Boot
            const response = await fetch("http://localhost:8080/auth/login", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${idToken}`,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error(`Login Error: ${response.statusText}`);
            }

            const data = await response.text();
            console.log("Login Success:\n", data);

            // Redirectinam i maina cia
            navigate('/main');
        } catch (error) {
            console.error("Login failed:", error.message);
        }
    };

    return (
        <div>
            <h2>Login/Register</h2>
            <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />
            <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
            <button onClick={handleRegister}>Register</button>
            <button onClick={handleLogin}>Login</button>
        </div>
    );
};

export default Login;