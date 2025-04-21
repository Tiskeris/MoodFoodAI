import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from './firebase';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './styles.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const isEmailValid = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const isPasswordValid = (pwd) => {
        const hasMinLength = pwd.length >= 6;
        const hasNumber = /\d/.test(pwd);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(pwd);
        return hasMinLength && hasNumber && hasSpecialChar;
    };

    const handleRegister = async () => {
        if (!email || !password) {
            toast.error('Please enter both email and password.');
            return;
        }

        if (!isEmailValid(email)) {
            toast.error('Please enter a valid email address.');
            return;
        }

        if (!isPasswordValid(password)) {
            toast.error('Password must be at least 6 characters long, include a number and a special character.');
            return;
        }

        try {
            if (auth.currentUser) {
                await auth.signOut();
            }

            const response = await fetch('http://localhost:8080/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                throw new Error('We couldn’t complete your registration. Please try again later.');
            }

            const uid = await response.text();
            console.log('Register Success - User UID:', uid);

            await signInWithEmailAndPassword(auth, email, password);

            toast.success('Registration successful! You are now logged in.');
            navigate('/main');
        } catch (error) {
            console.error('Register Error:', error.message);
            toast.error(error.message || 'Something went wrong while registering. Please try again.');
        }
    };

    const handleLogin = async () => {
        if (!email || !password) {
            toast.error('Please enter both email and password.');
            return;
        }

        if (!isEmailValid(email)) {
            toast.error('Please enter a valid email address.');
            return;
        }

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const idToken = await userCredential.user.getIdToken();

            const response = await fetch("http://localhost:8080/auth/login", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${idToken}`,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error('Login failed. Please check your email and password and try again.');
            }

            const data = await response.text();
            console.log("Login Success:\n", data);

            toast.success('Login successful! Redirecting...');
            navigate('/main');
        } catch (error) {
            console.error("Login failed:", error.message);
            toast.error(error.message || 'Unable to log in. Please check your details and try again.');
        }
    };

    return (
        <div>
            <ToastContainer />
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
