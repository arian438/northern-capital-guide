function mapPlaceToClient(place) {
    if (!place) return null;

    return {
        id: place.id,
        name: place.name,
        category: place.category,
        shortDesc: place.short_desc,
        fullDesc: place.full_desc,
        address: place.address,
        metro: place.metro,
        hours: place.hours,
        lat: place.lat != null ? parseFloat(place.lat) : null,
        lng: place.lng != null ? parseFloat(place.lng) : null,
        photoUrl: place.photo_url,
        rating: place.rating != null ? parseFloat(place.rating) : null,
        reviewsCount: place.reviews_count,
        createdAt: place.created_at,
        updatedAt: place.updated_at,
        isFavorite: place.isFavorite,
        reviews: place.reviews
    };
}

function mapPlacesToClient(places) {
    return places.map(mapPlaceToClient);
}

module.exports = { mapPlaceToClient, mapPlacesToClient };
