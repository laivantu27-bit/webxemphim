import React, { useState, useEffect } from 'react';
import { Popover, Badge, Button, Tag, Empty, Divider, Space } from 'antd';
import {
    BellOutlined,
    CheckCircleOutlined,
    CalendarOutlined,
    ClockCircleOutlined,
    PrinterOutlined,
    DeleteOutlined,
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { requestGetPaymentByUserId } from '../../config/request';
import { useStore } from '../../hooks/useStore';
import styles from './NotificationDropdown.module.scss';

const NotificationDropdown = () => {
    const { dataUser } = useStore();
    const [notifications, setNotifications] = useState([]);
    const [open, setOpen] = useState(false);
    const [hasUnread, setHasUnread] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        loadNotifications();

        // Listen for new booking events
        const handleNewBooking = () => {
            loadNotifications();
            setHasUnread(true);
        };

        window.addEventListener('ticket_booked', handleNewBooking);
        window.addEventListener('storage', handleNewBooking);

        return () => {
            window.removeEventListener('ticket_booked', handleNewBooking);
            window.removeEventListener('storage', handleNewBooking);
        };
    }, [dataUser]);

    const loadNotifications = async () => {
        let combined = [];

        // 1. Get from localStorage (covers guests & instant purchases)
        try {
            const localSaved = JSON.parse(localStorage.getItem('streamphim_notifications') || '[]');
            if (Array.isArray(localSaved)) {
                combined = [...localSaved];
            }
        } catch (e) {}

        // 2. If logged in, fetch user payments from API
        if (dataUser && dataUser.id) {
            try {
                const res = await requestGetPaymentByUserId();
                const apiPayments = res?.metadata || [];
                apiPayments.forEach((p) => {
                    if (!combined.some((item) => item.id === p.id)) {
                        combined.push({
                            id: p.id,
                            movieName: p.movie?.name || 'Phim Chiếu Rạp',
                            moviePoster: p.movie?.poster_url || p.movie?.thumb_url,
                            seats: p.seatId,
                            totalPrice: p.totalPrice,
                            time: p.time,
                            date: p.date ? dayjs(p.date).format('DD/MM/YYYY') : 'Hôm nay',
                            purchaseDate: p.createdAt ? dayjs(p.createdAt).format('DD/MM/YYYY') : dayjs().format('DD/MM/YYYY'),
                            purchaseTime: p.createdAt ? dayjs(p.createdAt).format('HH:mm:ss') : dayjs().format('HH:mm:ss'),
                            status: p.status,
                        });
                    }
                });
            } catch (err) {
                console.log('Error fetching user payment notifications', err);
            }
        }

        // Sort by newest
        combined.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        setNotifications(combined);
    };

    const handleClearAll = (e) => {
        e.stopPropagation();
        localStorage.removeItem('streamphim_notifications');
        setNotifications([]);
        setHasUnread(false);
    };

    const handleItemClick = (ticketId) => {
        setOpen(false);
        navigate(`/payment-success/${ticketId}`);
    };

    const popoverContent = (
        <div className={styles.notificationPanel}>
            {/* Header */}
            <div className={styles.panelHeader}>
                <div className={styles.headerTitle}>
                    <span className={styles.bellIcon}>🔔</span>
                    <span>Thông Báo Mua Vé Thành Công</span>
                    {notifications.length > 0 && (
                        <Tag color="red" className={styles.countBadge}>
                            {notifications.length}
                        </Tag>
                    )}
                </div>
                {notifications.length > 0 && (
                    <Button
                        type="link"
                        size="small"
                        onClick={handleClearAll}
                        className={styles.btnClear}
                    >
                        Xóa tất cả
                    </Button>
                )}
            </div>

            {/* Notification List */}
            <div className={styles.panelBody}>
                {notifications.length === 0 ? (
                    <div className={styles.emptyWrap}>
                        <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description={
                                <span className={styles.emptyText}>
                                    Chưa có thông báo mua vé nào gần đây.<br />
                                    Vé đặt thành công sẽ xuất hiện tại đây kèm ngày và giờ mua!
                                </span>
                            }
                        />
                    </div>
                ) : (
                    <div className={styles.notifList}>
                        {notifications.map((item, idx) => (
                            <div
                                key={item.id || idx}
                                className={styles.notifCard}
                                onClick={() => handleItemClick(item.id)}
                            >
                                <div className={styles.cardTop}>
                                    <Tag color="green" className={styles.successTag}>
                                        <CheckCircleOutlined /> Đã Mua Vé Thành Công
                                    </Tag>
                                    <span className={styles.ticketIdText}>
                                        Mã: {item.id?.substring(0, 8).toUpperCase()}
                                    </span>
                                </div>

                                <div className={styles.cardContent}>
                                    {item.moviePoster && (
                                        <img
                                            src={item.moviePoster}
                                            alt={item.movieName}
                                            className={styles.movieThumb}
                                            onError={(e) => {
                                                e.target.src = 'https://via.placeholder.com/48x64?text=Movie';
                                            }}
                                        />
                                    )}
                                    <div className={styles.movieMeta}>
                                        <h4 className={styles.movieName}>{item.movieName}</h4>

                                        {/* EXACT REQUIRED DATE & TIME OF PURCHASE */}
                                        <div className={styles.purchaseTimestamp}>
                                            <span className={styles.tsItem}>
                                                <CalendarOutlined /> Ngày mua: <strong>{item.purchaseDate || dayjs().format('DD/MM/YYYY')}</strong>
                                            </span>
                                            <span className={styles.tsItem}>
                                                <ClockCircleOutlined /> Giờ mua: <strong className={styles.hourHighlight}>{item.purchaseTime || dayjs().format('HH:mm:ss')}</strong>
                                            </span>
                                        </div>

                                        <div className={styles.showInfo}>
                                            <span>Suất: <strong>{item.time}</strong> ({item.date})</span>
                                            <span> • Ghế: <strong className={styles.seatHighlight}>{item.seats}</strong></span>
                                        </div>

                                        <div className={styles.priceRow}>
                                            <span>Tổng tiền: <strong>{Number(item.totalPrice || 0).toLocaleString()}đ</strong></span>
                                            <span className={styles.viewDetailLink}>Xem chi tiết & in vé &gt;</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className={styles.panelFooter}>
                <Link to="/profile" onClick={() => setOpen(false)} className={styles.footerLink}>
                    📜 Xem toàn bộ lịch sử đặt vé trong tài khoản
                </Link>
            </div>
        </div>
    );

    return (
        <Popover
            content={popoverContent}
            trigger="click"
            open={open}
            onOpenChange={(visible) => {
                setOpen(visible);
                if (visible) setHasUnread(false);
            }}
            placement="bottomRight"
            arrow={false}
            overlayClassName={styles.popoverOverlay}
        >
            <div className={styles.bellButton} title="Thông báo đặt vé thành công">
                <Badge count={notifications.length} overflowCount={99} size="small" offset={[-2, 2]}>
                    <div className={styles.bellIconBox}>
                        <BellOutlined className={styles.bellSvg} />
                    </div>
                </Badge>
            </div>
        </Popover>
    );
};

export default NotificationDropdown;
