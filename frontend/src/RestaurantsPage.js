import React, { useEffect, useState } from 'react';

const RestaurantsPage = () => {
    const [places, setPlaces] = useState([]);

    useEffect(() => {
        const fetchPlaces = async () => {
            try {
                const response = await fetch('http://localhost:8080/places/search?query=sushi restaurant around Gedimino pr. 9 Vilnius&limit=5');
                if (!response.ok) {
                    throw new Error("Failed to fetch places");
                }
                const data = await response.json();
                setPlaces(data);
            } catch (error) {
                console.error("Error fetching places:", error);
            }
        };

        fetchPlaces();
    }, []);

    return (
        <div>
            <h2>Nearby Restaurants</h2>
            {places.map((place, index) => (
                <div key={index} style={{ border: "1px solid #ddd", padding: "10px", margin: "10px 0" }}>
                    <h3>{place.name}</h3>
                    <p>{place.address}</p>
                    {place.photoUrl ? (
                        <img
                            src={place.photoUrl}
                            alt={place.name}
                            width="300"
                        />
                    ) : (
                        <p>No photo available</p>
                    )}
                </div>
            ))}
        </div>
    );
};

export default RestaurantsPage;
