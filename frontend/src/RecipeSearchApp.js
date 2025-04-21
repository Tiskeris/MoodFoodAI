import { useState, useEffect } from 'react';

export default function RecipeSearchApp() {
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [query, setQuery] = useState('Spicy Arrabbiata Pasta');

    useEffect(() => {
        const fetchRecipes = async () => {
            setLoading(true);
            try {
                const response = await fetch(
                    `https://api.edamam.com/api/recipes/v2?type=public&q=${encodeURIComponent(query)}&app_id=e30cf062&app_key=`
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
    }, [query]);

    const handleSearch = (e) => {
        e.preventDefault();
        const newQuery = e.target.search.value;
        if (newQuery.trim()) {
            setQuery(newQuery);
        }
    };

    if (error) {
        return (
            <div className="min-h-screen bg-gray-100 p-8">
                <div className="max-w-6xl mx-auto">
                    <h1 className="text-3xl font-bold text-red-600 mb-6">Error</h1>
                    <p className="text-gray-700">{error}</p>
                    <p className="mt-4">
                        Please check your API key and try again. Note: For this demo to work properly,
                        you need to replace "app_key=x" with your actual Edamam API key.
                    </p>
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

                    <form onSubmit={handleSearch} className="mt-4 flex">
                        <input
                            type="text"
                            name="search"
                            placeholder="Search recipes..."
                            defaultValue={query}
                            className="py-2 px-4 rounded-l w-full md:w-1/2 text-gray-800 focus:outline-none"
                        />
                        <button
                            type="submit"
                            className="bg-yellow-500 hover:bg-yellow-600 py-2 px-6 rounded-r font-semibold transition duration-200"
                        >
                            Search
                        </button>
                    </form>
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
    // Extract health labels to display (showing only up to 3)
    const topLabels = recipe.healthLabels?.slice(0, 3) || [];

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
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                        <div className="flex flex-wrap gap-2">
                            {topLabels.map((label, idx) => (
                                <span
                                    key={idx}
                                    className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded"
                                >
                  {label}
                </span>
                            ))}
                        </div>
                    </div>
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