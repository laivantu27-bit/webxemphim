const fs = require('fs');

const fetchOgImages = async (tmdbId) => {
    try {
        const res = await fetch('https://www.themoviedb.org/movie/' + tmdbId, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            redirect: 'follow'
        });
        const data = await res.text();
        const matches = [...data.matchAll(/<meta property="og:image" content="([^"]+)"/g)];
        return matches.map(m => m[1]);
    } catch (e) {
        console.error('Error:', tmdbId, e.message);
        return [];
    }
};

(async () => {
    const list = [
        { name: 'Exhuma', id: 838209 },
        { name: 'Avengers Endgame', id: 299534 },
        { name: 'Avatar 2', id: 76600 },
        { name: 'Oppenheimer', id: 872585 },
        { name: 'Dune 2', id: 693134 },
        { name: 'Deadpool & Wolverine', id: 533535 },
        { name: 'Inside Out 2', id: 1022789 },
        { name: 'Kung Fu Panda 4', id: 1011985 },
        { name: 'Spider-Man Across Spider-Verse', id: 569094 },
        { name: 'Interstellar', id: 157336 },
        { name: 'The Dark Knight', id: 155 },
        { name: 'Inception', id: 27205 },
        { name: 'Godzilla x Kong', id: 823464 },
        { name: 'Mai', id: 1215451 },
        { name: 'Your Name', id: 372058 }
    ];

    const results = {};
    for (const item of list) {
        const imgs = await fetchOgImages(item.id);
        results[item.name] = imgs;
        console.log(item.name, '=>', imgs);
    }
    fs.writeFileSync('server/src/tmdb_images.json', JSON.stringify(results, null, 2));
})();
