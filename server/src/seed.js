const Category = require('./src/models/category.model');
const Movie = require('./src/models/movie.model');
const Seat = require('./src/models/seat.model');
const sync = require('./src/models/sync');

const seedData = async () => {
    try {
        console.log('--- Starting Data Seed ---');
        await sync();

        // 1. Create Categories
        const categoriesData = [
            { nameCategory: 'Phim Hành Động & Viễn Tưởng' },
            { nameCategory: 'Phim Hoạt Hình & Gia Đình' },
            { nameCategory: 'Phim Kinh Dị & Giật Gân' },
            { nameCategory: 'Phim Tình Cảm & Tâm Lý' },
            { nameCategory: 'Phim Chiếu Rạp Hot 2024' },
        ];

        const createdCategories = {};
        for (const cat of categoriesData) {
            const [c] = await Category.findOrCreate({
                where: { nameCategory: cat.nameCategory },
                defaults: cat,
            });
            createdCategories[cat.nameCategory] = c.id;
        }

        const catAction = createdCategories['Phim Hành Động & Viễn Tưởng'];
        const catAnimation = createdCategories['Phim Hoạt Hình & Gia Đình'];
        const catHorror = createdCategories['Phim Kinh Dị & Giật Gân'];
        const catDrama = createdCategories['Phim Tình Cảm & Tâm Lý'];
        const catHot = createdCategories['Phim Chiếu Rạp Hot 2024'];

        // 2. Famous Movies Data
        const movies = [
            {
                name: 'Avengers: Endgame',
                category: catAction,
                actor: 'Robert Downey Jr., Chris Evans, Mark Ruffalo, Chris Hemsworth',
                country: 'Mỹ',
                description: 'Sau những sự kiện tàn khốc của Avengers: Infinity War, vũ trụ rơi vào cảnh hoang tàn. Với sự trợ giúp của các đồng minh còn sống sót, các Avengers hội tụ một lần nữa nhằm đảo ngược hành động của Thanos và khôi phục lại trật tự vũ trụ.',
                director: 'Anthony Russo, Joe Russo',
                time: '181',
                price: '120000',
                quality: 'IMAX 3D',
                year: '2019',
                dateStart: new Date('2024-01-01'),
                dateEnd: new Date('2027-12-31'),
                poster_url: 'https://image.tmdb.org/t/p/w500/or06tSAbGkgbKCGXFjKtWlyjOHB.jpg',
                thumb_url: 'https://image.tmdb.org/t/p/original/7RyHsO4yDXtBv1zUU3M19BEd8rE.jpg',
            },
            {
                name: 'Avatar: The Way of Water',
                category: catAction,
                actor: 'Sam Worthington, Zoe Saldana, Sigourney Weaver, Stephen Lang',
                country: 'Mỹ',
                description: 'Jake Sully sống cùng gia đình mới được thành lập của mình trên hành tinh Pandora. Khi một mối đe dọa quen thuộc trở lại để hoàn thành những gì đã bắt đầu trước đó, Jake phải làm việc với Neytiri và quân đội của chủng tộc Na\'vi để bảo vệ hành tinh của họ.',
                director: 'James Cameron',
                time: '192',
                price: '130000',
                quality: '3D 4DX',
                year: '2022',
                dateStart: new Date('2024-01-01'),
                dateEnd: new Date('2027-12-31'),
                poster_url: 'https://image.tmdb.org/t/p/w500/t6HIrqfe13j1LH9YtLIVbL0128n.jpg',
                thumb_url: 'https://image.tmdb.org/t/p/original/vL5WB9FQm9kgVv8zwhODCjnbI3o.jpg',
            },
            {
                name: 'Oppenheimer',
                category: catHot,
                actor: 'Cillian Murphy, Emily Blunt, Matt Damon, Robert Downey Jr.',
                country: 'Mỹ',
                description: 'Câu chuyện về nhà vật lý lý thuyết người Mỹ J. Robert Oppenheimer, vai trò của ông trong Dự án Manhattan và những đóng góp dẫn đến việc chế tạo ra bom nguyên tử.',
                director: 'Christopher Nolan',
                time: '180',
                price: '110000',
                quality: 'IMAX 2D',
                year: '2023',
                dateStart: new Date('2024-01-01'),
                dateEnd: new Date('2027-12-31'),
                poster_url: 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGvCiofl1f5.jpg',
                thumb_url: 'https://image.tmdb.org/t/p/original/fm6K8OiOiWi2LxNxODW92vIG26J.jpg',
            },
            {
                name: 'Dune: Part Two',
                category: catHot,
                actor: 'Timothée Chalamet, Zendaya, Rebecca Ferguson, Javier Bardem',
                country: 'Mỹ',
                description: 'Paul Atreides tái hợp với Chani và người Fremen khi anh tìm kiếm sự trả thù cho những kẻ đã hủy hoại gia đình mình. Anh phải lựa chọn giữa tình yêu của đời mình và số phận của vũ trụ.',
                director: 'Denis Villeneuve',
                time: '166',
                price: '105000',
                quality: 'IMAX 2D',
                year: '2024',
                dateStart: new Date('2024-01-01'),
                dateEnd: new Date('2027-12-31'),
                poster_url: 'https://image.tmdb.org/t/p/w500/1pdfLPoLMag8StAButvYzp6kfvu.jpg',
                thumb_url: 'https://image.tmdb.org/t/p/original/xOMo8WhK21rmA29kgPIg3f2qmoI.jpg',
            },
            {
                name: 'Deadpool & Wolverine',
                category: catAction,
                actor: 'Ryan Reynolds, Hugh Jackman, Emma Corrin, Morena Baccarin',
                country: 'Mỹ',
                description: 'Deadpool bị tổ chức TVA kéo khỏi cuộc sống yên bình và hợp tác cùng Wolverine trong một sứ mệnh thay đổi lịch sử của Vũ trụ Điện ảnh Marvel.',
                director: 'Shawn Levy',
                time: '128',
                price: '100000',
                quality: '2D HD',
                year: '2024',
                dateStart: new Date('2024-01-01'),
                dateEnd: new Date('2027-12-31'),
                poster_url: 'https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg',
                thumb_url: 'https://image.tmdb.org/t/p/original/yDHYTfA3R0jFYba16jBB1ef8oIt.jpg',
            },
            {
                name: 'Inside Out 2 (Những Mảnh Ghép Cảm Xúc 2)',
                category: catAnimation,
                actor: 'Amy Poehler, Maya Hawke, Kensington Tallman, Liza Lapira',
                country: 'Mỹ',
                description: 'Theo chân cô bé Riley bước vào tuổi dậy thì với những cảm xúc hoàn toàn mới xuất hiện tại trung tâm điều khiển: Lo Âu, Ghen Tị, Xấu Hổ và Chán Nản.',
                director: 'Kelsey Mann',
                time: '96',
                price: '90000',
                quality: '2D Lồng Tiếng',
                year: '2024',
                dateStart: new Date('2024-01-01'),
                dateEnd: new Date('2027-12-31'),
                poster_url: 'https://image.tmdb.org/t/p/w500/vpnVM9B6NMmQpEZZqOfMETiGZJw.jpg',
                thumb_url: 'https://image.tmdb.org/t/p/original/stKGOm8UyhuLPR92h6jFfsjD2Bw.jpg',
            },
            {
                name: 'Kung Fu Panda 4',
                category: catAnimation,
                actor: 'Jack Black, Awkwafina, Viola Davis, Dustin Hoffman',
                country: 'Mỹ',
                description: 'Po được chọn trở lại làm Thần Thủ Thần Thoại và phải tìm kiếm cũng như huấn luyện một Thần Long Đại Hiệp mới trong khi đối đầu với mụ phù thủy Tắc Kè Bông hiểm ác.',
                director: 'Mike Mitchell',
                time: '94',
                price: '85000',
                quality: '2D Lồng Tiếng',
                year: '2024',
                dateStart: new Date('2024-01-01'),
                dateEnd: new Date('2027-12-31'),
                poster_url: 'https://image.tmdb.org/t/p/w500/kDp1vUBnMpeYrAKbLVPm39RjKXU.jpg',
                thumb_url: 'https://image.tmdb.org/t/p/original/1XddXPXGiWexJLsu9yRuvXx2bX0.jpg',
            },
            {
                name: 'Spider-Man: Across the Spider-Verse',
                category: catAnimation,
                actor: 'Shameik Moore, Hailee Steinfeld, Oscar Isaac, Jake Johnson',
                country: 'Mỹ',
                description: 'Miles Morales du hành qua Vũ trụ Nhện, nơi anh gặp một nhóm Người Nhện chịu trách nhiệm bảo vệ sự tồn tại của nó. Nhưng khi các anh hùng xung đột về cách xử lý mối đe dọa mới, Miles phải định nghĩa lại ý nghĩa của việc làm một anh hùng.',
                director: 'Joaquim Dos Santos, Kemp Powers',
                time: '140',
                price: '95000',
                quality: '2D Vietsub',
                year: '2023',
                dateStart: new Date('2024-01-01'),
                dateEnd: new Date('2027-12-31'),
                poster_url: 'https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj7sIQ8.jpg',
                thumb_url: 'https://image.tmdb.org/t/p/original/4MCpC2BLK2Wj2pWz2wvoEZIk2z7.jpg',
            },
            {
                name: 'Exhuma: Quật Mộ Trùng Phùng',
                category: catHorror,
                actor: 'Choi Min-sik, Kim Go-eun, Lee Do-hyun, Yoo Hae-jin',
                country: 'Hàn Quốc',
                description: 'Sau khi hứng chịu chuỗi sự kiện siêu nhiên đáng ngờ, một gia đình giàu có ở Los Angeles đã gọi cho hai pháp sư trẻ tài năng Hwa-rim và Bong-gil để cứu đứa bé mới sinh của gia đình.',
                director: 'Jang Jae-hyun',
                time: '134',
                price: '90000',
                quality: '2D HD',
                year: '2024',
                dateStart: new Date('2024-01-01'),
                dateEnd: new Date('2027-12-31'),
                poster_url: 'https://image.tmdb.org/t/p/w500/pWKioqEw92z3z1g1m79R923bI9c.jpg',
                thumb_url: 'https://image.tmdb.org/t/p/original/7kdoVY21L70v3h44iG89N7o0148.jpg',
            },
            {
                name: 'Interstellar (Hố Đen Tử Thần)',
                category: catHot,
                actor: 'Matthew McConaughey, Anne Hathaway, Jessica Chastain, Michael Caine',
                country: 'Mỹ',
                description: 'Khi Trái Đất dần trở nên không thể sống được nữa trong tương lai, một nhóm nhà hành tinh học sử dụng một lỗ hổng thời gian mới được khám phá để vượt qua các giới hạn du hành vũ trụ.',
                director: 'Christopher Nolan',
                time: '169',
                price: '100000',
                quality: 'IMAX 2D',
                year: '2014',
                dateStart: new Date('2024-01-01'),
                dateEnd: new Date('2027-12-31'),
                poster_url: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
                thumb_url: 'https://image.tmdb.org/t/p/original/xJHokMbljvjADYdit5fK2v9y06H.jpg',
            },
            {
                name: 'The Dark Knight (Kỵ Sĩ Bóng Đêm)',
                category: catAction,
                actor: 'Christian Bale, Heath Ledger, Aaron Eckhart, Michael Caine',
                country: 'Mỹ',
                description: 'Khi mối đe dọa mới được gọi là Joker tàn phá và gây hỗn loạn cho người dân Gotham, Batman phải chấp nhận một trong những thử thách tâm lý và thể xác lớn nhất về khả năng chống lại bất công của mình.',
                director: 'Christopher Nolan',
                time: '152',
                price: '95000',
                quality: '2D HD',
                year: '2008',
                dateStart: new Date('2024-01-01'),
                dateEnd: new Date('2027-12-31'),
                poster_url: 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
                thumb_url: 'https://image.tmdb.org/t/p/original/nMKdUUepR0i5zn0D1q9v3h2oW0j.jpg',
            },
            {
                name: 'Inception (Kẻ Đánh Cắp Giấc Mơ)',
                category: catAction,
                actor: 'Leonardo DiCaprio, Joseph Gordon-Levitt, Elliot Page, Tom Hardy',
                country: 'Mỹ',
                description: 'Kẻ cắp Dom Cobb chuyên đột nhập vào giấc mơ của người khác để lấy trộm bí mật thương mại. Lần này anh được giao nhiệm vụ cấy một ý tưởng vào tâm trí của một CEO tập đoàn.',
                director: 'Christopher Nolan',
                time: '148',
                price: '95000',
                quality: '2D HD',
                year: '2010',
                dateStart: new Date('2024-01-01'),
                dateEnd: new Date('2027-12-31'),
                poster_url: 'https://image.tmdb.org/t/p/w500/oYuLEydvwz1ioGLWsLXqu2E2RyC.jpg',
                thumb_url: 'https://image.tmdb.org/t/p/original/8ZTVqvKDQ8emSGUEMjsS4yHAjKQ.jpg',
            },
            {
                name: 'Godzilla x Kong: The New Empire',
                category: catHot,
                actor: 'Rebecca Hall, Brian Tyree Henry, Dan Stevens, Kaylee Hottle',
                country: 'Mỹ',
                description: 'Hai quái thú khổng lồ Kong và Godzilla phải hợp lực chống lại một mối đe dọa sinh tồn chết người chưa từng được khám phá ẩn sâu trong thế giới của chúng ta.',
                director: 'Adam Wingard',
                time: '115',
                price: '100000',
                quality: '3D 4DX',
                year: '2024',
                dateStart: new Date('2024-01-01'),
                dateEnd: new Date('2027-12-31'),
                poster_url: 'https://image.tmdb.org/t/p/w500/bAV2gL4fS4dFk0n1B1M76nF496h.jpg',
                thumb_url: 'https://image.tmdb.org/t/p/original/tMefBSflR6LOfLPhEvse2Zjh6uB.jpg',
            },
            {
                name: 'Mai',
                category: catDrama,
                actor: 'Phương Anh Đào, Tuấn Trần, Trấn Thành, Hồng Đào',
                country: 'Việt Nam',
                description: 'Câu chuyện về Mai, một người phụ nữ làm nghề mát-xa chịu nhiều tổn thương và định kiến xã hội, khi cô gặp Dương - chàng trai trẻ đào hoa muốn chinh phục trái tim cô.',
                director: 'Trấn Thành',
                time: '131',
                price: '95000',
                quality: '2D HD',
                year: '2024',
                dateStart: new Date('2024-01-01'),
                dateEnd: new Date('2027-12-31'),
                poster_url: 'https://image.tmdb.org/t/p/w500/7WsyChQLEftFiDOVTGkv3hFpywe.jpg',
                thumb_url: 'https://image.tmdb.org/t/p/original/5Eip6LbBvZ8W6Pl8p9hG2gY2p4l.jpg',
            },
            {
                name: 'Your Name (Tên Cậu Là Gì?)',
                category: catDrama,
                actor: 'Ryunosuke Kamiki, Mone Kamishiraishi, Ryo Narita',
                country: 'Nhật Bản',
                description: 'Hai người xa lạ Taki và Mitsuha thấy mình hoán đổi thân xác một cách bí ẩn. Khi một thảm họa thiên thạch đe dọa quê hương của Mitsuha, họ phải tìm cách liên lạc vượt không gian và thời gian.',
                director: 'Makoto Shinkai',
                time: '106',
                price: '85000',
                quality: '2D Anime',
                year: '2016',
                dateStart: new Date('2024-01-01'),
                dateEnd: new Date('2027-12-31'),
                poster_url: 'https://image.tmdb.org/t/p/w500/q719jXXEzOoYaps6j2IsaiE1Wuv.jpg',
                thumb_url: 'https://image.tmdb.org/t/p/original/vVpEOvGzBP4jSEOHSYxAbsbdYd9.jpg',
            },
        ];

        for (const movieData of movies) {
            const [m] = await Movie.findOrCreate({
                where: { name: movieData.name },
                defaults: movieData,
            });

            // Seed seats for each movie
            const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
            const times = ['10:00', '12:30', '15:00', '17:30', '20:00', '22:30'];
            const todayStr = new Date().toISOString().split('T')[0];

            // Only create seats if none exist for this movie
            const existingSeatsCount = await Seat.count({ where: { movieId: m.id } });
            if (existingSeatsCount === 0) {
                const seatsToCreate = [];
                for (const t of times) {
                    for (const r of rows) {
                        for (let num = 1; num <= 12; num++) {
                            seatsToCreate.push({
                                row: r,
                                number: num,
                                seat_code: `${r}${num}`,
                                status: Math.random() < 0.15 ? 'booked' : 'available',
                                movieId: m.id,
                                time: t,
                                date: todayStr,
                            });
                        }
                    }
                }
                await Seat.bulkCreate(seatsToCreate);
            }
        }

        console.log('--- Data Seed Finished Successfully! ---');
        process.exit(0);
    } catch (err) {
        console.error('Error seeding data:', err);
        process.exit(1);
    }
};

seedData();
