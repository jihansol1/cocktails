document.addEventListener('DOMContentLoaded', function() {
    checkLoginStatus();
    loadFavorites();

    const modal = document.getElementById('drinkModal');
    const closeBtn = document.querySelector('.close-btn');

    closeBtn.addEventListener('click', () => modal.classList.remove('active'));
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('active');
    });

    document.getElementById('logoutLink').addEventListener('click', logout);
});

function checkLoginStatus() {
    const userId = getCookie('userId');
    if (!userId) {
        window.location.href = 'login.html';
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

async function loadFavorites() {
    const userId = getCookie('userId');
    const container = document.getElementById('favoritesContainer');
    const noFavorites = document.getElementById('noFavorites');
    const countEl = document.getElementById('favoritesCount');

    try {
        const response = await fetch(`favorites?userId=${userId}`);
        const data = await response.json();

        if (data.success && data.favorites.length > 0) {
            countEl.textContent = `${data.favorites.length} cocktail${data.favorites.length > 1 ? 's' : ''} saved`;
            noFavorites.style.display = 'none';

            container.innerHTML = data.favorites.map(drink => `
                <div class="drink-card" data-id="${drink.drinkId}">
                    <img src="${drink.drinkImage}" alt="${drink.drinkName}">
                    <button class="favorite-btn active" onclick="event.stopPropagation(); removeFavorite('${drink.drinkId}')">
                        <i class="fas fa-heart"></i>
                    </button>
                    <div class="drink-card-content">
                        <h3>${drink.drinkName}</h3>
                        <div class="drink-card-meta">
                            <span class="category">${drink.drinkCategory || ''}</span>
                            <span class="alcoholic">${drink.isAlcoholic || ''}</span>
                        </div>
                    </div>
                </div>
            `).join('');

            // Add click listeners
            document.querySelectorAll('.drink-card').forEach(card => {
                card.addEventListener('click', () => openDrinkModal(card.dataset.id));
            });
        } else {
            container.innerHTML = '';
            noFavorites.style.display = 'block';
            countEl.textContent = '0 cocktails saved';
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

async function removeFavorite(drinkId) {
    const userId = getCookie('userId');

    try {
        const response = await fetch(`favorites?userId=${userId}&drinkId=${drinkId}`, {
            method: 'DELETE'
        });
        const data = await response.json();

        if (data.success) {
            loadFavorites(); // Reload the list
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

async function openDrinkModal(drinkId) {
    try {
        const response = await fetch(
            `https://www.thecocktaildb.com/api/json/v1/1/lookup.php?i=${drinkId}`
        );
        const data = await response.json();
        const drink = data.drinks[0];
        const ingredients = getIngredients(drink);

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

                <div class="modal-actions">
                    <button class="favorite-action active" onclick="removeFavoriteFromModal('${drinkId}')">
                        <i class="fas fa-heart-broken"></i> Remove from Favorites
                    </button>
                </div>
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

async function removeFavoriteFromModal(drinkId) {
    const userId = getCookie('userId');

    try {
        const response = await fetch(`favorites?userId=${userId}&drinkId=${drinkId}`, {
            method: 'DELETE'
        });
        const data = await response.json();

        if (data.success) {
            document.getElementById('drinkModal').classList.remove('active');
            loadFavorites();
        }
    } catch (error) {
        console.error('Error:', error);
    }
}