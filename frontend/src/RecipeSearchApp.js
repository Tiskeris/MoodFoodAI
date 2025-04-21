import { useState, useEffect } from 'react';
import { getDatabase, ref as dbRef, get } from "firebase/database";
import { auth } from './firebase';

export default function RecipeSearchApp() {
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [query, setQuery] = useState('');

    useEffect(() => {
        const fetchQueryFromDatabase = async () => {
            try {
                const database = getDatabase();
                const user = auth.currentUser;

                const queryRef = dbRef(database, `users/${user.uid}/foodSuggestions`);
                const querySnapshot = await get(queryRef);

                if (querySnapshot.exists()) {
                    const fetchedQuery = querySnapshot.val();
                    setQuery(fetchedQuery);
                } else {
                    console.log("No query found in the database");
                }
            } catch (err) {
                console.error("Error fetching query from database:", err.message);
                setError(err.message);
            }
        };

        fetchQueryFromDatabase();
    }, []);

    useEffect(() => {
        if (query) {
            const fetchRecipes = async () => {
                setLoading(true);
                try {
                    const response = await fetch(
                        `https://api.edamam.com/api/recipes/v2?type=public&q=${encodeURIComponent(query)}&app_id=e30cf062&app_key=28fc4ae0777544c39422a4ba5ceda8a9`
                    );

                    if (!response.ok) {
                        throw new Error('Failed to fetch recipes');
                    }

                    const data = await response.json();
                    setRecipes(data.hits || []);
                    setLoading(false);
                } catch (err) {
                    setError(err.message);
                    setLoading(false);
                }
            };

            fetchRecipes();
        }
    }, [query]);

    if (error) {
        return (
            <div className="min-h-screen bg-gray-100 p-8">
                <div className="max-w-6xl mx-auto">
                    <h1 className="text-3xl font-bold text-red-600 mb-6">Error</h1>
                    <p className="text-gray-700">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <header className="bg-red-600 text-white py-6 shadow-md">
                <div className="max-w-6xl mx-auto px-4">
                    <h1 className="text-3xl font-bold">Delicious Recipe Finder</h1>
                    <p className="mt-2">Find your next favorite dish</p>
                </div>
            </header>

            <main className="max-w-6xl mx-auto p-4 md:p-8">
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="text-xl text-gray-600">Loading delicious recipes...</div>
                    </div>
                ) : recipes.length > 0 ? (
                    <div>
                        <h2 className="text-2xl font-semibold mb-6">
                            {recipes.length} Recipe{recipes.length !== 1 ? 's' : ''} for "{query}"
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {recipes.map((hit, index) => (
                                <RecipeCard key={index} recipe={hit.recipe} />
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <h2 className="text-2xl font-semibold text-gray-700">No recipes found</h2>
                        <p className="text-gray-600 mt-2">Try another search term</p>
                    </div>
                )}
            </main>

            <footer className="bg-gray-800 text-white py-8 mt-12">
                <div className="max-w-6xl mx-auto px-4 text-center">
                </div>
            </footer>
        </div>
    );
}

function RecipeCard({ recipe }) {
    return (
        <div className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
            {recipe.image && (
                <div className="relative h-48 overflow-hidden">
                    <img
                        src={recipe.image}
                        alt={recipe.label}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            e.target.src = "/api/placeholder/400/320";
                            e.target.alt = "Recipe image placeholder";
                        }}
                    />
                </div>
            )}

            <div className="p-6">
                <h3 className="text-xl font-bold mb-2 text-gray-800">{recipe.label}</h3>

                <div className="flex items-center text-gray-600 mb-4">
                    <span className="mr-4">
                        <span className="font-semibold">{Math.round(recipe.calories || 0)}</span> cal
                    </span>
                    <span>
                        <span className="font-semibold">{recipe.ingredients?.length || 0}</span> ingredients
                    </span>
                </div>

                <div className="flex justify-between items-center mt-6">
                    <div className="text-sm text-gray-500">
                        {recipe.cuisineType?.[0] && (
                            <span className="capitalize">{recipe.cuisineType[0]}</span>
                        )}
                    </div>

                    <a
                        href={recipe.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-medium transition duration-200"
                    >
                        View Recipe
                    </a>
                </div>
            </div>
        </div>
    );
}