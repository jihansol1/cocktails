document.addEventListener('DOMContentLoaded', function() {
    checkLoginStatus();
    loadMyBarData();

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

async function loadMyBarData() {
    const userId = getCookie('userId');

    try {
        const response = await fetch(`mybar?userId=${userId}`);
        const data = await response.json();

        if (data.success) {
            if (data.stats.totalDrinks === 0) {
                document.getElementById('emptyBar').style.display = 'block';
                document.querySelector('.stats-grid').style.display = 'none';
                document.querySelector('.breakdown-grid').style.display = 'none';
                document.querySelector('.collection-section').style.display = 'none';
                return;
            }

            // Update stats
            document.getElementById('totalDrinks').textContent = data.stats.totalDrinks;
            document.getElementById('alcoholicCount').textContent = data.stats.alcoholicCount;
            document.getElementById('nonAlcoholicCount').textContent = data.stats.nonAlcoholicCount;
            document.getElementById('avgIngredients').textContent = data.stats.avgIngredientCount;

            // Render breakdowns
            renderBreakdown('categoryBreakdown', data.categoryBreakdown, data.stats.totalDrinks);
            renderBreakdown('spiritBreakdown', data.baseSpiritBreakdown, data.stats.totalDrinks);
            renderBreakdown('glassBreakdown', data.glassBreakdown, data.stats.totalDrinks);

            // Render collection
            renderCollection(data.drinks);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

function renderBreakdown(containerId, breakdown, total) {
    const container = document.getElementById(containerId);

    if (!breakdown || Object.keys(breakdown).length === 0) {
        container.innerHTML = '<p style="color: #666;">No data yet</p>';
        return;
    }

    // Sort by count descending
    const sorted = Object.entries(breakdown).sort((a, b) => b[1] - a[1]);

    container.innerHTML = sorted.map(([label, count]) => {
        const percentage = Math.round((count / total) * 100);
        return `
            <div class="breakdown-item">
                <span class="label">${label}</span>
                <span class="value">${count}</span>
            </div>
            <div class="breakdown-bar">
                <div class="breakdown-bar-fill" style="width: ${percentage}%"></div>
            </div>
        `;
    }).join('');
}

function renderCollection(drinks) {
    const container = document.getElementById('collectionList');

    container.innerHTML = drinks.map(drink => `
        <div class="collection-item">
            <img src="${drink.drinkImage}" alt="${drink.drinkName}">
            <div class="collection-item-details">
                <h4>${drink.drinkName}</h4>
                <p>${drink.drinkCategory || 'Cocktail'} • ${drink.ingredientCount} ingredients</p>
            </div>
        </div>
    `).join('');
}