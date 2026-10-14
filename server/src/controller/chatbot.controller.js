const { GoogleGenerativeAI } = require('@google/generative-ai');
const { Op } = require('sequelize');
const Movies = require('../models/movie.model');
const Seats = require('../models/seat.model');
const Category = require('../models/category.model');
const { OK } = require('../core/success.response');
const { BadRequestError } = require('../core/error.response');

function removeVietnameseTones(str) {
    if (!str) return '';
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .toLowerCase()
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

            // Fetch all current movies for comprehensive matching
            const allMovies = await Movies.findAll({
                order: [['createdAt', 'DESC']],
            });

            // 1. Check intent
            const isGreeting = /^(chào|xin chào|hello|hi|alo|hé lô|hey|hi bot|chao ban|halo)/i.test(lowerMsg);
            const isBooking = /(đặt vé|mua vé|đặt ghế|chọn ghế|còn ghế|ghế trống|xem ghế|book vé|mua ve|dat ve|dat ghe)/i.test(lowerMsg) ||
                              /(dat ve|mua ve|dat ghe|con ghe|ghe trong)/i.test(cleanMsg);
            const isPriceQuery = /(giá vé|bao nhiêu tiền|vé bao nhiêu|bảng giá|gia ve|bao nhieu tien)/i.test(lowerMsg) ||
                                 /(gia ve|bao nhieu tien)/i.test(cleanMsg);
            const isSnackQuery = /(bắp|bắp rang|nước ngọt|combo|bỏng ngô|đồ ăn|bap rang|nuoc ngot|an kem)/i.test(lowerMsg) ||
                                 /(bap|nuoc ngot|combo|an uong)/i.test(cleanMsg);
            const isHelpQuery = /(hướng dẫn|cách đặt|làm sao|giúp đỡ|trợ giúp|huong dan|cach dat)/i.test(lowerMsg) ||
                                /(huong dan|cach dat|tro giup)/i.test(cleanMsg);
            const isNowShowing = /(phim đang chiếu|phim moi|phim hot|dang chieu|co phim gi|phim gi hay|co nhung phim gi)/i.test(cleanMsg);

            // 2. Identify mentioned movie if any
            let matchedMovies = [];
            for (const movie of allMovies) {
                const movieNameClean = removeVietnameseTones(movie.name);
                const movieDescClean = removeVietnameseTones(movie.description || '');
                const movieActorClean = removeVietnameseTones(movie.actor || '');
                const movieDirectorClean = removeVietnameseTones(movie.director || '');

                // Check exact or partial match with movie title
                if (cleanMsg.includes(movieNameClean) || movieNameClean.includes(cleanMsg)) {
                    matchedMovies.push(movie);
                } else if (cleanMsg.length > 3 && (movieActorClean.includes(cleanMsg) || movieDirectorClean.includes(cleanMsg) || movieDescClean.includes(cleanMsg))) {
                    matchedMovies.push(movie);
                }
            }

            // If no match by full phrase, try word intersection
            if (matchedMovies.length === 0 && !isGreeting && !isSnackQuery && !isHelpQuery) {
                const words = cleanMsg.split(/\s+/).filter(w => w.length > 2 && !['phim', 'xem', 'chieu', 'rap', 'muon', 'co', 'nay', 'hay', 'khong', 'cho'].includes(w));
                if (words.length > 0) {
                    matchedMovies = allMovies.filter(movie => {
                        const nameC = removeVietnameseTones(movie.name);
                        return words.some(w => nameC.includes(w));
                    });
                }
            }

            // Remove duplicates
            matchedMovies = Array.from(new Set(matchedMovies.map(m => m.id)))
                .map(id => allMovies.find(m => m.id === id));

            // Default movies to show (trending/newest) if user asks for movies or greeting
            const displayMovies = matchedMovies.length > 0 ? matchedMovies.slice(0, 4) : (isNowShowing || isGreeting ? allMovies.slice(0, 4) : null);

            // Check available seats for matched movie if booking inquiry
            let seatInfo = null;
            let actions = [];

            if (displayMovies && displayMovies.length > 0) {
                // Add booking actions for displayed movies
                displayMovies.forEach(m => {
                    actions.push({
                        type: 'book',
                        movieId: m.id,
                        label: `🎟️ Đặt vé: ${m.name}`
                    });
                });

                if (isBooking) {
                    const targetMovie = displayMovies[0];
                    const availableSeatCount = await Seats.count({
                        where: {
                            movieId: targetMovie.id,
                            status: 'available',
                        }
                    });

                    seatInfo = {
                        movieId: targetMovie.id,
                        movieName: targetMovie.name,
                        availableCount: availableSeatCount,
                    };
                }
            }

            // Try Gemini AI first if API key configured
            let aiResponseText = '';
            const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
            let geminiSuccess = false;

            if (apiKey && apiKey !== 'AIzaSyAzPPJgXsITzmcvMpYByAODGnSoTEv4kwI') {
                try {
                    const genAI = new GoogleGenerativeAI(apiKey);
                    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

                    const movieContext = allMovies.map(m =>
                        `- Tên: ${m.name} | Thể loại: ${m.category} | Thời lượng: ${m.time} | Năm: ${m.year} | Giá vé: ${Number(m.price || 0).toLocaleString()}đ | Diễn viên: ${m.actor || 'N/A'}`
                    ).join('\n');

                    const systemPrompt = `Bạn là trợ lý AI thông minh, thân thiện của rạp chiếu phim StreamPhim.
Bạn luôn trả lời bằng tiếng Việt lịch sự, nhiệt tình và ngắn gọn.
Bạn hỗ trợ:
1. Tìm kiếm phim theo tên, thể loại, diễn viên, đạo diễn.
2. Hướng dẫn chọn suất chiếu, đặt ghế cho khách hàng.
3. Giải đáp về giá vé, bắp nước combo tại rạp.

Danh sách phim hiện có tại rạp:
${movieContext}

Khách hỏi: "${rawMsg}"
Hãy trả lời khách ngắn gọn, thân thiện (dưới 4 câu) và gợi ý khách bấm nút Đặt vé bên dưới nếu thấy phù hợp.`;

                    const result = await model.generateContent(systemPrompt);
                    aiResponseText = result.response.text();
                    geminiSuccess = true;
                } catch (geminiError) {
                    console.log('Gemini AI fallback activated:', geminiError.message);
                }
            }

            // Smart Rule-Based Engine (Fallback or Default)
            if (!geminiSuccess) {
                if (isGreeting) {
                    aiResponseText = `Xin chào bạn! 👋 Tôi là trợ lý AI của rạp StreamPhim.\nTôi có thể giúp bạn tìm kiếm phim yêu thích, kiểm tra lịch chiếu và hỗ trợ đặt ghế xem phim nhanh chóng. Dưới đây là một số phim hot đang chiếu tại rạp:`;
                    if (!actions.length && allMovies.length > 0) {
                        actions = allMovies.slice(0, 3).map(m => ({
                            type: 'book',
                            movieId: m.id,
                            label: `🎟️ Đặt vé: ${m.name}`
                        }));
                    }
                } else if (isBooking) {
                    if (seatInfo && seatInfo.availableCount > 0) {
                        aiResponseText = `🎬 Phim "${seatInfo.movieName}" hiện đang còn ${seatInfo.availableCount} ghế trống!\nBạn có thể bấm vào nút "Đặt vé ngay" bên dưới để chọn hàng ghế và vị trí yêu thích nhé.`;
                    } else if (displayMovies && displayMovies.length > 0) {
                        aiResponseText = `Dưới đây là các phim bạn có thể đặt vé ngay hôm nay. Hãy bấm "Đặt vé" tại phim bạn muốn xem để chọn phòng chiếu, ngày giờ và vị trí ghế nhé!`;
                    } else {
                        aiResponseText = `Bạn muốn đặt vé xem phim nào ạ? Hãy nói tên phim hoặc chọn từ danh sách phim đang chiếu bên dưới để tôi hỗ trợ kiểm tra ghế nhé!`;
                        actions = allMovies.slice(0, 3).map(m => ({
                            type: 'book',
                            movieId: m.id,
                            label: `🎟️ Đặt vé: ${m.name}`
                        }));
                    }
                } else if (isPriceQuery) {
                    aiResponseText = `🎫 Giá vé tại StreamPhim dao động từ 85.000đ - 130.000đ tùy theo phim và định dạng (2D, 3D, IMAX).\nBạn có thể xem chi tiết giá vé ở từng phim bên dưới và bấm Đặt vé để chọn ghế nha!`;
                } else if (isSnackQuery) {
                    aiResponseText = `🍿 StreamPhim có đầy đủ dịch vụ bắp nước thơm ngon:\n- Bắp rang bơ (Phô mai, Caramel, Bơ truyền thống)\n- Nước ngọt (Coca, Pepsi, Sprite, 7Up)\n- Combo Siêu Tiết Kiệm (Bắp + Nước) chỉ từ 65.000đ!\nSau khi chọn ghế xem phim, bạn có thể chọn thêm bắp nước trực tiếp trên trang đặt vé nhé.`;
                } else if (isHelpQuery) {
                    aiResponseText = `💡 Hướng dẫn đặt vé tại StreamPhim:\n1. Chọn bộ phim bạn yêu thích.\n2. Bấm "Đặt vé" để chọn ngày, suất chiếu và phòng chiếu.\n3. Chọn số lượng ghế và vị trí ghế mong muốn.\n4. Chọn thêm bắp nước (nếu có nhu cầu).\n5. Thanh toán tiện lợi qua MoMo, VNPay hoặc Thanh toán tại quầy!`;
                } else if (displayMovies && displayMovies.length > 0) {
                    aiResponseText = `Tôi đã tìm thấy ${displayMovies.length} bộ phim phù hợp với yêu cầu của bạn:`;
                } else {
                    aiResponseText = `Xin lỗi, tôi chưa tìm thấy phim nào khớp với từ khóa "${rawMsg}". Bạn có thể tham khảo các bộ phim đang được yêu thích nhất tại rạp bên dưới:`;
                    actions = allMovies.slice(0, 3).map(m => ({
                        type: 'book',
                        movieId: m.id,
                        label: `🎟️ Đặt vé: ${m.name}`
                    }));
                }
            }

            return new OK({
                message: 'Thành công',
                metadata: {
                    message: aiResponseText,
                    movies: displayMovies && displayMovies.length > 0 ? displayMovies : allMovies.slice(0, 3),
                    seats: seatInfo ? [seatInfo] : null,
                    actions: actions.length > 0 ? actions : null,
                }
            }).send(res);

        } catch (error) {
            next(error);
        }
    }
}

module.exports = ChatbotController;
