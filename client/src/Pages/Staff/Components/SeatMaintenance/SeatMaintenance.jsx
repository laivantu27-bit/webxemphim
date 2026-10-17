import React, { useState, useEffect } from 'react';
import {
    Card,
    Row,
    Col,
    Select,
    DatePicker,
    Button,
    Tag,
    message,
    Spin,
    Space,
    Statistic,
    Alert,
    Modal,
    Form,
    Input,
    Table,
    Divider,
} from 'antd';
import {
    ToolOutlined,
    CheckCircleOutlined,
    AppstoreOutlined,
    WarningOutlined,
    ReloadOutlined,
    ShopOutlined,
    EditOutlined,
    EnvironmentOutlined,
    InfoCircleOutlined,
    EyeOutlined,
    CheckOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
    requestStaffGetRooms,
    requestGetAllMovie,
    requestStaffGetSeats,
    requestStaffUpdateSeatMaintenance,
    requestStaffUpdateRoomBranch,
    requestGetAllBranches,
} from '../../../../config/request';
import styles from './SeatMaintenance.module.scss';

const DEFAULT_SHOWTIMES = ['09:00', '11:30', '14:15', '17:00', '19:30', '21:45', '23:15'];
const SEAT_ROWS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const SEATS_PER_ROW = 12;

const SeatMaintenance = () => {
    const [rooms, setRooms] = useState([]);
    const [movies, setMovies] = useState([]);
    const [branches, setBranches] = useState([]);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [selectedMovie, setSelectedMovie] = useState(null);
    const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
    const [selectedTime, setSelectedTime] = useState(DEFAULT_SHOWTIMES[2]);
    const [existingSeats, setExistingSeats] = useState([]);
    const [selectedSeatCodes, setSelectedSeatCodes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [updating, setUpdating] = useState(false);

    // Modal state for editing room branch
    const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
    const [isRoomListModalOpen, setIsRoomListModalOpen] = useState(false);
    const [editingRoom, setEditingRoom] = useState(null);
    const [targetBranchId, setTargetBranchId] = useState(null);
    const [roomNameInput, setRoomNameInput] = useState('');
    const [roomTypeInput, setRoomTypeInput] = useState('2D');
    const [savingBranch, setSavingBranch] = useState(false);

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (selectedMovie) {
            fetchSeats();
        }
    }, [selectedMovie, selectedDate, selectedTime]);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [roomsRes, moviesRes, branchRes] = await Promise.all([
                requestStaffGetRooms(),
                requestGetAllMovie(),
                requestGetAllBranches().catch(() => ({ metadata: [] })),
            ]);

            const rList = roomsRes?.metadata || [];
            const mList = moviesRes?.metadata || moviesRes || [];
            const bList = branchRes?.metadata || [];

            setRooms(rList);
            setBranches(bList);

            if (rList.length > 0) {
                // If currently selected room still exists, keep it; otherwise select first
                setSelectedRoom((prev) => {
                    if (prev) {
                        const found = rList.find((x) => x.id === prev.id);
                        return found || rList[0];
                    }
                    return rList[0];
                });
            }

            setMovies(mList);
            if (mList.length > 0 && !selectedMovie) setSelectedMovie(mList[0]);
        } catch (error) {
            message.error('Lỗi khi tải dữ liệu phòng & phim');
        } finally {
            setLoading(false);
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

    // Open branch edit modal for a specific room
    const handleOpenBranchModal = (roomToEdit) => {
        const target = roomToEdit || selectedRoom;
        if (!target) {
            message.warning('Vui lòng chọn phòng chiếu trước');
            return;
        }
        setEditingRoom(target);
        setRoomNameInput(target.name || '');
        setRoomTypeInput(target.type || '2D');

        // Find corresponding branch by cinemaBranchId or cinema name
        const matched = branches.find(
            (b) => b.id === target.cinemaBranchId || b.name === target.cinema
        );
        setTargetBranchId(matched ? matched.id : null);
        setIsBranchModalOpen(true);
    };

    // Save branch changes
    const handleSaveBranch = async () => {
        if (!editingRoom) return;

        const branchObj = branches.find((b) => b.id === targetBranchId);
        const cinemaName = branchObj ? branchObj.name : editingRoom.cinema;

        setSavingBranch(true);
        try {
            const payload = {
                id: editingRoom.id,
                name: roomNameInput.trim() || editingRoom.name,
                type: roomTypeInput,
                cinema: cinemaName,
                cinemaBranchId: branchObj ? branchObj.id : editingRoom.cinemaBranchId,
            };

            const res = await requestStaffUpdateRoomBranch(payload);
            message.success(
                res?.message ||
                    `Đã cập nhật phòng "${payload.name}" thuộc chi nhánh "${cinemaName}" thành công!`
            );

            // Update rooms in state
            const updatedRooms = rooms.map((r) =>
                r.id === editingRoom.id ? { ...r, ...payload } : r
            );
            setRooms(updatedRooms);

            if (selectedRoom?.id === editingRoom.id) {
                setSelectedRoom({ ...selectedRoom, ...payload });
            }

            setIsBranchModalOpen(false);
        } catch (error) {
            message.error(error?.response?.data?.message || 'Lỗi khi cập nhật chi nhánh phòng');
        } finally {
            setSavingBranch(false);
        }
    };

    // Calculate stats
    const totalSeatsCount = SEAT_ROWS.length * SEATS_PER_ROW;
    const maintenanceCount = existingSeats.filter(
        (s) => s.status === 'maintenance' || s.status === 'broken'
    ).length;
    const bookedCount = existingSeats.filter((s) => s.status === 'booked').length;
    const availableCount = totalSeatsCount - maintenanceCount - bookedCount;

    const selectedBranchObj = branches.find((b) => b.id === targetBranchId);

    // Columns for Room List Modal
    const roomTableColumns = [
        {
            title: 'STT',
            key: 'index',
            width: 60,
            align: 'center',
            render: (_, __, i) => i + 1,
        },
        {
            title: 'Tên phòng chiếu',
            dataIndex: 'name',
            key: 'name',
            render: (text) => <strong>{text}</strong>,
        },
        {
            title: 'Chi nhánh rạp trực thuộc',
            dataIndex: 'cinema',
            key: 'cinema',
            render: (cinema) => (
                <Tag color="magenta" style={{ fontWeight: 600, fontSize: '13px', padding: '4px 10px' }}>
                    🏢 {cinema}
                </Tag>
            ),
        },
        {
            title: 'Loại phòng',
            dataIndex: 'type',
            key: 'type',
            align: 'center',
            render: (t) => {
                const colorMap = { '2D': 'blue', '3D': 'green', IMAX: 'gold', '4DX': 'magenta' };
                return <Tag color={colorMap[t] || 'cyan'}>{t}</Tag>;
            },
        },
        {
            title: 'Sức chứa',
            key: 'capacity',
            align: 'center',
            render: (_, r) => (
                <Tag color="geekblue">{r.totalRows * r.seatsPerRow} ghế ({r.totalRows}x{r.seatsPerRow})</Tag>
            ),
        },
        {
            title: 'Thao tác',
            key: 'action',
            align: 'center',
            render: (_, r) => (
                <Space size="small">
                    <Button
                        type="primary"
                        ghost
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => {
                            handleOpenBranchModal(r);
                        }}
                    >
                        Sửa Chi Nhánh
                    </Button>
                    <Button
                        size="small"
                        type={selectedRoom?.id === r.id ? 'primary' : 'default'}
                        icon={<CheckOutlined />}
                        onClick={() => {
                            setSelectedRoom(r);
                            setIsRoomListModalOpen(false);
                            message.info(`Đã chọn "${r.name} - ${r.cinema}"`);
                        }}
                    >
                        {selectedRoom?.id === r.id ? 'Đang chọn' : 'Chọn phòng'}
                    </Button>
                </Space>
            ),
        },
    ];

    return (
        <div className={styles.container}>
            <Card className={styles.mainCard}>
                <div className={styles.headerBar}>
                    <div className={styles.titleInfo}>
                        <h2 className={styles.title}>
                            <ToolOutlined /> Quản Lý Phòng & Bảo Trì Ghế
                        </h2>
                        <p className={styles.subtitle}>
                            Phân bổ phòng cho chi nhánh CGV, sửa thông tin phòng và kiểm tra sơ đồ ghế bảo trì
                        </p>
                    </div>

                    <Space>
                        <Button
                            type="primary"
                            icon={<ShopOutlined />}
                            onClick={() => handleOpenBranchModal(selectedRoom)}
                        >
                            🏢 Sửa Chi Nhánh Phòng
                        </Button>
                        <Button
                            icon={<AppstoreOutlined />}
                            onClick={() => setIsRoomListModalOpen(true)}
                        >
                            📋 Tất Cả Phòng ({rooms.length})
                        </Button>
                        <Button icon={<ReloadOutlined />} onClick={fetchInitialData} loading={loading}>
                            Làm Mới
                        </Button>
                    </Space>
                </div>

                {/* Selected Room Details Banner */}
                {selectedRoom && (
                    <div className={styles.roomInfoBanner}>
                        <div className={styles.bannerLeft}>
                            <span className={styles.roomTitle}>🎬 {selectedRoom.name}</span>
                            <span className={styles.branchTag}>
                                🏢 {selectedRoom.cinema}
                            </span>
                            <Tag color="gold" className={styles.typeTag}>
                                {selectedRoom.type}
                            </Tag>
                            <span className={styles.capacityInfo}>
                                Sức chứa: {selectedRoom.totalRows * selectedRoom.seatsPerRow} ghế ({selectedRoom.totalRows} hàng × {selectedRoom.seatsPerRow} ghế)
                            </span>
                        </div>
                        <div className={styles.bannerRight}>
                            <Button
                                size="small"
                                type="primary"
                                ghost
                                icon={<EditOutlined />}
                                onClick={() => handleOpenBranchModal(selectedRoom)}
                            >
                                Đổi Chi Nhánh Rạp Này
                            </Button>
                        </div>
                    </div>
                )}

                {/* Filter Controls */}
                <div className={styles.filtersSection}>
                    <Row gutter={[16, 16]}>
                        <Col xs={24} md={6}>
                            <label className={styles.filterLabel}>Phòng chiếu & Chi nhánh:</label>
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

            {/* Modal Sửa Chi Nhánh Cho Phòng Chiếu */}
            <Modal
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ff4d4f' }}>
                        <ShopOutlined style={{ fontSize: '20px' }} />
                        <span>Sửa Chi Nhánh & Thông Tin Phòng Chiếu</span>
                    </div>
                }
                open={isBranchModalOpen}
                onCancel={() => setIsBranchModalOpen(false)}
                onOk={handleSaveBranch}
                confirmLoading={savingBranch}
                okText="Lưu Thay Đổi"
                cancelText="Hủy"
                width={580}
            >
                <div style={{ padding: '8px 0' }}>
                    <Alert
                        message="Chọn chi nhánh rạp CGV cho phòng chiếu"
                        description="Phòng chiếu này sẽ được điều chuyển trực thuộc chi nhánh CGV bạn chọn dưới đây."
                        type="info"
                        showIcon
                        style={{ marginBottom: '18px' }}
                    />

                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px' }}>
                            Tên phòng chiếu:
                        </label>
                        <Input
                            size="large"
                            value={roomNameInput}
                            onChange={(e) => setRoomNameInput(e.target.value)}
                            placeholder="VD: Phòng 01 (Cinema 1), Phòng VIP..."
                        />
                    </div>

                    <Row gutter={16} style={{ marginBottom: '16px' }}>
                        <Col span={12}>
                            <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px' }}>
                                Loại phòng:
                            </label>
                            <Select
                                size="large"
                                style={{ width: '100%' }}
                                value={roomTypeInput}
                                onChange={(val) => setRoomTypeInput(val)}
                                options={[
                                    { value: '2D', label: '2D Digital' },
                                    { value: '3D', label: '3D Digital' },
                                    { value: 'IMAX', label: 'IMAX Laser' },
                                    { value: '4DX', label: '4DX Dynamic' },
                                ]}
                            />
                        </Col>
                        <Col span={12}>
                            <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px' }}>
                                Chi nhánh hiện tại:
                            </label>
                            <Tag color="volcano" style={{ padding: '6px 10px', fontSize: '13px', width: '100%', textAlign: 'center' }}>
                                {editingRoom?.cinema || 'Chưa gán'}
                            </Tag>
                        </Col>
                    </Row>

                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px' }}>
                            🏢 Chọn Chi Nhánh Rạp CGV Mới:
                        </label>
                        <Select
                            size="large"
                            showSearch
                            style={{ width: '100%' }}
                            placeholder="-- Tìm & chọn chi nhánh CGV --"
                            optionFilterProp="filterText"
                            value={targetBranchId}
                            onChange={(val) => setTargetBranchId(val)}
                            options={branches.map((b) => ({
                                value: b.id,
                                filterText: `${b.name} ${b.province} ${b.city} ${b.address}`,
                                label: (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span>🏢 <strong>{b.name}</strong></span>
                                        <Tag color="cyan">{b.province || b.city}</Tag>
                                    </div>
                                ),
                            }))}
                        />
                    </div>

                    {selectedBranchObj && (
                        <div className={styles.branchPreviewCard}>
                            <div className={styles.branchTitle}>
                                📍 {selectedBranchObj.name} ({selectedBranchObj.brand})
                            </div>
                            <div className={styles.branchAddress}>
                                <EnvironmentOutlined style={{ marginRight: 6, color: '#ff4d4f' }} />
                                {selectedBranchObj.address}
                            </div>
                            <div className={styles.branchMeta}>
                                <span>📞 {selectedBranchObj.phone || '1900 6017'}</span>
                                <span>⏰ {selectedBranchObj.openHours || '08:00 - 24:00'}</span>
                                <span>🏛️ {selectedBranchObj.province}</span>
                            </div>
                        </div>
                    )}
                </div>
            </Modal>

            {/* Modal Danh Sách & Quản Lý Chi Nhánh Phòng */}
            <Modal
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <AppstoreOutlined style={{ color: '#1890ff', fontSize: '20px' }} />
                        <span>Danh Sách Phòng Chiếu & Chi Nhánh Rạp CGV</span>
                    </div>
                }
                open={isRoomListModalOpen}
                onCancel={() => setIsRoomListModalOpen(false)}
                footer={[
                    <Button key="close" onClick={() => setIsRoomListModalOpen(false)}>
                        Đóng
                    </Button>,
                ]}
                width={850}
            >
                <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#888' }}>
                        Tổng cộng: <strong>{rooms.length}</strong> phòng chiếu trong hệ thống
                    </span>
                    <Button icon={<ReloadOutlined />} size="small" onClick={fetchInitialData}>
                        Làm Mới
                    </Button>
                </div>
                <Table
                    columns={roomTableColumns}
                    dataSource={rooms}
                    rowKey="id"
                    pagination={{ pageSize: 5 }}
                    size="middle"
                />
            </Modal>
        </div>
    );
};

export default SeatMaintenance;
