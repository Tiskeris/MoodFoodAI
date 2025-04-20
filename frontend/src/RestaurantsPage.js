import React, { useEffect, useState } from 'react';
import { auth } from './firebase';
import { getDatabase, ref, get } from 'firebase/database';

const RestaurantsPage = () => {
    const [places, setPlaces] = useState([]);
    const [imageLoadAttempts, setImageLoadAttempts] = useState({}); // Track retry attempts

    useEffect(() => {
        const fetchPromptAndPlaces = async () => {
            try {
                const user = auth.currentUser;
                if (!user) {
                    throw new Error("User not authenticated");
                }

                // Fetch the prompt from the database
                const database = getDatabase();
                const userRef = ref(database, `users/${user.uid}/prompt`);
                const snapshot = await get(userRef);

                if (snapshot.exists()) {
                    const prompt = snapshot.val();

                    // Fetch places using the prompt
                    const response = await fetch(`http://localhost:8080/places/search?query=${prompt}`);
                    if (!response.ok) {
                        throw new Error("Failed to fetch places");
                    }
                    const data = await response.json();
                    setPlaces(data);
                } else {
                    console.error("No prompt found in the database");
                }
            } catch (error) {
                console.error("Error fetching prompt or places:", error);
            }
        };

        fetchPromptAndPlaces();
    }, []);

    // Retry loading failed images (max 3 attempts)
    const handleImageError = (placeId, photoUrl, attempt = 1) => {
        if (attempt <= 3) {
            console.log(`Retrying image load for place ${placeId} (attempt ${attempt})`);
            setTimeout(() => {
                setImageLoadAttempts(prev => ({
                    ...prev,
                    [placeId]: attempt + 1,
                }));
            }, 1000 * attempt);
        } else {
            console.warn(`Max retries reached for place ${placeId}`);
        }
    };

    return (
        <div>
            <h2>Nearby Restaurants</h2>
            {places.map((place) => (
                <div key={place.id} style={{ border: "1px solid #ddd", padding: "10px", margin: "10px 0" }}>
                    <h3>{place.name}</h3>
                    <p>{place.address}</p>
                    {place.photoUrl ? (
                        <img
                            src={place.photoUrl}
                            alt={place.name}
                            width="300"
                            onError={() => handleImageError(place.id, place.photoUrl, imageLoadAttempts[place.id] || 1)}
                            // Hide image if all retries fail
                            style={{ display: imageLoadAttempts[place.id] > 3 ? 'none' : 'block' }}
                        />
                    ) : (
                        <p>No photo available</p>
                    )}
                    {imageLoadAttempts[place.id] > 3 && (
                        <p style={{ color: 'red' }}>Failed to load photo after 3 attempts.</p>
                    )}
                </div>
            ))}
        </div>
    );
};

export default RestaurantsPage;