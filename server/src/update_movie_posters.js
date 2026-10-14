require('dotenv').config({ path: './server/.env' });
const { connectDB } = require('./config');
const Movie = require('./models/movie.model');

const posterMapping = [
    {
        pattern: /Exhuma|Quật Mộ/i,
        poster_url: 'https://wsrv.nl/?url=media.themoviedb.org/t/p/w500/enAODUiL6eMpKaYPH2BEStVafQ2.jpg',
        thumb_url: 'https://wsrv.nl/?url=media.themoviedb.org/t/p/w780/kYWk8TW5TkpCWkB0mkUm72N0lb8.jpg',
    },
    {
        pattern: /Avengers|Endgame/i,
        poster_url: 'https://wsrv.nl/?url=media.themoviedb.org/t/p/w500/8go3YE9sBMQaCXEx23j6BAfeuxd.jpg',
        thumb_url: 'https://wsrv.nl/?url=media.themoviedb.org/t/p/w780/7RyHsO4yDXtBv1zUU3mTpHeQ0d5.jpg',
    },
    {
        pattern: /Avatar/i,
        poster_url: 'https://wsrv.nl/?url=media.themoviedb.org/t/p/w500/luCqqHf10eQuGAYFO3U7JEqT4XC.jpg',
        thumb_url: 'https://wsrv.nl/?url=media.themoviedb.org/t/p/w780/kJsPVzdyBrYHLomuNv5SJDXUQ2f.jpg',
    },
    {
        pattern: /Oppenheimer/i,
        poster_url: 'https://wsrv.nl/?url=media.themoviedb.org/t/p/w500/ixLH2iM9at8BbuLr5wQWnCfwhJO.jpg',
        thumb_url: 'https://wsrv.nl/?url=media.themoviedb.org/t/p/w780/neeNHeXjMF5fXoCJRsOmkNGC7q.jpg',
    },
    {
        pattern: /Dune/i,
        poster_url: 'https://wsrv.nl/?url=media.themoviedb.org/t/p/w500/8QdnKQyZDlN6rBSrfU1V5PctfUu.jpg',
        thumb_url: 'https://wsrv.nl/?url=media.themoviedb.org/t/p/w780/eZ239CUp1d6OryZEBPnO2n87gMG.jpg',
    },
    {
        pattern: /Deadpool/i,
        poster_url: 'https://wsrv.nl/?url=media.themoviedb.org/t/p/w500/lfY2CfmxyN9OvxmFuap6aejViJn.jpg',
        thumb_url: 'https://wsrv.nl/?url=media.themoviedb.org/t/p/w780/by8z9Fe8y7p4jo2YlW2SZDnptyT.jpg',
    },
    {
        pattern: /Inside Out|Những Mảnh Ghép Cảm Xúc/i,
        poster_url: 'https://wsrv.nl/?url=media.themoviedb.org/t/p/w500/wAIFnJ5OeFU7tTnCWHiROsszS29.jpg',
        thumb_url: 'https://wsrv.nl/?url=media.themoviedb.org/t/p/w780/p5ozvmdgsmbWe0H8Xk7Rc8SCwAB.jpg',
    },
    {
        pattern: /Kung Fu Panda/i,
        poster_url: 'https://wsrv.nl/?url=media.themoviedb.org/t/p/w500/7quq3UOaaB0qNM7TMGMEqqghLck.jpg',
        thumb_url: 'https://wsrv.nl/?url=media.themoviedb.org/t/p/w780/3ffPx9jqg0yj9y1KWeagT7D20CB.jpg',
    },
    {
        pattern: /Spider-Man|Người Nhện|Vũ Trụ Nhện/i,
        poster_url: 'https://wsrv.nl/?url=media.themoviedb.org/t/p/w500/paM6UdMgXuXyAK0jhGfV07o3lRW.jpg',
        thumb_url: 'https://wsrv.nl/?url=media.themoviedb.org/t/p/w780/kVd3a9YeLGkoeR50jGEXM6EqseS.jpg',
    },
    {
        pattern: /Interstellar|Hố Đen/i,
        poster_url: 'https://wsrv.nl/?url=media.themoviedb.org/t/p/w500/if4TI9LbqNIrzkoOgWjX5PZYDYe.jpg',
        thumb_url: 'https://wsrv.nl/?url=media.themoviedb.org/t/p/w780/8sNiAPPYU14PUepFNeSNGUTiHW.jpg',
    },
    {
        pattern: /The Dark Knight|Kỵ Sĩ Bóng Đêm/i,
        poster_url: 'https://wsrv.nl/?url=media.themoviedb.org/t/p/w500/7EfSqviKvXwbiGhUjHyUBGVdoiW.jpg',
        thumb_url: 'https://wsrv.nl/?url=media.themoviedb.org/t/p/w780/9FE5eD92WfVCiivM9Pq9GVSrlWk.jpg',
    },
    {
        pattern: /Inception|Kẻ Đánh Cắp Giấc Mơ/i,
        poster_url: 'https://wsrv.nl/?url=media.themoviedb.org/t/p/w500/eBtqGWtR5KUiNl6OXHLR3ri6nVm.jpg',
        thumb_url: 'https://wsrv.nl/?url=media.themoviedb.org/t/p/w780/8ZTVqvKDQ8emSGUEMjsS4yHAwrp.jpg',
    },
    {
        pattern: /Godzilla x Kong|Đế Chế Mới/i,
        poster_url: 'https://wsrv.nl/?url=media.themoviedb.org/t/p/w500/lTpnAtn1hWXDLxEmkD28l6UyPlF.jpg',
        thumb_url: 'https://wsrv.nl/?url=media.themoviedb.org/t/p/w780/gvLG3Fnznkxl4SmYfcK8gUuqxM8.jpg',
    },
    {
        pattern: /^Mai$/i,
        poster_url: 'https://wsrv.nl/?url=media.themoviedb.org/t/p/w500/e3bGQG9Es4HC0kaw4pTDITWmRpM.jpg',
        thumb_url: 'https://wsrv.nl/?url=media.themoviedb.org/t/p/w780/iS9QpLJdZnESPoazwSGflllmO62.jpg',
    },
    {
        pattern: /Your Name|Tên Cậu Là Gì/i,
        poster_url: 'https://wsrv.nl/?url=media.themoviedb.org/t/p/w500/yV8ARrvpWaWd509QM4LwMScNDvZ.jpg',
        thumb_url: 'https://wsrv.nl/?url=media.themoviedb.org/t/p/w780/mMtUybQ6hL24FXo0F3Z4j2KG7kZ.jpg',
    },
];

const updatePosters = async () => {
    try {
        await connectDB();
        const movies = await Movie.findAll();
        console.log(`Found ${movies.length} movies in database.`);

        for (const movie of movies) {
            const match = posterMapping.find((m) => m.pattern.test(movie.name));
            if (match) {
                movie.poster_url = match.poster_url;
                movie.thumb_url = match.thumb_url;
                await movie.save();
                console.log(`[UPDATED] ${movie.name}`);
            } else {
                console.log(`[SKIPPED] ${movie.name} (no mapping, keeps current)`);
            }
        }
        console.log('--- ALL MOVIE POSTERS SUCCESSFULLY UPDATED ---');
        process.exit(0);
    } catch (err) {
        console.error('Error updating posters:', err);
        process.exit(1);
    }
};

updatePosters();
