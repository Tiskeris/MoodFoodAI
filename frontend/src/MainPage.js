import React, { useState, useEffect } from 'react';
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { auth, storage } from './firebase';

const MainPage = () => {
    const [file, setFile] = useState(null);
    const [photoUrl, setPhotoUrl] = useState('');
    const [error, setError] = useState(''); // Add error state

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (user) {
                try {
                    const idToken = await user.getIdToken();
                    const response = await fetch('http://localhost:8080/auth/photo-url', {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${idToken}`,
                        },
                    });

                    if (!response.ok) {
                        throw new Error('Failed to fetch photo URL');
                    }

                    const url = await response.text();
                    setPhotoUrl(url);
                } catch (error) {
                    console.error('Error fetching photo URL:', error.message);
                }
            } else {
                //console.error("User not authenticated");
            }
        });

        return () => unsubscribe();
    }, []);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
        setError('');
    };

    const handleUpload = async () => {
        if (!file) {
            setError("No file selected");
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
        </div>
    );
};

export default MainPage;