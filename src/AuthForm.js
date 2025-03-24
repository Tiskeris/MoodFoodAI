import React, { useState } from "react";
import Register from "./Register";
import Login from "./Login";
import "./AuthForm.css";

function AuthForm() {
    const [isLogin, setIsLogin] = useState(true);

    const toggleForm = () => {
        setIsLogin(!isLogin);
    };

    return (
        <div className="form-structor">
            <div className={`signup ${isLogin ? "slide-up" : ""}`}>
                <h2 className="form-title" id="signup" onClick={toggleForm}>
                    <span>or</span>Sign up
                </h2>
                <div className="form-holder">
                    {!isLogin && <Register />}
                </div>
            </div>
            <div className={`login ${isLogin ? "" : "slide-up"}`}>
                <div className="center">
                    <h2 className="form-title" id="login" onClick={toggleForm}>
                        <span>or</span>Log in
                    </h2>
                    <div className="form-holder">
                        {isLogin && <Login />}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AuthForm;