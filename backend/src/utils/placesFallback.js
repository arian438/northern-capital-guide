const path = require('path');
const places = require(path.join(__dirname, '../../data/places.json'));

function isDatabaseConfigured() {
    return Boolean(
        process.env.DATABASE_URL ||
        process.env.POSTGRES_URL ||
        process.env.POSTGRES_PRISMA_URL ||
        (process.env.DB_HOST && process.env.DB_NAME)
    );
}

function filterPlaces(allPlaces, filters = {}) {
    let result = [...allPlaces];

    if (filters.category && filters.category !== 'all') {
        result = result.filter((p) => p.category === filters.category);
    }

    if (filters.search) {
        const q = filters.search.toLowerCase();
        result = result.filter(
            (p) =>
                p.name.toLowerCase().includes(q) ||
                (p.short_desc && p.short_desc.toLowerCase().includes(q))
        );
    }

    if (filters.minRating) {
        result = result.filter((p) => parseFloat(p.rating) >= filters.minRating);
    }

    if (filters.sortBy === 'name') {
        result.sort((a, b) => a.name.localeCompare(b.name, 'ru'));
    } else if (filters.sortBy === 'nameDesc') {
        result.sort((a, b) => b.name.localeCompare(a.name, 'ru'));
    } else if (filters.sortBy === 'rating') {
        result.sort((a, b) => parseFloat(b.rating || 0) - parseFloat(a.rating || 0));
    } else if (filters.sortBy === 'popular') {
        result.sort((a, b) => (b.reviews_count || 0) - (a.reviews_count || 0));
    } else {
        result.sort((a, b) => a.id - b.id);
    }

    const offset = filters.offset || 0;
    const limit = filters.limit || 50;
    return result.slice(offset, offset + limit);
}

function findAll(filters = {}) {
    return filterPlaces(places, filters);
}

function countAll() {
    return places.length;
}

function findById(id) {
    return places.find((p) => p.id === parseInt(id, 10)) || null;
}

function getNearby(lat, lng, radiusKm = 0.02) {
    const toRad = (deg) => (deg * Math.PI) / 180;
    const earthRadius = 6371;

    return places
        .map((p) => {
            const dLat = toRad(parseFloat(p.lat) - lat);
            const dLng = toRad(parseFloat(p.lng) - lng);
            const a =
                Math.sin(dLat / 2) ** 2 +
                Math.cos(toRad(lat)) *
                    Math.cos(toRad(parseFloat(p.lat))) *
                    Math.sin(dLng / 2) ** 2;
            const distance = earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return { ...p, distance };
        })
        .filter((p) => p.distance < radiusKm)
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 20);
}

module.exports = {
    isDatabaseConfigured,
    findAll,
    countAll,
    findById,
    getNearby
};
