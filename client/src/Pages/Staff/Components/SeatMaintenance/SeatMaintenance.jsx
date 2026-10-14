import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Select, DatePicker, Button, Tag, message, Spin, Space, Statistic, Alert } from 'antd';
import {
    ToolOutlined,
    CheckCircleOutlined,
    AppstoreOutlined,
    WarningOutlined,
    ReloadOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
    requestStaffGetRooms,
    requestGetAllMovie,
    requestStaffGetSeats,
    requestStaffUpdateSeatMaintenance,
} from '../../../../config/request';
import styles from './SeatMaintenance.module.scss';

const DEFAULT_SHOWTIMES = ['09:00', '11:30', '14:15', '17:00', '19:30', '21:45', '23:15'];
const SEAT_ROWS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const SEATS_PER_ROW = 12;

const SeatMaintenance = () => {
    const [rooms, setRooms] = useState([]);
    const [movies, setMovies] = useState([]);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [selectedMovie, setSelectedMovie] = useState(null);
    const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
    const [selectedTime, setSelectedTime] = useState(DEFAULT_SHOWTIMES[2]);
    const [existingSeats, setExistingSeats] = useState([]);
    const [selectedSeatCodes, setSelectedSeatCodes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (selectedMovie) {
            fetchSeats();
        }
    }, [selectedMovie, selectedDate, selectedTime]);

    const fetchInitialData = async () => {
        try {
            const [roomsRes, moviesRes] = await Promise.all([
                requestStaffGetRooms(),
                requestGetAllMovie(),
            ]);

            const rList = roomsRes?.metadata || [];
            const mList = moviesRes?.metadata || moviesRes || [];

            setRooms(rList);
            if (rList.length > 0) setSelectedRoom(rList[0]);

            setMovies(mList);
            if (mList.length > 0) setSelectedMovie(mList[0]);
        } catch (error) {
            message.error('Lỗi khi tải dữ liệu phòng & phim');
        }
    };

    const fetchSeats = async () => {
        if (!selectedMovie) return;
        setLoading(true);
        setSelectedSeatCodes([]);
        try {
            const res = await requestStaffGetSeats({
                movieId: selectedMovie.id,
                date: selectedDate,
                time: selectedTime,
            });
            setExistingSeats(res?.metadata || []);
        } catch (error) {
            console.log('Error fetching seats', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleSeatSelect = (code) => {
        if (selectedSeatCodes.includes(code)) {
            setSelectedSeatCodes(selectedSeatCodes.filter((c) => c !== code));
        } else {
            setSelectedSeatCodes([...selectedSeatCodes, code]);
        }
    };

    const handleUpdateStatus = async (status) => {
        if (selectedSeatCodes.length === 0) {
            message.warning('Vui lòng chọn ít nhất 1 ghế cần thao tác');
            return;
        }

        setUpdating(true);
        try {
            const payload = {
                movieId: selectedMovie.id,
                date: selectedDate,
                time: selectedTime,
                seatCodes: selectedSeatCodes,
                status,
            };

            const res = await requestStaffUpdateSeatMaintenance(payload);
            message.success(res?.message || 'Cập nhật trạng thái bảo trì thành công');
            setSelectedSeatCodes([]);
            fetchSeats();
        } catch (error) {
            message.error(error.response?.data?.message || 'Lỗi khi cập nhật ghế');
        } finally {
            setUpdating(false);
        }
    };

    // Calculate stats
    const totalSeatsCount = SEAT_ROWS.length * SEATS_PER_ROW;
    const maintenanceCount = existingSeats.filter(
        (s) => s.status === 'maintenance' || s.status === 'broken'
    ).length;
    const bookedCount = existingSeats.filter((s) => s.status === 'booked').length;
    const availableCount = totalSeatsCount - maintenanceCount - bookedCount;

    return (
        <div className={styles.container}>
            <Card className={styles.mainCard}>
                <div className={styles.headerBar}>
                    <div className={styles.titleInfo}>
                        <h2 className={styles.title}>
                            <ToolOutlined /> Quản Lý Phòng & Bảo Trì Ghế
                        </h2>
                        <p className={styles.subtitle}>
                            Đánh dấu các ghế hỏng, ghế cần vệ sinh hoặc bảo trì để ngăn khách hàng đặt vé
                        </p>
                    </div>

                    <Button icon={<ReloadOutlined />} onClick={fetchSeats} loading={loading}>
                        Làm Mới
                    </Button>
                </div>

                {/* Filter Controls */}
                <div className={styles.filtersSection}>
                    <Row gutter={[16, 16]}>
                        <Col xs={24} md={6}>
                            <label className={styles.filterLabel}>Phòng chiếu:</label>
                            <Select
                                size="large"
                                style={{ width: '100%' }}
                                value={selectedRoom?.id}
                                onChange={(val) => {
                                    const r = rooms.find((x) => x.id === val);
                                    setSelectedRoom(r);
                                }}
                                options={rooms.map((r) => ({
                                    value: r.id,
                                    label: `${r.name} - ${r.cinema} (${r.type})`,
                                }))}
                            />
                        </Col>
                        <Col xs={24} md={8}>
                            <label className={styles.filterLabel}>Phim đang chiếu:</label>
                            <Select
                                size="large"
                                style={{ width: '100%' }}
                                value={selectedMovie?.id}
                                onChange={(val) => {
                                    const m = movies.find((x) => x.id === val);
                                    setSelectedMovie(m);
                                }}
                                options={movies.map((m) => ({
                                    value: m.id,
                                    label: m.name,
                                }))}
                            />
                        </Col>
                        <Col xs={12} md={5}>
                            <label className={styles.filterLabel}>Ngày:</label>
                            <DatePicker
                                size="large"
                                style={{ width: '100%' }}
                                value={dayjs(selectedDate)}
                                format="DD/MM/YYYY"
                                onChange={(d) =>
                                    setSelectedDate(
                                        d ? d.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD')
                                    )
                                }
                            />
                        </Col>
                        <Col xs={12} md={5}>
                            <label className={styles.filterLabel}>Suất chiếu:</label>
                            <Select
                                size="large"
                                style={{ width: '100%' }}
                                value={selectedTime}
                                onChange={(val) => setSelectedTime(val)}
                                options={DEFAULT_SHOWTIMES.map((t) => ({ value: t, label: t }))}
                            />
                        </Col>
                    </Row>
                </div>

                {/* Stats Row */}
                <div className={styles.statsRow}>
                    <div className={styles.statCard}>
                        <span className={styles.statLabel}>Tổng số ghế:</span>
                        <span className={styles.statVal}>{totalSeatsCount}</span>
                    </div>
                    <div className={styles.statCard}>
                        <span className={styles.statLabel}>Đang hoạt động tốt:</span>
                        <span className={`${styles.statVal} ${styles.green}`}>{availableCount}</span>
                    </div>
                    <div className={styles.statCard}>
                        <span className={styles.statLabel}>Đã bán / Có khách:</span>
                        <span className={`${styles.statVal} ${styles.blue}`}>{bookedCount}</span>
                    </div>
                    <div className={styles.statCard}>
                        <span className={styles.statLabel}>Đang bảo trì / Hỏng:</span>
                        <span className={`${styles.statVal} ${styles.amber}`}>{maintenanceCount}</span>
                    </div>
                </div>

                {/* Interactive Seat Layout */}
                <div className={styles.seatCanvas}>
                    <div className={styles.screenBanner}>MÀN HÌNH CHIẾU / SCREEN</div>

                    {loading ? (
                        <div className={styles.loadingBox}>
                            <Spin tip="Đang tải sơ đồ phòng chiếu..." />
                        </div>
                    ) : (
                        <div className={styles.seatGrid}>
                            {SEAT_ROWS.map((row) => (
                                <div key={row} className={styles.seatRow}>
                                    <span className={styles.rowLabel}>{row}</span>
                                    <div className={styles.seatList}>
                                        {Array.from({ length: SEATS_PER_ROW }).map((_, i) => {
                                            const num = i + 1;
                                            const code = `${row}${num}`;
                                            const found = existingSeats.find((s) => s.seat_code === code);
                                            const status = found ? found.status : 'available';
                                            const isSelected = selectedSeatCodes.includes(code);

                                            let cls = styles.available;
                                            if (status === 'maintenance' || status === 'broken') {
                                                cls = styles.maintenance;
                                            } else if (status === 'booked') {
                                                cls = styles.booked;
                                            }

                                            if (isSelected) {
                                                cls += ` ${styles.selected}`;
                                            }

                                            return (
                                                <button
                                                    key={code}
                                                    type="button"
                                                    className={`${styles.seatCell} ${cls}`}
                                                    onClick={() => toggleSeatSelect(code)}
                                                    title={`Ghế ${code} - Trạng thái: ${status}`}
                                                >
                                                    {status === 'maintenance' || status === 'broken' ? '🔧' : num}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <span className={styles.rowLabel}>{row}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Legend */}
                    <div className={styles.legendBar}>
                        <div className={styles.legendItem}>
                            <span className={`${styles.box} ${styles.availBox}`}></span>
                            <span>Ghế hoạt động bình thường</span>
                        </div>
                        <div className={styles.legendItem}>
                            <span className={`${styles.box} ${styles.maintBox}`}></span>
                            <span>Ghế hỏng / Đang bảo trì</span>
                        </div>
                        <div className={styles.legendItem}>
                            <span className={`${styles.box} ${styles.bookedBox}`}></span>
                            <span>Ghế đã bán</span>
                        </div>
                        <div className={styles.legendItem}>
                            <span className={`${styles.box} ${styles.selBox}`}></span>
                            <span>Đang chọn ({selectedSeatCodes.length})</span>
                        </div>
                    </div>
                </div>

                {/* Maintenance Action Buttons */}
                <div className={styles.bottomBar}>
                    <div className={styles.selectedCount}>
                        Đã chọn: <strong>{selectedSeatCodes.length}</strong> ghế{' '}
                        {selectedSeatCodes.length > 0 && `(${selectedSeatCodes.join(', ')})`}
                    </div>

                    <Space size="middle">
                        <Button
                            type="primary"
                            danger
                            size="large"
                            icon={<WarningOutlined />}
                            disabled={selectedSeatCodes.length === 0}
                            loading={updating}
                            onClick={() => handleUpdateStatus('maintenance')}
                            className={styles.btnMaintenance}
                        >
                            🛠️ ĐÁNH DẤU BẢO TRÌ (KHÓA GHẾ)
                        </Button>

                        <Button
                            type="primary"
                            size="large"
                            icon={<CheckCircleOutlined />}
                            disabled={selectedSeatCodes.length === 0}
                            loading={updating}
                            onClick={() => handleUpdateStatus('available')}
                            className={styles.btnRestore}
                        >
                            ✨ HOÀN TẤT BẢO TRÌ (MỞ LẠI GHẾ)
                        </Button>
                    </Space>
                </div>
            </Card>
        </div>
    );
};

export default SeatMaintenance;
