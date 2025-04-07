import React, { useState, useEffect } from 'react';
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { auth, storage } from './firebase';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { useNavigate } from 'react-router';
const MainPage = () => {
    const [file, setFile] = useState(null);
    const [photoUrl, setPhotoUrl] = useState('');
    const [error, setError] = useState(''); // Add error state
    const navigate = useNavigate();
    useEffect(() => {
        // Clear photo state when component mounts or remounts
        setPhotoUrl('');
        setFile(null);

        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            console.log("Auth state changed, current user:", user?.uid);

            // Clear photo URL when user changes or signs out
            setPhotoUrl('');

            if (user) {
                try {
                    const idToken = await user.getIdToken(true); // Force token refresh
                    const response = await fetch('http://localhost:8080/auth/photo-url', {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${idToken}`,
                        },
                        // Prevent caching
                        cache: 'no-store'
                    });

                    if (response.status === 404) {
                        // No photo found for this user
                        console.log("No photo found for user");
                        return;
                    }

                    if (!response.ok) {
                        throw new Error('Failed to fetch photo URL');
                    }
                    const url = await response.text();
                    // Add cache busting parameter
                    setPhotoUrl(`${url}&t=${Date.now()}`);
                } catch (error) {
                    console.error('Error fetching photo URL:', error.message);
                }
            }
        });

        return () => unsubscribe();
    }, []);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
        setError('');
    };
    useEffect(() => {
        return () => {
            setPhotoUrl('');
            setFile(null);
        };
    }, []);
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
            return;
        }

        const validTypes = ['image/jpeg', 'image/png'];
        if (!validTypes.includes(file.type)) {
            setError("Invalid file type. Only JPG and PNG are allowed.");
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
            {error && <p style={{color: 'red'}}>{error}</p>}
            {photoUrl && <img src={photoUrl} width="auto" height={200} alt="Uploaded"/>}
        </div>
    );
};

export default MainPage;