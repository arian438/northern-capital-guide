const placesData = [
        { id:1, name:"Государственный Эрмитаж", category:"museum", shortDesc:"Шедевры мирового искусства.", fullDesc:"Зимний дворец, более 3 млн экспонатов, Павильонный зал. Один из величайших музеев мира.", address:"Дворцовая пл., 2", metro:"Адмиралтейская", hours:"Вт–Вс 10:30–18:00, чт до 21:00", lat:59.9399, lng:30.3146, 
          photoUrl:"https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Winter_Palace_Panorama_4.jpg/330px-Winter_Palace_Panorama_4.jpg" },
        { id:2, name:"Петропавловская крепость", category:"attraction", shortDesc:"Историческое ядро города.", fullDesc:"Петропавловский собор, тюрьма Трубецкого бастиона, место основания Петербурга.", address:"Заячий остров, 6", metro:"Горьковская", hours:"10:00–20:00", lat:59.9500, lng:30.3167,
          photoUrl:"https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/RUS-2016-Aerial-SPB-Peter_and_Paul_Fortress_02.jpg/330px-RUS-2016-Aerial-SPB-Peter_and_Paul_Fortress_02.jpg" },
        { id:3, name:"Исаакиевский собор", category:"attraction", shortDesc:"Величественный собор.", fullDesc:"Колоннада с панорамой города, уникальные мозаики и малахитовые колонны.", address:"Исаакиевская пл., 4", metro:"Адмиралтейская", hours:"10:00–18:00, ср выходной", lat:59.9340, lng:30.3065,
          photoUrl:"https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Saint_Isaac%27s_Cathedral_in_SPB.jpeg/330px-Saint_Isaac%27s_Cathedral_in_SPB.jpeg" },
        { id:4, name:"Русский музей", category:"museum", shortDesc:"Коллекция русского искусства.", fullDesc:"Михайловский дворец, картины Брюллова, Айвазовского, Репина.", address:"ул. Инженерная, 4", metro:"Невский проспект", hours:"10:00–18:00, чт до 20:00", lat:59.9387, lng:30.3325,
          photoUrl:"https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Spb_06-2012_MichaelPalace.jpg/330px-Spb_06-2012_MichaelPalace.jpg" },
        { id:5, name:"Летний сад", category:"park", shortDesc:"Старейший парк.", fullDesc:"Фонтаны, мраморные статуи, Летний дворец Петра I.", address:"наб. Кутузова, 2", metro:"Гостиный двор", hours:"10:00–20:00", lat:59.9451, lng:30.3355,
          photoUrl:"https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Вход_в_Летний_сад.jpg/330px-Вход_в_Летний_сад.jpg" },
        { id:6, name:"Дворцовый мост", category:"monument", shortDesc:"Разводной мост через Неву.", fullDesc:"Символ белых ночей, развод под музыку, лучший вид на Эрмитаж.", address:"Дворцовый пр.", metro:"Адмиралтейская", hours:"круглосуточно", lat:59.9412, lng:30.3081,
          photoUrl:"https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/Palace_Bridge_SPB_%28img2%29.jpg/330px-Palace_Bridge_SPB_%28img2%29.jpg" },
        { id:7, name:"Новая Голландия", category:"park", shortDesc:"Остров-парк", fullDesc:"Кирпичная арка, пруд, рестораны, культурное пространство.", address:"наб. Адмиралтейского канала, 2", metro:"Садовая", hours:"09:00–23:00", lat:59.9284, lng:30.2930,
          photoUrl:"https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Spb_06-2017_img33_New_Holland.jpg/330px-Spb_06-2017_img33_New_Holland.jpg" },
        { id:8, name:"Кунсткамера", category:"museum", shortDesc:"Первый музей России.", fullDesc:"Антропология, этнография, коллекция, основана Петром I.", address:"Университетская наб., 3", metro:"Адмиралтейская", hours:"Вт–Вс 10:00–18:00", lat:59.9419, lng:30.3047,
          photoUrl:"https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Saint_Petersburg_Kunstkamera_from_Neva.jpg/330px-Saint_Petersburg_Kunstkamera_from_Neva.jpg" },
        { id:9, name:"Спас на Крови", category:"attraction", shortDesc:"Храм-памятник.", fullDesc:"Уникальная мозаика (более 7000 кв. м), русское узорочье.", address:"наб. канала Грибоедова, 2Б", metro:"Невский проспект", hours:"10:30–18:00, ср выходной", lat:59.9406, lng:30.3290,
          photoUrl:"https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Собор_Воскресения_Христова_1.jpg/330px-Собор_Воскресения_Христова_1.jpg" },
        { id:10, name:"Поцелуев мост", category:"monument", shortDesc:"Романтичный мост.", fullDesc:"Пешеходный мост через Мойку, легенды о свиданиях, красивый вид.", address:"наб. Мойки", metro:"Садовая", hours:"круглосуточно", lat:59.9286, lng:30.2975,
          photoUrl:"https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/PoceluevMost_29613.jpg/330px-PoceluevMost_29613.jpg" }
    ];

    // ---------- ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ----------
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
        return place.photoUrl; 
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

    function init() {
        initTheme();
        fetchWeather();
        setInterval(fetchWeather, 600000);
        initMap();
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