    const API_BASE = window.API_BASE_URL || '/api';
    let placesData = [];

    let currentFilter = 'all';
    let currentSearch = '';
    let currentSort = 'default';
    let showOnlyFavorites = false;
    let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    let recentViews = JSON.parse(localStorage.getItem('recentViews')) || [];
    let map;
    let markers = [];

    const container = document.getElementById('placesContainer');
    const searchInput = document.getElementById('searchInput');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const sortSelect = document.getElementById('sortSelect');
    const favoritesFilterBtn = document.getElementById('favoritesFilterBtn');
    const themeToggle = document.getElementById('themeToggleBtn');
    const resultsCounterSpan = document.getElementById('resultsCounter');
    const scrollBtn = document.getElementById('scrollTopBtn');
    const recentGrid = document.getElementById('recentGrid');
    const recentSection = document.getElementById('recentSection');

    function getPhotoUrl(place) { 
        return place.photoUrl || ''; 
    }

    async function loadPlaces() {
        container.innerHTML = `<div class="no-results"><i class="fas fa-spinner fa-spin"></i><h3>Загрузка мест...</h3></div>`;
        const response = await fetch(`${API_BASE}/places?limit=100`);
        const result = await response.json();
        if (!response.ok || !result.success) {
            throw new Error(result.message || 'Не удалось загрузить данные');
        }
        placesData = result.data;
    }

    function showLoadError(message) {
        container.innerHTML = `<div class="no-results"><i class="fas fa-exclamation-triangle"></i><h3>Ошибка загрузки</h3><p>${escapeHtml(message)}</p><p>Проверьте подключение к API и базе данных на сервере.</p></div>`;
        resultsCounterSpan.innerText = 'Найдено мест: 0';
    }

    function showToast(message, isAdd = true) {
        const toast = document.getElementById('toastNotification');
        const toastIcon = document.getElementById('toastIcon');
        const toastMessage = document.getElementById('toastMessage');
        toastIcon.className = isAdd ? 'fas fa-heart' : 'fas fa-heart-broken';
        toastMessage.textContent = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2000);
    }

    function addToRecentViews(placeId) {
        recentViews = recentViews.filter(id => id !== placeId);
        recentViews.unshift(placeId);
        if (recentViews.length > 5) recentViews.pop();
        localStorage.setItem('recentViews', JSON.stringify(recentViews));
        renderRecentViews();
    }

    function renderRecentViews() {
        if (recentViews.length === 0) {
            recentSection.style.display = 'none';
            return;
        }
        recentSection.style.display = 'block';
        const recentPlaces = recentViews.map(id => placesData.find(p => p.id === id)).filter(p => p);
        recentGrid.innerHTML = recentPlaces.map(place => `
            <div class="recent-item" data-id="${place.id}">
                <div class="recent-img" style="background-image: url('${getPhotoUrl(place)}'); background-size: cover; background-position: center;"></div>
                <div class="recent-name">${escapeHtml(place.name)}</div>
            </div>
        `).join('');
        document.querySelectorAll('.recent-item').forEach(item => {
            item.addEventListener('click', () => {
                const id = parseInt(item.getAttribute('data-id'));
                openModalById(id);
            });
        });
    }

    function saveFavorites() { localStorage.setItem('favorites', JSON.stringify(favorites)); }

    function toggleFavorite(id, event) {
        event.stopPropagation();
        if (favorites.includes(id)) {
            favorites = favorites.filter(fid => fid !== id);
            showToast(`🗑️ Удалено из избранного`, false);
        } else {
            favorites.push(id);
            showToast(`❤️ Добавлено в избранное!`, true);
        }
        saveFavorites();
        renderCards();
    }

    function getFilteredAndSorted() {
        let filtered = placesData.filter(place => {
            if (currentFilter !== 'all' && place.category !== currentFilter) return false;
            if (showOnlyFavorites && !favorites.includes(place.id)) return false;
            const term = currentSearch.toLowerCase().trim();
            if (term) {
                return place.name.toLowerCase().includes(term) || place.shortDesc.toLowerCase().includes(term);
            }
            return true;
        });
        if (currentSort === 'name') filtered.sort((a,b) => a.name.localeCompare(b.name));
        else if (currentSort === 'nameDesc') filtered.sort((a,b) => b.name.localeCompare(a.name));
        return filtered;
    }

    function getColorForCategory(cat) {
        const colors = { museum:'#9b59b6', attraction:'#e67e22', park:'#2ecc71', monument:'#3498db' };
        return colors[cat] || '#95a5a6';
    }
    
    function getIconForCategory(cat) {
        const icons = { museum:'fa-landmark', attraction:'fa-church', park:'fa-tree', monument:'fa-water' };
        return icons[cat] || 'fa-location-dot';
    }

    function updateMarkers() {
        if (!map) return;
        markers.forEach(m => map.removeLayer(m));
        markers = [];
        const filtered = getFilteredAndSorted();
        
        filtered.forEach(place => {
            const icon = L.divIcon({
                className: 'custom-marker',
                html: `<div style="background-color: ${getColorForCategory(place.category)}; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"><i class="fas ${getIconForCategory(place.category)}" style="font-size: 14px; color:white;"></i></div>`,
                iconSize: [32,32],
                popupAnchor: [0,-12]
            });
            const marker = L.marker([place.lat, place.lng], { icon }).addTo(map);
            marker.bindPopup(`
                <div style="max-width: 260px; min-width: 220px;">
                    <img src="${getPhotoUrl(place)}" style="width: 100%; border-radius: 12px; margin-bottom: 8px; max-height: 150px; object-fit: cover;">
                    <div style="font-weight: bold; font-size: 16px; margin-bottom: 5px;">${place.name}</div>
                    <p style="margin: 5px 0; font-size: 13px;">${place.shortDesc}</p>
                    <p style="margin: 3px 0; font-size: 12px;"><strong>📍 Адрес:</strong> ${place.address}</p>
                    <p style="margin: 3px 0; font-size: 12px;"><strong>🚇 Метро:</strong> ${place.metro}</p>
                    <button onclick="window.openModalById(${place.id})" style="background:#1c4e6f; color:white; border:none; padding:8px 16px; border-radius:24px; margin-top:10px; width:100%; cursor:pointer; font-weight:500;">Подробнее →</button>
                </div>
            `, { maxWidth: 300 });
            marker.on('click', () => openModalById(place.id));
            markers.push(marker);
        });
    }

    function renderCards() {
        const filtered = getFilteredAndSorted();
        resultsCounterSpan.innerText = `Найдено мест: ${filtered.length}`;
        if (filtered.length === 0) {
            container.innerHTML = `<div class="no-results"><i class="fas fa-heart-broken"></i><h3>Ничего не найдено</h3><p>Попробуйте изменить фильтр или поиск</p></div>`;
            updateMarkers();
            return;
        }
        container.innerHTML = filtered.map(place => {
            const isFav = favorites.includes(place.id);
            const catName = { museum:'Музей', attraction:'Достопримечательность', park:'Парк', monument:'Памятник' }[place.category];
            const photoUrl = getPhotoUrl(place);
            const iconClass = getIconForCategory(place.category);
            return `
                <div class="place-card" data-id="${place.id}">
                    <div class="favorite-star" data-id="${place.id}">
                        <i class="fa-${isFav ? 'solid' : 'regular'} fa-heart" style="color: #ffc107;"></i>
                    </div>
                    <div class="card-img-mini" style="background-image: url('${photoUrl}'); background-size: cover; background-position: center;"></div>
                    <div class="card-content-mini">
                        <div class="place-name-mini">${escapeHtml(place.name)}</div>
                        <div class="place-cat-badge"><i class="fas ${iconClass}"></i> ${catName}</div>
                        <div class="place-desc-mini">${escapeHtml(place.shortDesc)}</div>
                        <div style="font-size:0.7rem; margin-top:4px;"><i class="fas fa-subway"></i> ${escapeHtml(place.metro)}</div>
                    </div>
                </div>
            `;
        }).join('');
        
        document.querySelectorAll('.favorite-star').forEach(star => {
            star.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(star.getAttribute('data-id'));
                toggleFavorite(id, e);
            });
        });
        document.querySelectorAll('.place-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.closest('.favorite-star')) return;
                const id = parseInt(card.getAttribute('data-id'));
                openModalById(id);
            });
        });
        updateMarkers();
    }

    let currentSharePlace = null;
    
    function openModalById(id) {
        const place = placesData.find(p => p.id === id);
        if (!place) return;
        currentSharePlace = place;
        addToRecentViews(id);
        
        const photoUrl = getPhotoUrl(place);
        document.getElementById('modalImg').style.backgroundImage = `url('${photoUrl}')`;
        document.getElementById('modalImg').style.backgroundSize = 'cover';
        document.getElementById('modalImg').style.backgroundPosition = 'center';
        document.getElementById('modalImg').innerHTML = '';
        document.getElementById('modalTitle').innerText = place.name;
        const catRu = { museum:'🏛️ Музей', attraction:'⛪ Достопримечательность', park:'🌳 Парк', monument:'🌉 Мост/Памятник' }[place.category];
        document.getElementById('modalCategoryBadge').innerHTML = catRu;
        document.getElementById('modalDesc').innerHTML = place.fullDesc;
        document.getElementById('modalMeta').innerHTML = `
            <div><i class="fas fa-location-dot"></i> <strong>Адрес:</strong> ${escapeHtml(place.address)}</div>
            <div><i class="fas fa-subway"></i> <strong>Метро:</strong> ${escapeHtml(place.metro)}</div>
            <div><i class="fas fa-clock"></i> <strong>Часы работы:</strong> ${escapeHtml(place.hours)}</div>
        `;
        document.getElementById('detailModal').classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    window.openModalById = openModalById;

    async function shareCurrentPlace() {
        if (!currentSharePlace) return;
        const shareText = `${currentSharePlace.name} — ${currentSharePlace.shortDesc}\n📍 Адрес: ${currentSharePlace.address}\n🚇 Метро: ${currentSharePlace.metro}\n\nПутеводитель по Петербургу: ${window.location.href}`;
        if (navigator.share) {
            try { await navigator.share({ title: currentSharePlace.name, text: currentSharePlace.shortDesc, url: window.location.href }); } catch(e) {}
        } else {
            try { await navigator.clipboard.writeText(shareText); showToast(`📋 Ссылка на "${currentSharePlace.name}" скопирована!`, true); } catch(err) { alert('Не удалось скопировать ссылку'); }
        }
    }

    function closeModal() {
        document.getElementById('detailModal').classList.remove('active');
        document.body.style.overflow = '';
        currentSharePlace = null;
    }

    function escapeHtml(str) { return str?.replace(/[&<>]/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' }[m])) || ''; }

    async function fetchWeather() {
        try {
            const res = await fetch('https://wttr.in/Saint+Petersburg?format=%t+%c&lang=ru');
            const data = await res.text();
            document.getElementById('weatherText').innerHTML = `СПб: ${data.trim()}`;
        } catch(e) { document.getElementById('weatherText').innerHTML = '🌤️ +18°C'; }
    }

    function initTheme() { if (localStorage.getItem('theme') === 'dark') document.body.classList.add('dark'); }
    function toggleTheme() { document.body.classList.toggle('dark'); localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light'); }

    window.addEventListener('scroll', () => { if (window.scrollY > 300) scrollBtn.classList.add('show'); else scrollBtn.classList.remove('show'); });
    scrollBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

    function initMap() {
        map = L.map('cityMap').setView([59.9343, 30.3351], 13);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            subdomains: 'abcd'
        }).addTo(map);
        renderCards();
        renderRecentViews();
    }

    async function init() {
        initTheme();
        fetchWeather();
        setInterval(fetchWeather, 600000);
        try {
            await loadPlaces();
            initMap();
        } catch (error) {
            console.error('Load places error:', error);
            showLoadError(error.message);
        }
    }
    
    filterBtns.forEach(btn => btn.addEventListener('click', () => { currentFilter = btn.dataset.filter; filterBtns.forEach(b => b.classList.remove('active')); btn.classList.add('active'); renderCards(); }));
    sortSelect.addEventListener('change', (e) => { currentSort = e.target.value; renderCards(); });
    searchInput.addEventListener('input', (e) => { currentSearch = e.target.value; renderCards(); });
    favoritesFilterBtn.addEventListener('click', () => { showOnlyFavorites = !showOnlyFavorites; showOnlyFavorites ? favoritesFilterBtn.classList.add('active') : favoritesFilterBtn.classList.remove('active'); renderCards(); });
    themeToggle.addEventListener('click', toggleTheme);
    document.getElementById('closeModalBtn').addEventListener('click', closeModal);
    document.getElementById('shareModalBtn').addEventListener('click', shareCurrentPlace);
    document.getElementById('detailModal').addEventListener('click', (e) => { if(e.target === document.getElementById('detailModal')) closeModal(); });
    document.addEventListener('keydown', (e) => { if(e.key === 'Escape') closeModal(); });

    init();