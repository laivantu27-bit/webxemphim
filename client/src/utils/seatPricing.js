/**
 * Cấu hình giá ghế theo từng hàng (Frontend):
 * Hàng A, B: Ngồi đầu, giá cao nhất (VIP Front)
 * Hàng C, D: Hàng trung tâm, giá vừa
 * Hàng E, F, G: Hàng ngồi sau, giá tiết kiệm hơn
 */
export const ROW_PRICE_CONFIG = {
    A: {
        name: 'VIP Hàng Đầu',
        description: 'Trải nghiệm màn chiếu cận cảnh',
        extra: 30000,
        tag: 'VIP Đầu',
        borderColor: '#f59e0b',
        bgColor: '#78350f',
        badgeClass: 'bg-amber-500 text-amber-950',
    },
    B: {
        name: 'VIP Hàng Đầu',
        description: 'Gần màn hình cực nét',
        extra: 25000,
        tag: 'VIP Đầu',
        borderColor: '#d97706',
        bgColor: '#78350f',
        badgeClass: 'bg-amber-600 text-amber-950',
    },
    C: {
        name: 'Ghế Trung Tâm',
        description: 'Góc nhìn chuẩn âm thanh sống động',
        extra: 15000,
        tag: 'Trung Tâm',
        borderColor: '#8b5cf6',
        bgColor: '#4c1d95',
        badgeClass: 'bg-purple-500 text-purple-950',
    },
    D: {
        name: 'Ghế Trung Tâm',
        description: 'Góc nhìn chính diện',
        extra: 10000,
        tag: 'Trung Tâm',
        borderColor: '#7c3aed',
        bgColor: '#4c1d95',
        badgeClass: 'bg-purple-600 text-purple-950',
    },
    E: {
        name: 'Ghế Tiêu Chuẩn',
        description: 'Giá gốc niêm yết',
        extra: 0,
        tag: 'Tiêu Chuẩn',
        borderColor: '#3b82f6',
        bgColor: '#1e3a8a',
        badgeClass: 'bg-blue-500 text-blue-950',
    },
    F: {
        name: 'Ghế Hàng Sau',
        description: 'Bao quát toàn cảnh rạp',
        extra: -5000,
        tag: 'Hàng Sau',
        borderColor: '#10b981',
        bgColor: '#064e3b',
        badgeClass: 'bg-emerald-500 text-emerald-950',
    },
    G: {
        name: 'Ghế Tiết Kiệm',
        description: 'Hàng cuối phòng, giá tốt nhất',
        extra: -10000,
        tag: 'Tiết Kiệm',
        borderColor: '#14b8a6',
        bgColor: '#134e4a',
        badgeClass: 'bg-teal-500 text-teal-950',
    },
};

/**
 * Tính giá cho 1 ghế dựa trên giá gốc của phim và mã ghế
 */
export function getSeatPrice(basePrice, seatCode) {
    if (!seatCode) return parseInt(basePrice || 0, 10);
    const row = seatCode.charAt(0).toUpperCase();
    const config = ROW_PRICE_CONFIG[row] || { extra: 0 };
    const price = parseInt(basePrice || 0, 10) + config.extra;
    return Math.max(10000, price);
}

/**
 * Tính tổng tiền vé cho danh sách ghế
 */
export function calculateSeatsTotal(basePrice, seatCodes = []) {
    if (!Array.isArray(seatCodes)) return 0;
    return seatCodes.reduce((sum, code) => sum + getSeatPrice(basePrice, code), 0);
}

