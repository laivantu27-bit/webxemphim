import React, { useState } from 'react';
import { Progress, Tag, Button, Modal, message, Row, Col, Card } from 'antd';
import {
    TrophyOutlined,
    CrownOutlined,
    GiftOutlined,
    CheckCircleFilled,
    FireOutlined,
    StarFilled,
    CoffeeOutlined,
} from '@ant-design/icons';
import { requestRedeemReward } from '../../../config/request';

const TIER_DETAILS = {
    Bronze: {
        name: 'Thành viên Bronze (Đồng)',
        color: '#cd7f32',
        gradient: 'from-amber-800 to-amber-950',
        border: 'border-amber-700',
        badge: 'Hạng Đồng',
        benefits: [
            'Tích lũy 100 XP cho mỗi vé xem phim',
            'Tích lũy 50 XP cho mỗi đánh giá phim',
            'Nhận thông báo ưu đãi và suất chiếu sớm',
        ],
    },
    Silver: {
        name: 'Thành viên Silver (Bạc)',
        color: '#a0aec0',
        gradient: 'from-slate-600 to-slate-900',
        border: 'border-slate-400',
        badge: 'Hạng Bạc',
        benefits: [
            'Giảm ngay 5% giá vé cho mọi suất chiếu',
            'Miễn phí nâng cấp kích cỡ bắp rang bơ (M → L)',
            'Ưu tiên giữ chỗ ngồi đẹp khi đặt vé online',
            'Tích điểm thưởng x1.2 lần',
        ],
    },
    Gold: {
        name: 'Thành viên Gold (Vàng)',
        color: '#f59e0b',
        gradient: 'from-amber-600 to-yellow-950',
        border: 'border-yellow-500',
        badge: 'Hạng Vàng',
        benefits: [
            'Giảm ngay 10% giá vé xem phim',
            'Tặng 1 Combo Bắp Nước miễn phí mỗi tháng',
            'Lối đi ưu tiên tại quầy vé và quầy bắp nước',
            'Tặng vé xem phim miễn phí vào tuần lễ sinh nhật',
        ],
    },
    Diamond: {
        name: 'Thành viên Diamond (Kim Cương)',
        color: '#38bdf8',
        gradient: 'from-sky-700 via-indigo-900 to-purple-950',
        border: 'border-cyan-400',
        badge: 'Hạng Kim Cương',
        benefits: [
            'Giảm tối đa 15% toàn bộ vé và dịch vụ',
            'Tặng 2 Combo Bắp Nước khổng lồ miễn phí mỗi tháng',
            'Trải nghiệm phòng chiếu VIP & giường nằm cao cấp',
            'Vé xem phim miễn phí vào ngày sinh nhật',
            'Hỗ trợ đặc quyền từ quản lý rạp 24/7',
        ],
    },
};

const REDEEM_OPTIONS = [
    {
        key: 'free_drink',
        title: 'Cốc Nước Ngọt Miễn Phí',
        desc: 'Đổi 1 cốc nước ngọt mát lạnh (Coca/Pepsi) tại quầy',
        cost: 200,
        icon: <CoffeeOutlined className="text-blue-400 text-2xl" />,
        color: 'border-blue-500/40 bg-blue-500/10',
    },
    {
        key: 'free_snack',
        title: 'Gói Bim Bim / Snack Bỏng Ngô',
        desc: 'Đổi 1 gói bim bim hoặc snack bỏng ngô giòn tan',
        cost: 300,
        icon: <GiftOutlined className="text-yellow-400 text-2xl" />,
        color: 'border-yellow-500/40 bg-yellow-500/10',
    },
    {
        key: 'voucher_20k',
        title: 'Voucher Giảm 20.000 VNĐ',
        desc: 'Giảm 20.000đ khi thanh toán vé xem phim tiếp theo',
        cost: 500,
        icon: <TrophyOutlined className="text-emerald-400 text-2xl" />,
        color: 'border-emerald-500/40 bg-emerald-500/10',
    },
    {
        key: 'voucher_50k',
        title: 'Voucher Giảm 50.000 VNĐ',
        desc: 'Giảm 50.000đ khi thanh toán vé xem phim tiếp theo',
        cost: 1000,
        icon: <CrownOutlined className="text-purple-400 text-2xl" />,
        color: 'border-purple-500/40 bg-purple-500/10',
    },
];

function UserLoyaltyCard({ xpInfo, onRefresh }) {
    const [redeeming, setRedeeming] = useState(false);
    const [rewardResult, setRewardResult] = useState(null);

    const currentLevel = xpInfo?.level || 'Bronze';
    const tierConfig = TIER_DETAILS[currentLevel] || TIER_DETAILS.Bronze;
    const xpPoints = Number(xpInfo?.xpPoints || 0);

    const handleRedeem = async (opt) => {
        if (xpPoints < opt.cost) {
            message.warning(`Bạn cần có tối thiểu ${opt.cost} XP để đổi ưu đãi này (Hiện có: ${xpPoints} XP)`);
            return;
        }

        setRedeeming(true);
        try {
            const res = await requestRedeemReward({ rewardType: opt.key });
            setRewardResult(res.metadata);
            message.success(res?.message || 'Đổi ưu đãi thành công!');
            if (onRefresh) onRefresh();
        } catch (error) {
            message.error(error?.response?.data?.message || 'Lỗi khi đổi ưu đãi');
        } finally {
            setRedeeming(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* VIP Card Graphic */}
            <div
                className={`relative rounded-3xl p-8 overflow-hidden shadow-2xl bg-gradient-to-tr ${tierConfig.gradient} border-2 ${tierConfig.border}`}
            >
                {/* Background decorative circles */}
                <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-white/5 blur-2xl pointer-events-none" />
                <div className="absolute right-8 bottom-4 text-white/10 text-8xl pointer-events-none font-black">
                    VIP
                </div>

                <div className="relative z-10 flex flex-col justify-between min-h-[190px]">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-2">
                                <CrownOutlined className="text-yellow-400 text-xl" />
                                <span className="uppercase text-xs tracking-widest text-gray-300 font-bold">
                                    Thẻ Thành Viên CGV StreamPhim
                                </span>
                            </div>
                            <h2 className="text-2xl font-black text-white mt-1">
                                {tierConfig.name}
                            </h2>
                        </div>
                        <span className="bg-black/30 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-yellow-300 border border-yellow-400/30">
                            {tierConfig.badge}
                        </span>
                    </div>

                    <div className="mt-6">
                        <div className="flex justify-between items-baseline mb-1">
                            <span className="text-xs uppercase text-gray-300 font-semibold tracking-wider">
                                Điểm kinh nghiệm tích lũy (XP)
                            </span>
                            <span className="text-3xl font-black text-yellow-400 font-mono">
                                {xpPoints.toLocaleString()} <span className="text-sm font-normal text-white">XP</span>
                            </span>
                        </div>

                        {/* Progress Bar to next level */}
                        {xpInfo?.nextLevel ? (
                            <div>
                                <Progress
                                    percent={xpInfo?.progress || 0}
                                    status="active"
                                    strokeColor={{
                                        '0%': '#f59e0b',
                                        '100%': '#10b981',
                                    }}
                                    showInfo={false}
                                />
                                <div className="flex justify-between text-xs text-gray-300 mt-1">
                                    <span>{currentLevel}</span>
                                    <span>
                                        Còn {(xpInfo.nextLevelXP - xpPoints).toLocaleString()} XP để lên hạng{' '}
                                        <strong className="text-yellow-300">{xpInfo.nextLevel}</strong>
                                    </span>
                                    <span>{xpInfo.nextLevel}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="text-xs text-cyan-300 font-bold mt-1">
                                🌟 Bạn đã đạt cấp bậc Kim Cương cao quý nhất của hệ thống!
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Current Tier Perks */}
            <div className="bg-[#1f1f1f] rounded-2xl p-6 border border-gray-800 space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <StarFilled className="text-yellow-400" /> Đặc quyền hiện tại của bạn ({tierConfig.badge}):
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {tierConfig.benefits.map((b, i) => (
                        <div
                            key={i}
                            className="flex items-center gap-2.5 bg-[#282828] p-3 rounded-xl border border-gray-700/60"
                        >
                            <CheckCircleFilled className="text-emerald-400 flex-shrink-0" />
                            <span className="text-sm text-gray-200">{b}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Redeem Points for Snacks, Drinks and Vouchers */}
            <div className="bg-[#1f1f1f] rounded-2xl p-6 border border-gray-800 space-y-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <GiftOutlined className="text-red-500" /> Đổi Điểm Thưởng Lấy Ưu Đãi
                        </h3>
                        <p className="text-gray-400 text-xs">
                            Sử dụng điểm XP tích lũy để nhận bim bim, cốc nước ngọt miễn phí hoặc voucher giảm giá vé
                        </p>
                    </div>
                    <Tag color="gold" className="text-xs font-bold px-3 py-1">
                        Khả dụng: {xpPoints.toLocaleString()} XP
                    </Tag>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {REDEEM_OPTIONS.map((opt) => {
                        const canAfford = xpPoints >= opt.cost;
                        return (
                            <div
                                key={opt.key}
                                className={`rounded-xl p-4 border transition-all flex flex-col justify-between ${opt.color}`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="p-2.5 bg-black/30 rounded-xl flex-shrink-0">
                                        {opt.icon}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white text-sm">{opt.title}</h4>
                                        <p className="text-gray-300 text-xs mt-0.5">{opt.desc}</p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/10">
                                    <span className="text-yellow-400 font-extrabold text-sm font-mono">
                                        {opt.cost} XP
                                    </span>
                                    <Button
                                        size="small"
                                        type={canAfford ? 'primary' : 'default'}
                                        danger={canAfford}
                                        disabled={!canAfford}
                                        loading={redeeming}
                                        onClick={() => handleRedeem(opt)}
                                    >
                                        {canAfford ? 'Đổi Quà Ngay' : 'Chưa đủ điểm'}
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Redemption Success Modal */}
            <Modal
                open={!!rewardResult}
                onCancel={() => setRewardResult(null)}
                footer={null}
                centered
            >
                {rewardResult && (
                    <div className="p-4 text-center space-y-4">
                        <div className="w-16 h-16 mx-auto rounded-full bg-green-500/20 text-green-500 flex items-center justify-center text-3xl">
                            <CheckCircleFilled />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">
                            Đổi Quà Thành Công! 🎉
                        </h3>
                        <p className="text-gray-600 text-sm">
                            Bạn đã nhận thành công: <strong>{rewardResult.rewardName}</strong>
                        </p>
                        {rewardResult.code && (
                            <div className="bg-gray-100 p-3 rounded-xl border border-dashed border-gray-400">
                                <div className="text-xs text-gray-500">Mã đổi ưu đãi của bạn:</div>
                                <div className="font-mono text-xl font-black text-red-600 tracking-wider">
                                    {rewardResult.code}
                                </div>
                                <div className="text-[11px] text-gray-400 mt-1">
                                    Nhập mã này tại bước thanh toán vé hoặc đưa nhân viên tại quầy bắp nước
                                </div>
                            </div>
                        )}
                        <Button
                            type="primary"
                            block
                            onClick={() => setRewardResult(null)}
                            style={{ background: '#ef4444' }}
                        >
                            Đã hiểu & Tiếp tục
                        </Button>
                    </div>
                )}
            </Modal>
        </div>
    );
}

export default UserLoyaltyCard;

