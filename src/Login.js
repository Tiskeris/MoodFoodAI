import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase";

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const handleLogin = async () => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            alert("Login successful!");
            navigate("/main");
        } catch (error) {
            alert(error.message);
            alert("Login failed");
        }
    };

    return (
        <div>
            <input type="email" className="input" placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
            <input type="password" className="input" placeholder="Password" onChange={(e) => setPassword(e.target.value)} />
            <button className="submit-btn" onClick={handleLogin}>Login</button>
        </div>
    );
}

export default Login;