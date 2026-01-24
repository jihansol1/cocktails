document.addEventListener('DOMContentLoaded', function() {
    checkLoginStatus();
    loadCategories();

    const searchBtn = document.getElementById('searchBtn');
    const randomBtn = document.getElementById('randomBtn');
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const alcoholFilter = document.getElementById('alcoholFilter');
    const modal = document.getElementById('drinkModal');
    const closeBtn = document.querySelector('.close-btn');

    // Event listeners
    searchBtn.addEventListener('click', searchCocktails);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchCocktails();
    });
    randomBtn.addEventListener('click', getRandomCocktail);
    categoryFilter.addEventListener('change', filterByCategory);
    alcoholFilter.addEventListener('change', filterByAlcohol);
    closeBtn.addEventListener('click', () => modal.classList.remove('active'));
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('active');
    });

    // Load some initial drinks
    getRandomCocktails(8);
});

function checkLoginStatus() {
    const userId = getCookie('userId');
    const loginLink = document.getElementById('loginLink');
    const favoritesLink = document.getElementById('favoritesLink');
    const mybarLink = document.getElementById('mybarLink');
    const logoutLink = document.getElementById('logoutLink');

    if (userId) {
        if (loginLink) loginLink.style.display = 'none';
        if (favoritesLink) favoritesLink.style.display = 'inline';
        if (mybarLink) mybarLink.style.display = 'inline';
        if (logoutLink) {
            logoutLink.style.display = 'inline';
            logoutLink.addEventListener('click', logout);
        }
    }
}

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

function logout(e) {
    e.preventDefault();
    document.cookie = 'userId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'username=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    window.location.href = 'index.html';
}

async function loadCategories() {
    try {
        const response = await fetch('https://www.thecocktaildb.com/api/json/v1/1/list.php?c=list');
        const data = await response.json();
        const select = document.getElementById('categoryFilter');

        data.drinks.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.strCategory;
            option.textContent = cat.strCategory;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

async function searchCocktails() {
    const query = document.getElementById('searchInput').value.trim();
    if (!query) return;

    try {
        const response = await fetch(
            `https://www.thecocktaildb.com/api/json/v1/1/search.php?s=${encodeURIComponent(query)}`
        );
        const data = await response.json();
        displayResults(data.drinks);
    } catch (error) {
        console.error('Error:', error);
    }
}

async function getRandomCocktail() {
    try {
        const response = await fetch('https://www.thecocktaildb.com/api/json/v1/1/random.php');
        const data = await response.json();
        displayResults(data.drinks);
    } catch (error) {
        console.error('Error:', error);
    }
}

async function getRandomCocktails(count) {
    try {
        const promises = [];
        for (let i = 0; i < count; i++) {
            promises.push(fetch('https://www.thecocktaildb.com/api/json/v1/1/random.php').then(r => r.json()));
        }
        const results = await Promise.all(promises);
        const drinks = results.map(r => r.drinks[0]);
        displayResults(drinks);
    } catch (error) {
        console.error('Error:', error);
    }
}

async function filterByCategory() {
    const category = document.getElementById('categoryFilter').value;
    if (!category) {
        getRandomCocktails(8);
        return;
    }

    try {
        const response = await fetch(
            `https://www.thecocktaildb.com/api/json/v1/1/filter.php?c=${encodeURIComponent(category)}`
        );
        const data = await response.json();
        displayResults(data.drinks, true);
    } catch (error) {
        console.error('Error:', error);
    }
}

async function filterByAlcohol() {
    const alcohol = document.getElementById('alcoholFilter').value;
    if (!alcohol) {
        getRandomCocktails(8);
        return;
    }

    try {
        const response = await fetch(
            `https://www.thecocktaildb.com/api/json/v1/1/filter.php?a=${encodeURIComponent(alcohol)}`
        );
        const data = await response.json();
        displayResults(data.drinks, true);
    } catch (error) {
        console.error('Error:', error);
    }
}

async function displayResults(drinks, isFiltered = false) {
    const container = document.getElementById('resultsContainer');
    const noResults = document.getElementById('noResults');

    if (!drinks || drinks.length === 0) {
        container.innerHTML = '';
        noResults.style.display = 'block';
        return;
    }

    noResults.style.display = 'none';
    const userId = getCookie('userId');
    let favorites = [];

    if (userId) {
        favorites = await getUserFavorites(userId);
    }

    container.innerHTML = drinks.map(drink => {
        const isFavorite = favorites.includes(drink.idDrink);
        return `
            <div class="drink-card" data-id="${drink.idDrink}">
                <img src="${drink.strDrinkThumb || 'https://via.placeholder.com/300'}" 
                     alt="${drink.strDrink}"
                     onerror="this.src='https://via.placeholder.com/300'">
                ${userId ? `
                    <button class="favorite-btn ${isFavorite ? 'active' : ''}" 
                            onclick="event.stopPropagation(); toggleFavorite('${drink.idDrink}')">
                        <i class="fas fa-heart"></i>
                    </button>
                ` : ''}
                <div class="drink-card-content">
                    <h3>${drink.strDrink}</h3>
                    <div class="drink-card-meta">
                        <span class="category">${drink.strCategory || 'Cocktail'}</span>
                        <span class="alcoholic">${drink.strAlcoholic || ''}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    // Add click listeners for cards
    document.querySelectorAll('.drink-card').forEach(card => {
        card.addEventListener('click', () => openDrinkModal(card.dataset.id));
    });
}

async function getUserFavorites(userId) {
    try {
        const response = await fetch(`favorites?userId=${userId}`);
        const data = await response.json();
        if (data.success) {
            return data.favorites.map(f => f.drinkId);
        }
    } catch (error) {
        console.error('Error fetching favorites:', error);
    }
    return [];
}

async function openDrinkModal(drinkId) {
    try {
        const response = await fetch(
            `https://www.thecocktaildb.com/api/json/v1/1/lookup.php?i=${drinkId}`
        );
        const data = await response.json();
        const drink = data.drinks[0];

        const ingredients = getIngredients(drink);
        const userId = getCookie('userId');
        let isFavorite = false;

        if (userId) {
            const favorites = await getUserFavorites(userId);
            isFavorite = favorites.includes(drinkId);
        }

        const modalBody = document.getElementById('modalBody');
        modalBody.innerHTML = `
            <img src="${drink.strDrinkThumb}" alt="${drink.strDrink}" class="modal-drink-image">
            <div class="modal-drink-details">
                <h2>${drink.strDrink}</h2>
                <div class="meta">
                    <span>${drink.strCategory}</span>
                    <span>${drink.strAlcoholic}</span>
                    <span>${drink.strGlass}</span>
                </div>

                <h3>Ingredients</h3>
                <ul class="ingredients-list">
                    ${ingredients.map(ing => `
                        <li>
                            <span>${ing.ingredient}</span>
                            <span>${ing.measure}</span>
                        </li>
                    `).join('')}
                </ul>

                <h3>Instructions</h3>
                <p class="instructions">${drink.strInstructions}</p>

                ${userId ? `
                    <div class="modal-actions">
                        <button class="favorite-action ${isFavorite ? 'active' : ''}" 
                                onclick="toggleFavoriteFromModal('${drinkId}', this)">
                            <i class="fas fa-heart"></i> 
                            ${isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                        </button>
                    </div>
                ` : `
                    <div class="modal-actions">
                        <a href="login.html" class="favorite-action">
                            <i class="fas fa-sign-in-alt"></i> Login to Save
                        </a>
                    </div>
                `}
            </div>
        `;

        document.getElementById('drinkModal').classList.add('active');
    } catch (error) {
        console.error('Error:', error);
    }
}

function getIngredients(drink) {
    const ingredients = [];
    for (let i = 1; i <= 15; i++) {
        const ingredient = drink[`strIngredient${i}`];
        const measure = drink[`strMeasure${i}`];
        if (ingredient && ingredient.trim()) {
            ingredients.push({
                ingredient: ingredient.trim(),
                measure: measure ? measure.trim() : ''
            });
        }
    }
    return ingredients;
}

function getBaseSpirit(drink) {
    const spirits = ['Vodka', 'Gin', 'Rum', 'Tequila', 'Whiskey', 'Whisky', 'Bourbon', 'Brandy', 'Scotch'];
    for (let i = 1; i <= 15; i++) {
        const ingredient = drink[`strIngredient${i}`];
        if (ingredient) {
            for (const spirit of spirits) {
                if (ingredient.toLowerCase().includes(spirit.toLowerCase())) {
                    return spirit;
                }
            }
        }
    }
    return null;
}

async function toggleFavorite(drinkId) {
    const userId = getCookie('userId');
    if (!userId) {
        window.location.href = 'login.html';
        return;
    }

    const btn = document.querySelector(`.drink-card[data-id="${drinkId}"] .favorite-btn`);
    const isActive = btn.classList.contains('active');

    if (isActive) {
        // Remove from favorites
        try {
            const response = await fetch(`favorites?userId=${userId}&drinkId=${drinkId}`, {
                method: 'DELETE'
            });
            const data = await response.json();
            if (data.success) {
                btn.classList.remove('active');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    } else {
        // Add to favorites - need full drink details
        try {
            const response = await fetch(
                `https://www.thecocktaildb.com/api/json/v1/1/lookup.php?i=${drinkId}`
            );
            const data = await response.json();
            const drink = data.drinks[0];
            const ingredients = getIngredients(drink);

            const addResponse = await fetch('favorites', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: parseInt(userId),
                    drinkId: drink.idDrink,
                    drinkName: drink.strDrink,
                    drinkCategory: drink.strCategory,
                    drinkImage: drink.strDrinkThumb,
                    glassType: drink.strGlass,
                    isAlcoholic: drink.strAlcoholic,
                    ingredientCount: ingredients.length,
                    baseSpirit: getBaseSpirit(drink)
                })
            });

            const addData = await addResponse.json();
            if (addData.success) {
                btn.classList.add('active');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }
}

async function toggleFavoriteFromModal(drinkId, btn) {
    const userId = getCookie('userId');
    if (!userId) return;

    const isActive = btn.classList.contains('active');

    if (isActive) {
        try {
            const response = await fetch(`favorites?userId=${userId}&drinkId=${drinkId}`, {
                method: 'DELETE'
            });
            const data = await response.json();
            if (data.success) {
                btn.classList.remove('active');
                btn.innerHTML = '<i class="fas fa-heart"></i> Add to Favorites';
                // Update card button if visible
                const cardBtn = document.querySelector(`.drink-card[data-id="${drinkId}"] .favorite-btn`);
                if (cardBtn) cardBtn.classList.remove('active');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    } else {
        try {
            const response = await fetch(
                `https://www.thecocktaildb.com/api/json/v1/1/lookup.php?i=${drinkId}`
            );
            const data = await response.json();
            const drink = data.drinks[0];
            const ingredients = getIngredients(drink);

            const addResponse = await fetch('favorites', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: parseInt(userId),
                    drinkId: drink.idDrink,
                    drinkName: drink.strDrink,
                    drinkCategory: drink.strCategory,
                    drinkImage: drink.strDrinkThumb,
                    glassType: drink.strGlass,
                    isAlcoholic: drink.strAlcoholic,
                    ingredientCount: ingredients.length,
                    baseSpirit: getBaseSpirit(drink)
                })
            });

            const addData = await addResponse.json();
            if (addData.success) {
                btn.classList.add('active');
                btn.innerHTML = '<i class="fas fa-heart"></i> Remove from Favorites';
                // Update card button if visible
                const cardBtn = document.querySelector(`.drink-card[data-id="${drinkId}"] .favorite-btn`);
                if (cardBtn) cardBtn.classList.add('active');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }
}