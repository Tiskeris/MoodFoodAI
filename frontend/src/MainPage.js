import React, { useState, useEffect } from 'react';
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { auth, storage } from './firebase';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { faceApi, faceSecret } from './firebase';

import { useNavigate } from 'react-router';

const MainPage = () => {
    const [file, setFile] = useState(null);
    const [photoUrl, setPhotoUrl] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const [faceData, setFaceData] = useState(null);

    useEffect(() => {

        setPhotoUrl('');
        setFile(null);

        let unsubscribe = () => {};

        try {
            const authUnsubscribe = auth.onAuthStateChanged(async (user) => {
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

            if (typeof authUnsubscribe === 'function') {
                unsubscribe = authUnsubscribe;
            } else {
                console.error("Auth listener did not return a function");
            }
        } catch (error) {
            console.error("Error setting up auth listener:", error);
        }

        // Return cleanup function
        return () => {
            try {
                if (typeof unsubscribe === 'function') {
                    unsubscribe();
                }
            } catch (error) {
                console.error("Error unsubscribing from auth:", error);
            }
        };
    }, []);

    // Clean up resources when component unmounts
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
            console.error("File size exceeds 5MB");
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
                console.error("No existing file to delete");
            }

            await uploadBytes(fileRef, file);
            const downloadURL = await getDownloadURL(fileRef);
            setPhotoUrl(downloadURL);

            console.log("File uploaded successfully. URL:", downloadURL);
            toast.success("File uploaded successfully!");

            await analyzeImageWithFacePlusPlus(downloadURL);

        } catch (error) {
            console.error("File upload failed: " + error.message);
            toast.error("File upload failed: " + error.message);
        }
    };

    const analyzeImageWithFacePlusPlus = async (imageUrl) => {
        const apiKey = faceApi;
        const apiSecret = faceSecret;
        const apiUrl = 'https://api-us.faceplusplus.com/facepp/v3/detect';

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    api_key: apiKey,
                    api_secret: apiSecret,
                    image_url: imageUrl,
                    return_attributes: 'emotion',
                }),
            });

            if (!response.ok) {
                throw new Error('Face++ API request failed');
            }

            const data = await response.json();
            setFaceData(data);
            console.log('Face++ API response:', data);
        } catch (error) {
            setError('Face++ API error: ' + error.message);
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
            {faceData && (
                <div>
                    <h3>Face++ Analysis Results:</h3>
                    <p>Emotion: {JSON.stringify(faceData.faces[0]?.attributes?.emotion)}</p>
                </div>
            )}
            <ToastContainer />
            <button onClick={handleSignOut}>Sign Out</button>
        </div>
    );
};

export default MainPage;