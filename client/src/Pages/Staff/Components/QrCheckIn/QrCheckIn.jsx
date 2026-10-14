import React, { useState, useEffect, useRef } from 'react';
import { Card, Input, Button, message, Tag, Alert, Spin, Space, Row, Col, Divider } from 'antd';
import {
    QrcodeOutlined,
    SearchOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    PrinterOutlined,
    CameraOutlined,
    StopOutlined,
    AudioOutlined,
    UserOutlined,
} from '@ant-design/icons';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { requestStaffGetTicketByCode, requestStaffCheckIn } from '../../../../config/request';
import TicketModal from '../TicketModal/TicketModal';
import styles from './QrCheckIn.module.scss';

const QrCheckIn = () => {
    const [searchCode, setSearchCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [ticketData, setTicketData] = useState(null);
    const [scannerActive, setScannerActive] = useState(false);
    const [printModalVisible, setPrintModalVisible] = useState(false);
    const [recentScans, setRecentScans] = useState([]);

    const scannerRef = useRef(null);

    // Initialize or cleanup HTML5 QR Code Scanner
    useEffect(() => {
        let scanner = null;
        if (scannerActive) {
            scanner = new Html5QrcodeScanner('qr-reader', {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0,
            });

            scanner.render(
                (decodedText) => {
                    handleSearch(decodedText);
                    setScannerActive(false);
                    scanner.clear();
                },
                (error) => {
                    // ignore frame errors
                }
            );

            scannerRef.current = scanner;
        }

        return () => {
            if (scannerRef.current) {
                try {
                    scannerRef.current.clear();
                } catch (e) {}
            }
        };
    }, [scannerActive]);

    const handleSearch = async (codeToSearch = searchCode) => {
        const query = (codeToSearch || '').trim();
        if (!query) {
            message.warning('Vui lòng nhập mã vé hoặc quét QR');
            return;
        }

        setLoading(true);
        try {
            const res = await requestStaffGetTicketByCode(query);
            const data = res?.metadata;
            if (data) {
                setTicketData(data);
                message.success('Tìm thấy thông tin vé!');
            }
        } catch (error) {
            message.error(error.response?.data?.message || 'Không tìm thấy vé trong hệ thống');
            setTicketData(null);
        } finally {
            setLoading(false);
        }
    };

    const handleCheckIn = async () => {
        if (!ticketData) return;

        setLoading(true);
        try {
            const res = await requestStaffCheckIn({ ticketId: ticketData.id });
            message.success(res?.message || 'Soát vé thành công! Cho khách vào rạp.');

            // Update local ticket state
            const updated = {
                ...ticketData,
                isCheckIn: true,
                checkInAt: res?.metadata?.checkInAt || 'Vừa xong',
            };
            setTicketData(updated);

            // Add to recent scans list
            setRecentScans((prev) => [
                {
                    id: ticketData.id,
                    movieName: ticketData.movie?.name,
                    seats: Array.isArray(ticketData.seats) ? ticketData.seats.join(', ') : ticketData.seats,
                    time: new Date().toLocaleTimeString('vi-VN'),
                    customerName: ticketData.customerName,
                },
                ...prev.slice(0, 9),
            ]);
        } catch (error) {
            message.error(error.response?.data?.message || 'Lỗi khi soát vé');
        } finally {
            setLoading(false);
        }
    };

    const seatsFormatted = Array.isArray(ticketData?.seats)
        ? ticketData.seats.join(', ')
        : ticketData?.seats || 'Chưa có';

    return (
        <div className={styles.container}>
            <Row gutter={[24, 24]}>
                {/* Left Column: Scanner & Search Input */}
                <Col xs={24} lg={10}>
                    <Card
                        title={
                            <div className={styles.cardHeader}>
                                <QrcodeOutlined /> Quét QR & Nhập Mã Vé
                            </div>
                        }
                        className={styles.searchCard}
                    >
                        {/* Toggle Camera Scanner */}
                        <div className={styles.scannerToggleSection}>
                            <Button
                                type={scannerActive ? 'default' : 'primary'}
                                icon={scannerActive ? <StopOutlined /> : <CameraOutlined />}
                                size="large"
                                block
                                danger={scannerActive}
                                onClick={() => setScannerActive(!scannerActive)}
                                className={styles.btnScanner}
                            >
                                {scannerActive ? 'Tắt Camera Quét QR' : 'Mở Camera Quét Mã QR'}
                            </Button>
                        </div>

                        {/* Scanner Video Mount */}
                        {scannerActive && (
                            <div className={styles.scannerWrapper}>
                                <div id="qr-reader" className={styles.qrReaderBox}></div>
                                <p className={styles.scannerTip}>
                                    📸 Hướng camera về phía mã QR trên vé hoặc điện thoại khách hàng
                                </p>
                            </div>
                        )}

                        <Divider>HOẶC NHẬP MÃ THỦ CÔNG</Divider>

                        {/* Manual Search */}
                        <div className={styles.inputGroup}>
                            <Input
                                placeholder="Nhập mã vé (UUID) hoặc Số điện thoại..."
                                size="large"
                                value={searchCode}
                                onChange={(e) => setSearchCode(e.target.value)}
                                onPressEnter={() => handleSearch()}
                                prefix={<SearchOutlined className={styles.searchIcon} />}
                                allowClear
                            />
                            <Button
                                type="primary"
                                size="large"
                                onClick={() => handleSearch()}
                                loading={loading}
                                className={styles.btnSearch}
                            >
                                Tra Cứu
                            </Button>
                        </div>

                        {/* Recent Scans */}
                        {recentScans.length > 0 && (
                            <div className={styles.recentSection}>
                                <h4 className={styles.recentTitle}>Lịch sử soát vé vừa xong:</h4>
                                <div className={styles.recentList}>
                                    {recentScans.map((item, idx) => (
                                        <div key={idx} className={styles.recentItem}>
                                            <div className={styles.recentMain}>
                                                <span className={styles.recentMovie}>{item.movieName}</span>
                                                <span className={styles.recentSeats}>Ghế: {item.seats}</span>
                                            </div>
                                            <div className={styles.recentMeta}>
                                                <span>{item.customerName}</span>
                                                <Tag color="green">{item.time}</Tag>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </Card>
                </Col>

                {/* Right Column: Ticket Inspection & Actions */}
                <Col xs={24} lg={14}>
                    <Card
                        title={
                            <div className={styles.cardHeader}>
                                🎟️ Chi Tiết Vé & Kiểm Tra Soát Vé
                            </div>
                        }
                        className={styles.ticketCard}
                    >
                        {loading && !ticketData && (
                            <div className={styles.loadingBox}>
                                <Spin size="large" tip="Đang tải thông tin vé..." />
                            </div>
                        )}

                        {!ticketData && !loading && (
                            <div className={styles.emptyBox}>
                                <div className={styles.emptyIcon}>📷</div>
                                <h3>Chưa có vé nào được tra cứu</h3>
                                <p>Hãy quét mã QR trên vé khách hàng hoặc nhập mã vé ở khung bên trái để kiểm tra thông tin soát vé và in vé.</p>
                            </div>
                        )}

                        {ticketData && (
                            <div className={styles.ticketContent}>
                                {/* Status Banner */}
                                {ticketData.status !== 'success' ? (
                                    <Alert
                                        message="VÉ CHƯA HỢP LỆ HOẶC CHƯA THANH TOÁN"
                                        description={`Trạng thái giao dịch: ${ticketData.status}. Khách hàng chưa hoàn tất thanh toán, không được phép vào rạp!`}
                                        type="error"
                                        showIcon
                                        className={styles.alertBanner}
                                    />
                                ) : ticketData.isCheckIn ? (
                                    <Alert
                                        message="VÉ ĐÃ ĐƯỢC SOÁT TRƯỚC ĐÓ"
                                        description={`Vé này đã được soát vào lúc: ${ticketData.checkInAt}. Vui lòng xác thực cẩn thận tránh vào trùng!`}
                                        type="warning"
                                        showIcon
                                        className={styles.alertBanner}
                                    />
                                ) : (
                                    <Alert
                                        message="VÉ HỢP LỆ - SẴN SÀNG VÀO RẠP"
                                        description="Vé hợp lệ, đã thanh toán thành công và chưa soát vé. Hãy bấm 'XÁC NHẬN SOÁT VÉ' để cho khách vào rạp."
                                        type="success"
                                        showIcon
                                        className={styles.alertBanner}
                                    />
                                )}

                                {/* Movie & Showtime Card */}
                                <div className={styles.ticketInfoCard}>
                                    <div className={styles.movieRow}>
                                        <img
                                            src={ticketData.movie?.poster_url || ticketData.movie?.thumb_url || 'https://via.placeholder.com/120x160'}
                                            alt={ticketData.movie?.name}
                                            className={styles.moviePoster}
                                        />
                                        <div className={styles.movieDetails}>
                                            <h2 className={styles.movieTitle}>{ticketData.movie?.name}</h2>
                                            <div className={styles.tagRow}>
                                                <Tag color="red">{ticketData.movie?.quality || '2D'}</Tag>
                                                <Tag color="blue">{ticketData.movie?.time ? `${ticketData.movie.time} phút` : '120 phút'}</Tag>
                                                <Tag color="purple">{ticketData.room}</Tag>
                                            </div>

                                            <div className={styles.showtimeBox}>
                                                <div>📅 Suất chiếu: <strong>{ticketData.date}</strong> lúc <strong className={styles.timeHighlight}>{ticketData.time}</strong></div>
                                                <div className={styles.seatsLine}>
                                                    💺 Vị trí ghế: <span className={styles.seatsBadge}>{seatsFormatted}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Customer & Snacks Row */}
                                    <div className={styles.detailsGrid}>
                                        <div className={styles.detailItem}>
                                            <span className={styles.dtLabel}>Khách hàng:</span>
                                            <span className={styles.dtVal}>
                                                <UserOutlined /> {ticketData.customerName}
                                            </span>
                                        </div>
                                        <div className={styles.detailItem}>
                                            <span className={styles.dtLabel}>Số điện thoại:</span>
                                            <span className={styles.dtVal}>{ticketData.customerPhone || 'Không có'}</span>
                                        </div>
                                        <div className={styles.detailItem}>
                                            <span className={styles.dtLabel}>Phương thức:</span>
                                            <span className={styles.dtVal}>
                                                <Tag color="cyan">{ticketData.paymentMethod?.toUpperCase()}</Tag>
                                            </span>
                                        </div>
                                        <div className={styles.detailItem}>
                                            <span className={styles.dtLabel}>Tổng thanh toán:</span>
                                            <span className={styles.dtPrice}>
                                                {Number(ticketData.totalPrice || 0).toLocaleString()} VNĐ
                                            </span>
                                        </div>
                                    </div>

                                    {/* Services / Snacks if bought */}
                                    {ticketData.services && ticketData.services.length > 0 && (
                                        <div className={styles.snacksBox}>
                                            <div className={styles.snackTitle}>🍿 Bắp nước đã mua kèm:</div>
                                            <div className={styles.snackItems}>
                                                {ticketData.services.map((item, idx) => (
                                                    <span key={idx} className={styles.snackBadge}>
                                                        {item.name} x {item.quantity || 1}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div className={styles.actionsFooter}>
                                    <Button
                                        type="primary"
                                        size="large"
                                        icon={<CheckCircleOutlined />}
                                        disabled={ticketData.status !== 'success' || ticketData.isCheckIn}
                                        loading={loading}
                                        onClick={handleCheckIn}
                                        className={styles.btnCheckIn}
                                    >
                                        {ticketData.isCheckIn ? 'Đã Soát Vé Xong' : 'XÁC NHẬN SOÁT VÉ (CHO VÀO RẠP)'}
                                    </Button>

                                    <Button
                                        size="large"
                                        icon={<PrinterOutlined />}
                                        onClick={() => setPrintModalVisible(true)}
                                        className={styles.btnPrint}
                                    >
                                        In Vé (Print Ticket)
                                    </Button>
                                </div>
                            </div>
                        )}
                    </Card>
                </Col>
            </Row>

            {/* Printable Ticket Receipt Modal */}
            <TicketModal
                visible={printModalVisible}
                onClose={() => setPrintModalVisible(false)}
                ticketData={ticketData}
            />
        </div>
    );
};

export default QrCheckIn;
