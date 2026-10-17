/**
 * Cấu hình giá ghế theo từng hàng:
 * Hàng A, B: Ngồi đầu, giá cao nhất (VIP Front)
 * Hàng C, D: Hàng trung tâm, giá vừa
 * Hàng E, F, G: Hàng ngồi sau, giá tiết kiệm hơn
 */
const ROW_PRICE_CONFIG = {
    A: { name: 'VIP Hàng Đầu (Gần màn hình)', extra: 30000, tag: 'VIP Đầu' },
    B: { name: 'VIP Hàng Đầu', extra: 25000, tag: 'VIP Đầu' },
    C: { name: 'Ghế Trung Tâm (Tầm nhìn chuẩn)', extra: 15000, tag: 'Trung Tâm' },
    D: { name: 'Ghế Trung Tâm', extra: 10000, tag: 'Trung Tâm' },
    E: { name: 'Ghế Tiêu Chuẩn', extra: 0, tag: 'Tiêu Chuẩn' },
    F: { name: 'Ghế Hàng Sau', extra: -5000, tag: 'Hàng Sau' },
    G: { name: 'Ghế Tiết Kiệm (Cuối rạp)', extra: -10000, tag: 'Tiết Kiệm' },
};

/**
 * Tính giá cho một ghế dựa trên giá gốc của phim và mã ghế (VD: 'A1', 'E5')
 */
function getSeatPrice(basePrice, seatCode) {
    if (!seatCode) return parseInt(basePrice || 0, 10);
    const row = seatCode.charAt(0).toUpperCase();
    const config = ROW_PRICE_CONFIG[row] || { extra: 0 };
    const price = parseInt(basePrice || 0, 10) + config.extra;
    return Math.max(10000, price);
}

/**
 * Tính tổng tiền vé cho danh sách ghế
 */
function calculateSeatsTotal(basePrice, seatCodes = []) {
    if (!Array.isArray(seatCodes)) return 0;
    return seatCodes.reduce((sum, code) => sum + getSeatPrice(basePrice, code), 0);
}

module.exports = {
    ROW_PRICE_CONFIG,
    getSeatPrice,
    calculateSeatsTotal,
};

