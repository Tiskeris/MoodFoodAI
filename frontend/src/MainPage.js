import React, { useState, useEffect } from 'react';
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { auth, storage } from './firebase';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { faceApi, faceSecret } from './firebase';
import { useNavigate } from 'react-router';
import { getDatabase, ref as dbRef, set, get, update } from "firebase/database";

const MainPage = () => {
    const [file, setFile] = useState(null);
    const [photoUrl, setPhotoUrl] = useState('');
    const [error, setError] = useState('');
    const [faceData, setFaceData] = useState(null);
    const [userInput, setUserInput] = useState('');
    const [address, setAddress] = useState('');
    const [savedAddress, setSavedAddress] = useState('');
    const navigate = useNavigate();
    const database = getDatabase();

    useEffect(() => {
        setPhotoUrl('');
        setFile(null);
    }, []);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            console.log("Auth state changed, current user:", user?.uid);
            setPhotoUrl('');
            setSavedAddress('');

            if (user) {
                try {
                    // Fetch photo URL
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
                    } else if (response.ok) {
                        const url = await response.text();
                        setPhotoUrl(`${url}&t=${Date.now()}`);
                    }

                    // Fetch user's address from Firebase
                    const userAddressRef = dbRef(database, `users/${user.uid}/address`);
                    const addressSnapshot = await get(userAddressRef);

                    if (addressSnapshot.exists()) {
                        setSavedAddress(addressSnapshot.val());
                    } else {
                        console.log("No address found for user");
                    }
                } catch (error) {
                    console.error('Error fetching user data:', error.message);
                }
            }
        });

        return () => {
            try {
                if (typeof unsubscribe === 'function') {
                    unsubscribe()
                }
            } catch (error) {
                console.error("Error unsubscribing from auth:", error);
            }
        };
    }, [database]);

    useEffect(() => {
        if (faceData) {
            console.log("Emotion: ", JSON.stringify(faceData.faces[0]?.attributes?.emotion));
        }
    }, [faceData]);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
        setError('');
    };

    const handleSignOut = async () => {
        try {
            await auth.signOut();
            setPhotoUrl('');
            setSavedAddress('');
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

    const handleSaveEmotion = async (emotionData) => {
        try {
            const user = auth.currentUser;
            if (!user) {
                throw new Error("User not authenticated");
            }

            // Find the dominating emotion
            const dominatingEmotion = Object.keys(emotionData).reduce((a, b) =>
                emotionData[a] > emotionData[b] ? a : b
            );

            // Mapping of emotions to suggested places
            const emotionSuggestions = {
                anger: "quiet restaurant,cozy cafe,relaxing dining,tea house,garden restaurant,calm ambiance",
                disgust: "clean restaurant,organic food,vegan restaurant,hygienic cafe,healthy dining,farm-to-table",
                fear: "family friendly restaurant,well-lit cafe,safe environment,familiar chains,casual dining,cozy restaurant",
                happiness: "lively restaurant,rooftop bar,live music restaurant,party vibe cafe,trendy restaurant,open-air dining",
                neutral: "popular restaurants,top rated cafe,all day dining,casual restaurant,bistro,modern eatery",
                sadness: "comfort food,cozy cafe,dessert shop,book cafe,quiet restaurant,home-style meals",
                surprise: "themed restaurant,unusual dining,hidden gem restaurant,concept cafe,fusion food,rooftop dining"
            };

            const suggestedPlaces = emotionSuggestions[dominatingEmotion] || "";

            const userRef = dbRef(database, `users/${user.uid}`);

            await update(userRef, {
                dominatingEmotion,
                suggestedPlaces
            });

            console.log("Dominating emotion and suggestions saved successfully:", dominatingEmotion, suggestedPlaces);
            toast.success("Dominating emotion and suggestions saved successfully!");
        } catch (error) {
            console.error("Failed to save dominating emotion and suggestions:", error);
            toast.error("Failed to save dominating emotion and suggestions: " + error.message);
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

            if (data.faces && data.faces[0]?.attributes?.emotion) {
                await handleSaveEmotion(data.faces[0].attributes.emotion);
                console.log("Emotion data saved successfully!");
            }

        } catch (error) {
            setError('Face++ API error: ' + error.message);
        }
    };

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
            setUserInput('');

            const user = auth.currentUser;

            const userRef = dbRef(database, `users/${user.uid}`);
            await update(userRef, {
                prompt: data + " near " + savedAddress
            });

        } catch (error) {
            console.error("Error calling chat API:", error);
            toast.error("Failed to get AI response");
        }
    };

    const handleAddressSubmit = async () => {
        if (!address.trim()) {
            toast.error("Please enter your address!");
            return;
        }

        try {
            const user = auth.currentUser;
            if (!user) {
                throw new Error("User not authenticated");
            }

            // Save address to Firebase Realtime Database
            const userAddressRef = dbRef(database, `users/${user.uid}/address`);
            await set(userAddressRef, address);

            console.log("Address saved successfully!");
            toast.success("Address saved successfully!");
            setSavedAddress(address);
            setAddress('');

        } catch (error) {
            console.error("Failed to save address:", error);
            toast.error("Failed to save address: " + error.message);
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
            {error && <p style={{color: 'red'}}>{error}</p>}
            {photoUrl && <img src={photoUrl} width="auto" height={200} alt="Uploaded"/>}

            <div style={{marginTop: "20px"}}>
                <h3>Your Address</h3>
                <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter your address"
                    style={{width: "300px", padding: "8px"}}
                />
                <button onClick={handleAddressSubmit} style={{marginLeft: "10px", padding: "8px"}}>
                    Save Address
                </button>
                {savedAddress && (
                    <p>Your saved address: {savedAddress}</p>
                )}
            </div>

            <div style={{marginTop: "20px"}}>
                <h3>Ask the AI</h3>
                <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Type your food preferences..."
                    style={{width: "300px", padding: "8px"}}
                />
                <button onClick={handleChatSubmit} style={{marginLeft: "10px", padding: "8px"}}>
                    Send
                </button>
            </div>

            <ToastContainer/>
            <button onClick={handleSignOut} style={{marginTop: "20px"}}>Sign Out</button>
            <button onClick={() => navigate('/restaurants')} style={{marginTop: "20px"}}>See Restaurants</button>
            <button onClick={() => navigate('/recipes')} style={{marginTop: "20px"}}>See Recipes</button>
        </div>
    );
};

export default MainPage;