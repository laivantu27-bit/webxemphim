const User = require('../models/users.model');

const LEVEL_THRESHOLDS = {
    Bronze: { min: 0, max: 499, next: 'Silver', nextXP: 500 },
    Silver: { min: 500, max: 1499, next: 'Gold', nextXP: 1500 },
    Gold: { min: 1500, max: 3999, next: 'Diamond', nextXP: 4000 },
    Diamond: { min: 4000, max: Infinity, next: null, nextXP: null },
};

/**
 * Tính toán cấp bậc dựa trên điểm XP
 */
function calculateLevel(xp) {
    if (xp >= 4000) return 'Diamond';
    if (xp >= 1500) return 'Gold';
    if (xp >= 500) return 'Silver';
    return 'Bronze';
}

/**
 * Cộng hoặc trừ điểm XP của user và tự động nâng cấp bậc
 */
async function updateUserXPAndLevel(userId, xpDelta, reason = 'Hoạt động') {
    if (!userId) return null;
    try {
        const user = await User.findOne({ where: { id: userId } });
        if (!user) return null;

        const currentXP = Number(user.xpPoints || 0);
        const newXP = Math.max(0, currentXP + xpDelta);
        const newLevel = calculateLevel(newXP);

        // Lưu lịch sử điểm thưởng
        let history = [];
        try {
            if (user.rewardsHistory) {
                history = typeof user.rewardsHistory === 'string' ? JSON.parse(user.rewardsHistory) : user.rewardsHistory;
            }
        } catch (e) {
            history = [];
        }

        history.unshift({
            delta: xpDelta,
            reason: reason,
            newXP: newXP,
            timestamp: new Date().toISOString(),
        });

        // Giới hạn lưu 50 mục lịch sử gần nhất
        if (history.length > 50) history = history.slice(0, 50);

        user.xpPoints = newXP;
        user.level = newLevel;
        user.rewardsHistory = JSON.stringify(history);

        await user.save();

        return {
            userId: user.id,
            xpPoints: newXP,
            level: newLevel,
            delta: xpDelta,
        };
    } catch (err) {
        console.error('Error in updateUserXPAndLevel:', err);
        return null;
    }
}

/**
 * Lấy chi tiết thông tin Level và tiến độ của người dùng
 */
function getXPProgress(user) {
    const xp = Number(user.xpPoints || 0);
    const level = user.level || calculateLevel(xp);
    const config = LEVEL_THRESHOLDS[level] || LEVEL_THRESHOLDS.Bronze;

    let progress = 100;
    if (config.nextXP) {
        const currentTierBase = config.min;
        const tierSpan = config.nextXP - currentTierBase;
        const progressInTier = xp - currentTierBase;
        progress = Math.min(100, Math.max(0, Math.round((progressInTier / tierSpan) * 100)));
    }

    return {
        xpPoints: xp,
        level: level,
        nextLevel: config.next,
        nextLevelXP: config.nextXP,
        progress: progress,
        studentVerified: !!user.studentVerified,
        studentSchool: user.studentSchool || null,
        studentIdImage: user.studentIdImage || null,
    };
}

module.exports = {
    calculateLevel,
    updateUserXPAndLevel,
    getXPProgress,
    LEVEL_THRESHOLDS,
};

