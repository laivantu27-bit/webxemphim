const { Op } = require('sequelize');
const Movies = require('../models/movie.model');
const Seats = require('../models/seat.model');
const Category = require('../models/category.model');
const { OK } = require('../core/success.response');
const { BadRequestError } = require('../core/error.response');

// Normalize Vietnamese text for flexible matching (removes accents and punctuation)
function removeVietnameseTones(str) {
    if (!str) return '';
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

class ChatbotController {
    static async chat(req, res, next) {
        try {
            const { message, conversationHistory = [] } = req.body;

            if (!message || !message.trim()) {
                throw new BadRequestError('Nội dung tin nhắn không được để trống');
            }

            const rawMsg = message.trim();
            const lowerMsg = rawMsg.toLowerCase();
            const cleanMsg = removeVietnameseTones(rawMsg);

            // 1. Fetch all real categories & movies currently in database
            const [categoriesList, allMoviesRaw] = await Promise.all([
                Category.findAll(),
                Movies.findAll({ order: [['createdAt', 'DESC']] }),
            ]);

            const categoryMap = new Map();
            categoriesList.forEach((c) => {
                categoryMap.set(c.id, c.nameCategory);
            });

            const allMovies = allMoviesRaw.map((m) => {
                const catName = categoryMap.get(m.category) || 'Điện ảnh';
                return {
                    id: m.id,
                    name: m.name,
                    category: catName,
                    categoryId: m.category,
                    actor: m.actor,
                    director: m.director,
                    country: m.country,
                    description: m.description,
                    time: m.time,
                    price: m.price,
                    quality: m.quality,
                    year: m.year,
                    thumb_url: m.thumb_url,
                    poster_url: m.poster_url,
                    trailer_url: m.trailer_url,
                };
            });

            // 2. Intent Analysis
            const isGreeting = /^(chao|xin chao|hello|hi|alo|he lo|hey|hi bot|chao ban|halo|chao em|chao chi|chao ad)/i.test(cleanMsg);
            
            const isBookingInquiry = /(dat ve|mua ve|dat ghe|chon ghe|con ghe|ghe trong|xem ghe|book ve|cach dat ve|huong dan dat)/i.test(cleanMsg);
            
            const isPriceQuery = /(gia ve|bao nhieu tien|ve bao nhieu|bang gia|hang ghe|gia ghe|ghe vip|phu thu|gia tung hang)/i.test(cleanMsg);
            
            const isSnackQuery = /(bap|bap rang|nuoc ngot|combo|bong ngo|do an|nuoc uong|an uong|an kem|bap nuoc)/i.test(cleanMsg);
            
            const isVoiceHelpQuery = /(ghi am|giong noi|micro|noi|nguoi gia|khong biet go|doc to|loa)/i.test(cleanMsg);
            
            const isNowShowing = /(phim dang chieu|phim moi|phim hot|dang chieu|co phim gi|danh sach phim|tat ca phim|hom nay co phim gi|co nhung phim gi|chieu phim gi)/i.test(cleanMsg);

            // Category-based queries
            const isAnimation = /(hoat hinh|anime|tre em|thieu nhi|gia dinh|hoat hoa|cartoon)/i.test(cleanMsg);
            const isAction = /(hanh dong|vo thuat|danh nhau|sieu anh hung|bom tan|chien dau)/i.test(cleanMsg);
            const isSciFi = /(vien tuong|khoa hoc|vu tru|hanh tinh|ho den|du hanh)/i.test(cleanMsg);
            const isHorror = /(kinh di|ma|quyet mo|tam linh|rung ron|so hai|exhuma)/i.test(cleanMsg);
            const isDrama = /(tam ly|tinh cam|gia dinh|mai|lang man|tinh yeu|doi thuong)/i.test(cleanMsg);

            // Helper to check word match avoiding partial-word false positives (e.g. 'po' inside 'potter')
            const checkWordMatch = (source, target) => {
                if (!source || !target) return false;
                if (target.length <= 4) {
                    const escaped = target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    return new RegExp(`(?:^|\\s)${escaped}(?:\\s|$)`, 'i').test(source);
                }
                return source.includes(target);
            };

            // 3. Search for directly mentioned movie in Database
            let matchedMovies = [];

            // A. Check exact and substring match on titles and alias/English titles
            for (const movie of allMovies) {
                const nameClean = removeVietnameseTones(movie.name);
                // Also check parts inside parentheses (e.g. Inside Out 2, The Dark Knight, Exhuma)
                const englishMatch = movie.name.match(/\(([^)]+)\)/);
                const englishClean = englishMatch ? removeVietnameseTones(englishMatch[1]) : '';

                if (cleanMsg.includes(nameClean) || checkWordMatch(cleanMsg, nameClean)) {
                    matchedMovies.push(movie);
                } else if (englishClean && (cleanMsg.includes(englishClean) || checkWordMatch(cleanMsg, englishClean))) {
                    matchedMovies.push(movie);
                } else if (cleanMsg.length > 3) {
                    const actorClean = removeVietnameseTones(movie.actor || '');
                    const dirClean = removeVietnameseTones(movie.director || '');
                    if (checkWordMatch(actorClean, cleanMsg) || checkWordMatch(dirClean, cleanMsg)) {
                        matchedMovies.push(movie);
                    }
                }
            }

            // B. If not found by full name, match by significant key terms
            if (matchedMovies.length === 0 && !isGreeting && !isNowShowing && !isPriceQuery && !isSnackQuery && !isVoiceHelpQuery) {
                // Key terms dictionary for popular titles
                const movieKeywords = [
                    { keywords: ['avatar', 'dong chay cua nuoc', 'na vi'], name: 'Avatar' },
                    { keywords: ['oppenheimer', 'bom nguyen tu', 'nolan'], name: 'Oppenheimer' },
                    { keywords: ['dune', 'hanh tinh cat', 'sau cat'], name: 'Dune' },
                    { keywords: ['deadpool', 'wolverine', 'nguoi soi', 'det bun'], name: 'Deadpool' },
                    { keywords: ['inside out', 'cam xuc', 'nhung manh ghep'], name: 'Inside Out' },
                    { keywords: ['kung fu panda', 'panda', 'gau truc', 'gau po'], name: 'Kung Fu Panda' },
                    { keywords: ['nhen', 'spider', 'nguoi nhen', 'spiderman'], name: 'Spider-Man' },
                    { keywords: ['interstellar', 'ho den', 'tu than'], name: 'Interstellar' },
                    { keywords: ['batman', 'ky si bong dem', 'dark knight', 'joker'], name: 'Kỵ Sĩ Bóng Đêm' },
                    { keywords: ['inception', 'danh cap giac mo', 'giac mo'], name: 'Inception' },
                    { keywords: ['godzilla', 'kong', 'de che moi', 'quai thu'], name: 'Godzilla x Kong' },
                    { keywords: ['phim mai', 'mai tran thanh'], name: 'Mai' },
                    { keywords: ['your name', 'ten cau la gi', 'taki', 'mitsuha'], name: 'Your Name' },
                    { keywords: ['exhuma', 'quat mo', 'trung phung', 'dao mo'], name: 'Exhuma' },
                    { keywords: ['avengers', 'endgame', 'hoi ket', 'marvel'], name: 'Avengers' },
                ];

                for (const item of movieKeywords) {
                    if (item.keywords.some((kw) => checkWordMatch(cleanMsg, kw))) {
                        const found = allMovies.find((m) => m.name.toLowerCase().includes(item.name.toLowerCase()));
                        if (found) matchedMovies.push(found);
                    }
                }
            }

            // Remove duplicates
            matchedMovies = Array.from(new Set(matchedMovies.map((m) => m.id))).map((id) =>
                allMovies.find((m) => m.id === id)
            );

            // Filter by genre if user asks for specific genre
            let genreFilteredMovies = [];
            if (isAnimation) {
                genreFilteredMovies = allMovies.filter((m) =>
                    /hoạt hình|panda|inside out|your name/i.test(`${m.category} ${m.name}`)
                );
            } else if (isAction) {
                genreFilteredMovies = allMovies.filter((m) =>
                    /hành động|deadpool|godzilla|avengers|batman|dark knight/i.test(`${m.category} ${m.name}`)
                );
            } else if (isSciFi) {
                genreFilteredMovies = allMovies.filter((m) =>
                    /viễn tưởng|avatar|dune|interstellar|inception/i.test(`${m.category} ${m.name}`)
                );
            } else if (isHorror) {
                genreFilteredMovies = allMovies.filter((m) =>
                    /kinh dị|exhuma|quật mộ/i.test(`${m.category} ${m.name}`)
                );
            } else if (isDrama) {
                genreFilteredMovies = allMovies.filter((m) =>
                    /tâm lý|tình cảm|mai|oppenheimer/i.test(`${m.category} ${m.name}`)
                );
            }

            // 4. Construct response message and actions
            let responseText = '';
            let returnMovies = [];
            let actions = [];
            let seatInfo = null;

            // Check if user specifically requested a movie that DOES NOT exist in DB
            const isAskingForSpecificNonExistentMovie =
                matchedMovies.length === 0 &&
                genreFilteredMovies.length === 0 &&
                !isGreeting &&
                !isNowShowing &&
                !isBookingInquiry &&
                !isPriceQuery &&
                !isSnackQuery &&
                !isVoiceHelpQuery &&
                cleanMsg.length > 4;

            if (isVoiceHelpQuery) {
                responseText = `🎙️ **Hướng dẫn sử dụng giọng nói dành cho bạn:**\n\n1. Bạn chỉ cần nhấn vào biểu tượng **Micro màu đỏ** 🔴 ở góc dưới ô trò chuyện.\n2. Hãy nói rõ tên phim hoặc câu hỏi của bạn (ví dụ: *"Hôm nay có phim gì chiếu"*, *"Giá vé bao nhiêu"*, *"Tôi muốn đặt vé phim Mai"*).\n3. Bạn có thể bấm vào biểu tượng **Loa 🔊** trên đầu chatbot để hệ thống tự động đọc to câu trả lời cho bạn nghe nhé!`;
                returnMovies = allMovies.slice(0, 3);
            } else if (matchedMovies.length > 0) {
                // Customer asks about a specific movie present in the theater
                const targetMovie = matchedMovies[0];
                returnMovies = matchedMovies.slice(0, 3);

                // Fetch real available seats count from database
                const availableSeats = await Seats.count({
                    where: {
                        movieId: targetMovie.id,
                        status: 'available',
                    },
                });

                seatInfo = {
                    movieId: targetMovie.id,
                    movieName: targetMovie.name,
                    availableCount: availableSeats,
                };

                const priceFormatted = Number(targetMovie.price || 95000).toLocaleString('vi-VN');
                responseText = `🎬 **Thông tin phim tại rạp: ${targetMovie.name}**\n\n• **Thể loại:** ${targetMovie.category}\n• **Thời lượng:** ${targetMovie.time || '120'} phút | **Chất lượng:** ${targetMovie.quality || 'HD'}\n• **Đạo diễn:** ${targetMovie.director || 'Đang cập nhật'}\n• **Diễn viên:** ${targetMovie.actor || 'Đang cập nhật'}\n• **Giá vé cơ bản:** ${priceFormatted} VNĐ\n• **Tình trạng:** Hiện còn **${availableSeats} ghế trống** tại rạp.\n\n*${targetMovie.description ? targetMovie.description.slice(0, 160) + '...' : ''}*`;

                actions.push({
                    type: 'book',
                    movieId: targetMovie.id,
                    label: `🎟️ Đặt vé ngay: ${targetMovie.name}`,
                });
                if (targetMovie.trailer_url) {
                    actions.push({
                        type: 'trailer',
                        movie: targetMovie,
                        label: `▶ Xem Trailer ${targetMovie.name}`,
                    });
                }
            } else if (genreFilteredMovies.length > 0) {
                // Customer asks by genre
                returnMovies = genreFilteredMovies.slice(0, 4);
                responseText = `🍿 Rạp StreamPhim hiện có **${genreFilteredMovies.length} bộ phim** rất hay thuộc thể loại này đang được trình chiếu:\n\n` +
                    genreFilteredMovies
                        .map((m, i) => `${i + 1}. **${m.name}** (${m.time || 110} phút) - ${Number(m.price || 95000).toLocaleString('vi-VN')}đ`)
                        .join('\n') +
                    `\n\nBạn có thể bấm **"Đặt vé ngay"** ở từng phim bên dưới để chọn suất chiếu và hàng ghế ưng ý nhé!`;

                genreFilteredMovies.slice(0, 3).forEach((m) => {
                    actions.push({
                        type: 'book',
                        movieId: m.id,
                        label: `🎟️ Đặt vé: ${m.name}`,
                    });
                });
            } else if (isAskingForSpecificNonExistentMovie) {
                // STRICT ANTI-HALLUCINATION: Inform truthfully that theater currently doesn't show this movie
                responseText = `Dạ hiện tại rạp StreamPhim **chưa có lịch chiếu** cho yêu cầu "*${rawMsg}*" của bạn ạ.\n\nRạp cam kết cung cấp đúng thông tin thực tế đang chiếu. Dưới đây là các siêu phẩm điện ảnh đang chiếu rất hot tại rạp hôm nay, bạn xem thử nhé:`;
                returnMovies = allMovies.slice(0, 4);
                allMovies.slice(0, 3).forEach((m) => {
                    actions.push({
                        type: 'book',
                        movieId: m.id,
                        label: `🎟️ Đặt vé: ${m.name}`,
                    });
                });
            } else if (isPriceQuery) {
                responseText = `🎫 **Bảng giá vé và chính sách ghế ngồi tại rạp StreamPhim:**\n\n• **Giá vé cơ bản:** từ **85.000đ - 110.000đ** (tùy theo phim 2D/3D).\n• **Hàng A - B (VIP đầu):** phụ thu +25.000đ - 30.000đ (góc nhìn cận cảnh, âm thanh sống động).\n• **Hàng C - D:** phụ thu +10.000đ - 15.000đ.\n• **Hàng E:** Giá vé tiêu chuẩn theo phim.\n• **Hàng F - G:** Giảm trực tiếp 5.000đ - 10.000đ/vé.\n\nBạn hãy bấm vào nút "Đặt vé" ở bộ phim muốn xem bên dưới để trực tiếp chọn vị trí ghế nhé!`;
                returnMovies = allMovies.slice(0, 3);
                allMovies.slice(0, 2).forEach((m) => {
                    actions.push({
                        type: 'book',
                        movieId: m.id,
                        label: `🎟️ Đặt vé: ${m.name}`,
                    });
                });
            } else if (isSnackQuery) {
                responseText = `🍿 **Menu Bắp Nước Thơm Ngon Tại Rạp:**\n\n• **Bắp rang bơ:** Vị Bơ truyền thống, Phô mai, hoặc Caramel thơm giòn ngọt ngào.\n• **Nước ngọt mát lạnh:** Coca-Cola, Pepsi, Sprite, Fanta, Nước suối Dasani.\n• **Combo Siêu Tiết Kiệm:**\n  - *Combo Đơn (1 Bắp + 1 Nước):* 65.000đ\n  - *Combo Đôi (1 Bắp lớn + 2 Nước):* 95.000đ\n  - *Combo VIP Gia Đình:* 139.000đ\n\n*Sau khi bạn chọn ghế xem phim, hệ thống sẽ cho bạn chọn thêm combo bắp nước rất tiện lợi ạ!*`;
                returnMovies = allMovies.slice(0, 3);
            } else if (isBookingInquiry) {
                responseText = `💺 **Quy trình đặt vé xem phim rất đơn giản:**\n\n1. Chọn bộ phim bạn muốn xem từ danh sách bên dưới.\n2. Bấm vào nút **"Đặt vé ngay"**.\n3. Chọn ngày chiếu, giờ chiếu và phòng chiếu phù hợp.\n4. Chọn các vị trí ghế ngồi yêu thích trên sơ đồ ghế.\n5. Chọn thêm bắp nước (nếu muốn) và xác nhận thanh toán an toàn qua MoMo/VNPay hoặc quầy vé!`;
                returnMovies = allMovies.slice(0, 4);
                allMovies.slice(0, 3).forEach((m) => {
                    actions.push({
                        type: 'book',
                        movieId: m.id,
                        label: `🎟️ Đặt vé: ${m.name}`,
                    });
                });
            } else if (isNowShowing || isGreeting) {
                responseText = `Xin chào quý khách! 👋 Em là Trợ lý AI của rạp chiếu phim **StreamPhim**.\n\nHiện tại rạp đang có **${allMovies.length} bộ phim đặc sắc** với đầy đủ các thể loại:\n• **Hành động bom tấn:** Deadpool & Wolverine, Dune 2, Avengers, Godzilla x Kong\n• **Khoa học viễn tưởng:** Avatar 2, Interstellar, Inception\n• **Gia đình / Hoạt hình:** Kung Fu Panda 4, Inside Out 2, Your Name\n• **Tâm lý / Tình cảm / Kinh dị:** Mai, Oppenheimer, Exhuma (Quật Mộ Trùng Phùng)\n\nQuý khách muốn xem phim gì hoặc cần em hỗ trợ chọn ghế, cứ nhắn hoặc bấm nút Micro 🎙️ để nói nhé!`;
                returnMovies = allMovies.slice(0, 4);
                allMovies.slice(0, 3).forEach((m) => {
                    actions.push({
                        type: 'book',
                        movieId: m.id,
                        label: `🎟️ Đặt vé: ${m.name}`,
                    });
                });
            } else {
                // General query
                responseText = `Dạ em đã nhận được yêu cầu của quý khách: "*${rawMsg}*".\n\nĐể trải nghiệm điện ảnh trọn vẹn nhất, quý khách có thể tham khảo danh sách phim đang chiếu tại rạp bên dưới hoặc bấm nút Micro 🎙️ để nói trực tiếp tên bộ phim muốn tìm nhé!`;
                returnMovies = allMovies.slice(0, 4);
                allMovies.slice(0, 3).forEach((m) => {
                    actions.push({
                        type: 'book',
                        movieId: m.id,
                        label: `🎟️ Đặt vé: ${m.name}`,
                    });
                });
            }

            return new OK({
                message: 'Thành công',
                metadata: {
                    message: responseText,
                    movies: returnMovies.length > 0 ? returnMovies : allMovies.slice(0, 3),
                    seats: seatInfo ? [seatInfo] : null,
                    actions: actions.length > 0 ? actions : null,
                },
            }).send(res);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = ChatbotController;
