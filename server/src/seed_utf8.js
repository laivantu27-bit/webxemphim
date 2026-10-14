const Category = require('./models/category.model');
const Movie = require('./models/movie.model');
const Seat = require('./models/seat.model');
const User = require('./models/users.model');
const { createApiKey } = require('./services/tokenServices');
const bcrypt = require('bcrypt');
const sync = require('./models/sync');

const seedData = async () => {
    try {
        console.log('--- Cleaning old data ---');
        await sync();
        await Seat.destroy({ where: {}, truncate: false });
        await Movie.destroy({ where: {}, truncate: false });
        await Category.destroy({ where: {}, truncate: false });

        console.log('--- Seeding Clean UTF-8 Data with Valid Proxy Image URLs ---');

        // 1. Create Categories
        const categoriesData = [
            { nameCategory: 'Phim Chiếu Rạp Hot' },
            { nameCategory: 'Phim Hành Động & Viễn Tưởng' },
            { nameCategory: 'Phim Hoạt Hình & Gia Đình' },
            { nameCategory: 'Phim Kinh Dị & Giật Gân' },
            { nameCategory: 'Phim Tình Cảm & Tâm Lý' },
        ];

        const createdCategories = {};
        for (const cat of categoriesData) {
            const c = await Category.create(cat);
            createdCategories[cat.nameCategory] = c.id;
        }

        const catHot = createdCategories['Phim Chiếu Rạp Hot'];
        const catAction = createdCategories['Phim Hành Động & Viễn Tưởng'];
        const catAnimation = createdCategories['Phim Hoạt Hình & Gia Đình'];
        const catHorror = createdCategories['Phim Kinh Dị & Giật Gân'];
        const catDrama = createdCategories['Phim Tình Cảm & Tâm Lý'];

        // 2. Movies with correct wsrv.nl proxy URLs (no double https://)
        const movies = [
            {
                name: 'Quật Mộ Trùng Phùng (Exhuma)',
                category: catHorror,
                actor: 'Choi Min-sik, Kim Go-eun, Lee Do-hyun',
                country: 'Hàn Quốc',
                description: 'Hai pháp sư trẻ cùng bậc thầy phong thủy tiến hành khai quật ngôi mộ cổ bí ẩn, giải phóng những thế lực siêu nhiên tăm tối.',
                director: 'Jang Jae-hyun',
                time: '134',
                price: '90000',
                quality: '2D Vietsub',
                year: '2024',
                dateStart: new Date('2024-01-01'),
                dateEnd: new Date('2027-12-31'),
                poster_url: 'https://wsrv.nl/?url=image.tmdb.org/t/p/w500/pWKioqEw92z3z1g1m79R923bI9c.jpg',
                thumb_url: 'https://wsrv.nl/?url=image.tmdb.org/t/p/original/7kdoVY21L70v3h44iG89N7o0148.jpg',
            },
            {
                name: 'Avengers: Endgame (Hồi Kết)',
                category: catAction,
                actor: 'Robert Downey Jr., Chris Evans, Mark Ruffalo',
                country: 'Mỹ',
                description: 'Sau những sự kiện tàn khốc của Infinity War, các Avengers hợp lực một lần nữa nhằm đảo ngược hành động của Thanos và khôi phục trật tự vũ trụ.',
                director: 'Anthony Russo, Joe Russo',
                time: '181',
                price: '120000',
                quality: 'IMAX 3D',
                year: '2019',
                dateStart: new Date('2024-01-01'),
                dateEnd: new Date('2027-12-31'),
                poster_url: 'https://wsrv.nl/?url=image.tmdb.org/t/p/w500/or06tSAbGkgbKCGXFjKtWlyjOHB.jpg',
                thumb_url: 'https://wsrv.nl/?url=image.tmdb.org/t/p/original/7RyHsO4yDXtBv1zUU3M19BEd8rE.jpg',
            },
            {
                name: 'Avatar: Dòng Chảy Của Nước',
                category: catAction,
                actor: 'Sam Worthington, Zoe Saldana, Sigourney Weaver',
                country: 'Mỹ',
                description: 'Jake Sully sống cùng gia đình mới trên hành tinh Pandora. Khi một mối đe dọa cũ trở lại, Jake phải hợp lực với Neytiri để bảo vệ quê hương.',
                director: 'James Cameron',
                time: '192',
                price: '130000',
                quality: '3D 4DX',
                year: '2022',
                dateStart: new Date('2024-01-01'),
                dateEnd: new Date('2027-12-31'),
                poster_url: 'https://wsrv.nl/?url=image.tmdb.org/t/p/w500/t6HIrqfe13j1LH9YtLIVbL0128n.jpg',
                thumb_url: 'https://wsrv.nl/?url=image.tmdb.org/t/p/original/vL5WB9FQm9kgVv8zwhODCjnbI3o.jpg',
            },
            {
                name: 'Oppenheimer',
                category: catHot,
                actor: 'Cillian Murphy, Emily Blunt, Matt Damon',
                country: 'Mỹ',
                description: 'Câu chuyện về nhà vật lý J. Robert Oppenheimer, vai trò của ông trong Dự án Manhattan và quá trình chế tạo ra quả bom nguyên tử đầu tiên.',
                director: 'Christopher Nolan',
                time: '180',
                price: '110000',
                quality: 'IMAX 2D',
                year: '2023',
                dateStart: new Date('2024-01-01'),
                dateEnd: new Date('2027-12-31'),
                poster_url: 'https://wsrv.nl/?url=image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGvCiofl1f5.jpg',
                thumb_url: 'https://wsrv.nl/?url=image.tmdb.org/t/p/original/fm6K8OiOiWi2LxNxODW92vIG26J.jpg',
            },
            {
                name: 'Dune: Hành Tinh Cát 2',
                category: catHot,
                actor: 'Timothée Chalamet, Zendaya, Rebecca Ferguson',
                country: 'Mỹ',
                description: 'Paul Atreides hợp lực cùng Chani và người Fremen để trả thù những kẻ đã tàn sát gia đình anh, đối mặt với sự lựa chọn giữa tình yêu và vận mệnh vũ trụ.',
                director: 'Denis Villeneuve',
                time: '166',
                price: '105000',
                quality: 'IMAX 2D',
                year: '2024',
                dateStart: new Date('2024-01-01'),
                dateEnd: new Date('2027-12-31'),
                poster_url: 'https://wsrv.nl/?url=image.tmdb.org/t/p/w500/1pdfLPoLMag8StAButvYzp6kfvu.jpg',
                thumb_url: 'https://wsrv.nl/?url=image.tmdb.org/t/p/original/xOMo8WhK21rmA29kgPIg3f2qmoI.jpg',
            },
            {
                name: 'Deadpool & Wolverine',
                category: catAction,
                actor: 'Ryan Reynolds, Hugh Jackman, Emma Corrin',
                country: 'Mỹ',
                description: 'Deadpool bị tổ chức TVA kéo vào nhiệm vụ đặc biệt và phải hợp tác với Wolverine để giải cứu dòng thời gian.',
                director: 'Shawn Levy',
                time: '128',
                price: '100000',
                quality: '2D Vietsub',
                year: '2024',
                dateStart: new Date('2024-01-01'),
                dateEnd: new Date('2027-12-31'),
                poster_url: 'https://wsrv.nl/?url=image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg',
                thumb_url: 'https://wsrv.nl/?url=image.tmdb.org/t/p/original/yDHYTfA3R0jFYba16jBB1ef8oIt.jpg',
            },
            {
                name: 'Những Mảnh Ghép Cảm Xúc 2 (Inside Out 2)',
                category: catAnimation,
                actor: 'Amy Poehler, Maya Hawke, Kensington Tallman',
                country: 'Mỹ',
                description: 'Cùng cô bé Riley bước vào tuổi dậy thì với những cảm xúc mới tinh xuất hiện tại trung tâm điều khiển: Lo Âu, Ghen Tị, Xấu Hổ và Chán Nản.',
                director: 'Kelsey Mann',
                time: '96',
                price: '90000',
                quality: '2D Lồng Tiếng',
                year: '2024',
                dateStart: new Date('2024-01-01'),
                dateEnd: new Date('2027-12-31'),
                poster_url: 'https://wsrv.nl/?url=image.tmdb.org/t/p/w500/vpnVM9B6NMmQpEZZqOfMETiGZJw.jpg',
                thumb_url: 'https://wsrv.nl/?url=image.tmdb.org/t/p/original/stKGOm8UyhuLPR92h6jFfsjD2Bw.jpg',
            },
            {
                name: 'Kung Fu Panda 4',
                category: catAnimation,
                actor: 'Jack Black, Awkwafina, Viola Davis',
                country: 'Mỹ',
                description: 'Po phải tìm kiếm và huấn luyện một Thần Long Đại Hiệp mới trước khi đối đầu với mụ phù thủy Tắc Kè Bông nguy hiểm.',
                director: 'Mike Mitchell',
                time: '94',
                price: '85000',
                quality: '2D Lồng Tiếng',
                year: '2024',
                dateStart: new Date('2024-01-01'),
                dateEnd: new Date('2027-12-31'),
                poster_url: 'https://wsrv.nl/?url=image.tmdb.org/t/p/w500/kDp1vUBnMpeYrAKbLVPm39RjKXU.jpg',
                thumb_url: 'https://wsrv.nl/?url=image.tmdb.org/t/p/original/1XddXPXGiWexJLsu9yRuvXx2bX0.jpg',
            },
            {
                name: 'Spider-Man: Du Hành Vũ Trụ Nhện',
                category: catAnimation,
                actor: 'Shameik Moore, Hailee Steinfeld, Oscar Isaac',
                country: 'Mỹ',
                description: 'Miles Morales du hành qua Đa Vũ Trụ Nhện và chiến đấu cùng các Người Nhện khác để bảo vệ sự tồn tại của thực tại.',
                director: 'Joaquim Dos Santos',
                time: '140',
                price: '95000',
                quality: '2D Vietsub',
                year: '2023',
                dateStart: new Date('2024-01-01'),
                dateEnd: new Date('2027-12-31'),
                poster_url: 'https://wsrv.nl/?url=image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj7sIQ8.jpg',
                thumb_url: 'https://wsrv.nl/?url=image.tmdb.org/t/p/original/4MCpC2BLK2Wj2pWz2wvoEZIk2z7.jpg',
            },
            {
                name: 'Interstellar (Hố Đen Tử Thần)',
                category: catHot,
                actor: 'Matthew McConaughey, Anne Hathaway, Jessica Chastain',
                country: 'Mỹ',
                description: 'Một nhóm nhà hành tinh học vượt qua hố đen vũ trụ để tìm kiếm một ngôi nhà mới cho nhân loại khi Trái Đất kiệt quệ.',
                director: 'Christopher Nolan',
                time: '169',
                price: '100000',
                quality: 'IMAX 2D',
                year: '2014',
                dateStart: new Date('2024-01-01'),
                dateEnd: new Date('2027-12-31'),
                poster_url: 'https://wsrv.nl/?url=image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
                thumb_url: 'https://wsrv.nl/?url=image.tmdb.org/t/p/original/xJHokMbljvjADYdit5fK2v9y06H.jpg',
            },
            {
                name: 'Kỵ Sĩ Bóng Đêm (The Dark Knight)',
                category: catAction,
                actor: 'Christian Bale, Heath Ledger, Aaron Eckhart',
                country: 'Mỹ',
                description: 'Batman phải đối đầu với Joker - tên tội phạm thiên tài điên loạn đang reo rắc hỗn loạn cho thành phố Gotham.',
                director: 'Christopher Nolan',
                time: '152',
                price: '95000',
                quality: '2D HD',
                year: '2008',
                dateStart: new Date('2024-01-01'),
                dateEnd: new Date('2027-12-31'),
                poster_url: 'https://wsrv.nl/?url=image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
                thumb_url: 'https://wsrv.nl/?url=image.tmdb.org/t/p/original/nMKdUUepR0i5zn0D1q9v3h2oW0j.jpg',
            },
            {
                name: 'Kẻ Đánh Cắp Giấc Mơ (Inception)',
                category: catAction,
                actor: 'Leonardo DiCaprio, Joseph Gordon-Levitt, Tom Hardy',
                country: 'Mỹ',
                description: 'Dom Cobb là một kẻ cắp chuyên nghiệp thâm nhập vào giấc mơ của mục tiêu để lấy trộm những bí mật sâu kín nhất.',
                director: 'Christopher Nolan',
                time: '148',
                price: '95000',
                quality: '2D HD',
                year: '2010',
                dateStart: new Date('2024-01-01'),
                dateEnd: new Date('2027-12-31'),
                poster_url: 'https://wsrv.nl/?url=image.tmdb.org/t/p/w500/oYuLEydvwz1ioGLWsLXqu2E2RyC.jpg',
                thumb_url: 'https://wsrv.nl/?url=image.tmdb.org/t/p/original/8ZTVqvKDQ8emSGUEMjsS4yHAjKQ.jpg',
            },
            {
                name: 'Godzilla x Kong: Đế Chế Mới',
                category: catHot,
                actor: 'Rebecca Hall, Brian Tyree Henry, Dan Stevens',
                country: 'Mỹ',
                description: 'Kong và Godzilla phải gạt bỏ hiềm khích để cùng chống lại một siêu quái thú tàn bạo đang đe dọa sự sống trên Trái Đất.',
                director: 'Adam Wingard',
                time: '115',
                price: '100000',
                quality: '3D 4DX',
                year: '2024',
                dateStart: new Date('2024-01-01'),
                dateEnd: new Date('2027-12-31'),
                poster_url: 'https://wsrv.nl/?url=image.tmdb.org/t/p/w500/bAV2gL4fS4dFk0n1B1M76nF496h.jpg',
                thumb_url: 'https://wsrv.nl/?url=image.tmdb.org/t/p/original/tMefBSflR6LOfLPhEvse2Zjh6uB.jpg',
            },
            {
                name: 'Mai',
                category: catDrama,
                actor: 'Phương Anh Đào, Tuấn Trần, Trấn Thành',
                country: 'Việt Nam',
                description: 'Bộ phim xoay quanh cuộc đời của Mai, người phụ nữ làm nghề mát-xa chịu nhiều tổn thương và khát vọng yêu thương chân thành.',
                director: 'Trấn Thành',
                time: '131',
                price: '95000',
                quality: '2D HD',
                year: '2024',
                dateStart: new Date('2024-01-01'),
                dateEnd: new Date('2027-12-31'),
                poster_url: 'https://wsrv.nl/?url=image.tmdb.org/t/p/w500/7WsyChQLEftFiDOVTGkv3hFpywe.jpg',
                thumb_url: 'https://wsrv.nl/?url=image.tmdb.org/t/p/original/5Eip6LbBvZ8W6Pl8p9hG2gY2p4l.jpg',
            },
            {
                name: 'Tên Cậu Là Gì? (Your Name)',
                category: catDrama,
                actor: 'Ryunosuke Kamiki, Mone Kamishiraishi',
                country: 'Nhật Bản',
                description: 'Taki ở Tokyo và Mitsuha ở vùng quê bất ngờ bị hoán đổi thân xác, dẫn đến hành trình tìm kiếm kỳ diệu vượt thời gian.',
                director: 'Makoto Shinkai',
                time: '106',
                price: '85000',
                quality: '2D Anime',
                year: '2016',
                dateStart: new Date('2024-01-01'),
                dateEnd: new Date('2027-12-31'),
                poster_url: 'https://wsrv.nl/?url=image.tmdb.org/t/p/w500/q719jXXEzOoYaps6j2IsaiE1Wuv.jpg',
                thumb_url: 'https://wsrv.nl/?url=image.tmdb.org/t/p/original/vVpEOvGzBP4jSEOHSYxAbsbdYd9.jpg',
            },
        ];

        for (const movieData of movies) {
            const m = await Movie.create(movieData);

            const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
            const times = ['10:00', '12:30', '15:00', '17:30', '20:00', '22:30'];
            const todayStr = new Date().toISOString().split('T')[0];

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

        // 3. Create Admin Account
        const existingAdmin = await User.findOne({ where: { email: 'admin@gmail.com' } });
        if (!existingAdmin) {
            const salt = bcrypt.genSaltSync(10);
            const passwordHash = bcrypt.hashSync('123456', salt);
            const adminUser = await User.create({
                fullName: 'Quản trị viên',
                phone: '0987654321',
                email: 'admin@gmail.com',
                password: passwordHash,
                isAdmin: '1',
                typeLogin: 'email',
            });
            await createApiKey(adminUser.id);
            console.log('--- Admin User Created: admin@gmail.com / 123456 ---');
        }

        console.log('--- Clean Seed Completed Successfully! ---');
        process.exit(0);
    } catch (err) {
        console.error('Error in seed:', err);
        process.exit(1);
    }
};

seedData();
