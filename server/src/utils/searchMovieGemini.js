require('dotenv').config();
const { Op } = require('sequelize');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const modelMovie = require('../models/movie.model');

// Hàm loại bỏ dấu tiếng Việt để tìm kiếm không dấu
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

/**
 * Tìm kiếm phim trực tiếp từ database (nhanh, chính xác, không phụ thuộc API bên thứ 3)
 */
async function searchMovieDatabase(query) {
    const rawQuery = (query || '').trim();
    if (!rawQuery) {
        return await modelMovie.findAll({
            limit: 10,
            order: [['createdAt', 'DESC']],
        });
    }

    const cleanQuery = removeVietnameseTones(rawQuery);

    // 1. Tìm bằng SQL iLike trên các trường có thể
    const sqlMatches = await modelMovie.findAll({
        where: {
            [Op.or]: [
                { name: { [Op.iLike]: `%${rawQuery}%` } },
                { actor: { [Op.iLike]: `%${rawQuery}%` } },
                { director: { [Op.iLike]: `%${rawQuery}%` } },
                { country: { [Op.iLike]: `%${rawQuery}%` } },
                { description: { [Op.iLike]: `%${rawQuery}%` } },
            ],
        },
        limit: 15,
        order: [['createdAt', 'DESC']],
    });

    if (sqlMatches.length > 0) {
        return sqlMatches;
    }

    // 2. Nếu SQL iLike không ra (do gõ không dấu hoặc khác biệt dấu), tải toàn bộ phim và so khớp không dấu
    const allMovies = await modelMovie.findAll();
    const matched = allMovies.filter((movie) => {
        const nameClean = removeVietnameseTones(movie.name || '');
        const actorClean = removeVietnameseTones(movie.actor || '');
        const directorClean = removeVietnameseTones(movie.director || '');
        const descClean = removeVietnameseTones(movie.description || '');
        const countryClean = removeVietnameseTones(movie.country || '');

        return (
            nameClean.includes(cleanQuery) ||
            cleanQuery.includes(nameClean) ||
            actorClean.includes(cleanQuery) ||
            directorClean.includes(cleanQuery) ||
            descClean.includes(cleanQuery) ||
            countryClean.includes(cleanQuery)
        );
    });

    if (matched.length > 0) {
        return matched.slice(0, 15);
    }

    // 3. So khớp theo từng từ nếu gõ nhiều từ (VD: "nguoi nhen", "ho den")
    const words = cleanQuery.split(/\s+/).filter((w) => w.length > 1);
    if (words.length > 1) {
        const wordMatched = allMovies.filter((movie) => {
            const nameClean = removeVietnameseTones(movie.name || '');
            return words.every((w) => nameClean.includes(w));
        });
        if (wordMatched.length > 0) {
            return wordMatched.slice(0, 15);
        }
    }

    return [];
}

/**
 * Hàm tìm kiếm phim chính (kết hợp Database + AI dự phòng nếu có key hợp lệ)
 */
async function searchMovieGemini(name) {
    try {
        // Luôn tìm kiếm database trước để có kết quả ngay lập tức
        const dbResults = await searchMovieDatabase(name);
        if (dbResults.length > 0) {
            return dbResults;
        }

        // Nếu database chưa thấy và có Google AI Key hợp lệ thì thử AI
        const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
        const isDefaultExpiredKey = apiKey === 'AIzaSyDgrMo2nvE-wPTFaYo_WmXb1eKSJlrHrWU' || apiKey === 'AIzaSyAzPPJgXsITzmcvMpYByAODGnSoTEv4kwI';

        if (apiKey && !isDefaultExpiredKey) {
            try {
                const genAI = new GoogleGenerativeAI(apiKey);
                const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
                const movies = await modelMovie.findAll({});

                const prompt = `Bạn là trợ lý tìm kiếm phim. 
Danh sách phim hiện có: ${JSON.stringify(movies.map((m) => ({ id: m.id, name: m.name, actor: m.actor, director: m.director })))}
Từ khóa tìm kiếm: "${name}"
Hãy trả về CHỈ MỘT MẢNG JSON chứa các ID của phim phù hợp. Ví dụ: ["uuid-1", "uuid-2"]. Nếu không có phim nào trả về []. Không thêm chữ nào khác.`;

                const response = await model.generateContent(prompt);
                let text = response.response.text().replace(/```json|```/g, '').trim();
                const matchedIds = JSON.parse(text);

                if (Array.isArray(matchedIds) && matchedIds.length > 0) {
                    const foundMovies = await modelMovie.findAll({
                        where: { id: matchedIds },
                    });
                    if (foundMovies.length > 0) return foundMovies;
                }
            } catch (aiErr) {
                console.log('Gemini search fallback notice:', aiErr.message);
            }
        }

        return dbResults;
    } catch (error) {
        console.error('Error in searchMovie:', error);
        // Tuyệt đối không throw lỗi làm crash request, fallback tìm kiếm database
        try {
            return await searchMovieDatabase(name);
        } catch (dbErr) {
            return [];
        }
    }
}

module.exports = searchMovieGemini;
