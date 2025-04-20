import React, { useState, useEffect } from 'react';
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { auth, storage } from './firebase';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router';

const MainPage = () => {
    const [file, setFile] = useState(null);
    const [photoUrl, setPhotoUrl] = useState('');
    const [error, setError] = useState('');
    const [userInput, setUserInput] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        setPhotoUrl('');
        setFile(null);

        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            console.log("Auth state changed, current user:", user?.uid);
            setPhotoUrl('');

            if (user) {
                try {
                    const idToken = await user.getIdToken(true);
                    const response = await fetch('http://localhost:8080/auth/photo-url', {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${idToken}`,
                        },
                        cache: 'no-store'
                    });

                    if (response.status === 404) {
                        console.log("No photo found for user");
                        return;
                    }

                    if (!response.ok) {
                        throw new Error('Failed to fetch photo URL');
                    }

                    const url = await response.text();
                    setPhotoUrl(`${url}&t=${Date.now()}`);
                } catch (error) {
                    console.error('Error fetching photo URL:', error.message);
                }
            }
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        return () => {
            setPhotoUrl('');
            setFile(null);
        };
    }, []);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
        setError('');
    };

    const handleSignOut = async () => {
        try {
            await auth.signOut();
            setPhotoUrl('');
            navigate('/');
        } catch (error) {
            console.error("Sign out failed:", error);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            console.error("No file selected");
            toast.error("No file selected");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setError("File size exceeds 5MB");
            toast.error("File exceeds 5MB");
            return;
        }

        const validTypes = ['image/jpeg', 'image/png'];
        if (!validTypes.includes(file.type)) {
            setError("Invalid file type. Only JPG and PNG are allowed.");
            toast.error("File type not allowed");
            return;
        }

        try {
            const user = auth.currentUser;
            if (!user) {
                throw new Error("User not authenticated");
            }

            const fileRef = ref(storage, `users/${user.uid}/profile.jpg`);

            try {
                await deleteObject(fileRef);
            } catch (error) {
                console.log("No existing file to delete");
            }

            await uploadBytes(fileRef, file);
            const downloadURL = await getDownloadURL(fileRef);
            setPhotoUrl(downloadURL);

            console.log("File uploaded successfully. URL:", downloadURL);
            toast.success("File uploaded successfully!");

        } catch (error) {
            setError("File upload failed: " + error.message);
            toast.error("File upload failed: " + error.message);
        }
    };

    // 👇 NEW: Handle chat API request
    const handleChatSubmit = async () => {
        if (!userInput.trim()) {
            toast.error("Please enter some text first!");
            return;
        }

        try {
            const response = await fetch("http://localhost:8080/api/chat/response", {
                method: "POST",
                headers: {
                    "Content-Type": "text/plain"
                },
                body: userInput
            });

            if (!response.ok) {
                throw new Error("Failed to get chat response");
            }

            const data = await response.text();
            console.log("AI Response:", data);
            toast.success("Response received — check console!");

        } catch (error) {
            console.error("Error calling chat API:", error);
            toast.error("Failed to get AI response");
        }
    };

    return (
        <div>
            <h2>Upload Photo</h2>
            <label htmlFor="file-upload">
                Upload Photo
                <input
                    id="file-upload"
                    type="file"
                    accept="image/png, image/jpeg"
                    onChange={handleFileChange}
                />
            </label>
            <button onClick={handleUpload}>Upload Photo</button>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {photoUrl && <img src={photoUrl} width="auto" height={200} alt="Uploaded" />}
            <ToastContainer />
            <button onClick={handleSignOut}>Sign Out</button>

            {/* 👇 NEW: Chat Text Field */}
            <div style={{ marginTop: "20px" }}>
                <h3>Ask the AI</h3>
                <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Type your food preferences..."
                    style={{ width: "300px", padding: "8px" }}
                />
                <button onClick={handleChatSubmit} style={{ marginLeft: "10px", padding: "8px" }}>
                    Send
                </button>
            </div>
        </div>
    );
};

export default MainPage;
