import React, { useRef } from 'react';
import { Modal, Button, QRCode, Tag, Divider } from 'antd';
import { PrinterOutlined, CheckCircleOutlined, CloseOutlined } from '@ant-design/icons';
import styles from './TicketModal.module.scss';

const TicketModal = ({ visible, onClose, ticketData }) => {
    const printRef = useRef(null);

    if (!ticketData) return null;

    const handlePrint = () => {
        window.print();
    };

    const seatsList = Array.isArray(ticketData.seats)
        ? ticketData.seats.join(', ')
        : ticketData.seats || 'Chưa chọn';

    const servicesList = Array.isArray(ticketData.services) ? ticketData.services : [];

    return (
        <Modal
            open={visible}
            onCancel={onClose}
            footer={null}
            centered
            width={480}
            className={styles.modalWrapper}
        >
            <div className={styles.printContainer} ref={printRef}>
                {/* Printable Ticket Receipt */}
                <div className={styles.ticketReceipt}>
                    <div className={styles.header}>
                        <div className={styles.cinemaLogo}>🎬 STREAMPHIM CINEMA</div>
                        <div className={styles.cinemaBranch}>RẠP CHIẾU PHIM QUỐC GIA - HÀ NỘI</div>
                        <div className={styles.dividerDots}>- - - - - - - - - - - - - - - - - - - - - - - -</div>
                        <div className={styles.ticketTitle}>VÉ XEM PHIM / CINEMA TICKET</div>
                    </div>

                    <div className={styles.movieSection}>
                        <h2 className={styles.movieName}>{ticketData.movie?.name || ticketData.movieName || 'Phim Chiếu Rạp'}</h2>
                        <div className={styles.badgeRow}>
                            <Tag color="red">{ticketData.movie?.quality || '2D HD'}</Tag>
                            <Tag color="blue">{ticketData.room || 'Phòng chiếu 1'}</Tag>
                            {ticketData.isCheckIn ? (
                                <Tag color="green">ĐÃ SOÁT VÉ</Tag>
                            ) : (
                                <Tag color="orange">CHƯA SOÁT VÉ</Tag>
                            )}
                        </div>
                    </div>

                    <div className={styles.infoGrid}>
                        <div className={styles.infoRow}>
                            <span className={styles.label}>Ngày chiếu:</span>
                            <span className={styles.val}>{ticketData.date || ticketData.showDate || 'Hôm nay'}</span>
                        </div>
                        <div className={styles.infoRow}>
                            <span className={styles.label}>Giờ chiếu:</span>
                            <span className={styles.valTime}>{ticketData.time || ticketData.showTime || '--:--'}</span>
                        </div>
                        <div className={styles.infoRow}>
                            <span className={styles.label}>Số ghế:</span>
                            <span className={styles.valSeats}>{seatsList}</span>
                        </div>
                        <div className={styles.infoRow}>
                            <span className={styles.label}>Khách hàng:</span>
                            <span className={styles.val}>{ticketData.customerName || 'Khách tại quầy'}</span>
                        </div>
                        {ticketData.customerPhone && (
                            <div className={styles.infoRow}>
                                <span className={styles.label}>SĐT:</span>
                                <span className={styles.val}>{ticketData.customerPhone}</span>
                            </div>
                        )}
                        <div className={styles.infoRow}>
                            <span className={styles.label}>Hình thức:</span>
                            <span className={styles.valText}>{ticketData.paymentMethod?.toUpperCase() || 'TIỀN MẶT'}</span>
                        </div>
                    </div>

                    {/* Snacks & Drinks if any */}
                    {servicesList.length > 0 && (
                        <div className={styles.servicesSection}>
                            <div className={styles.serviceTitle}>🍿 DỊCH VỤ BẮP NƯỚC:</div>
                            {servicesList.map((svc, idx) => (
                                <div key={idx} className={styles.serviceRow}>
                                    <span>{svc.name} x {svc.quantity || 1}</span>
                                    <span>{(parseInt(svc.price || 0, 10) * (svc.quantity || 1)).toLocaleString()}đ</span>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className={styles.dividerDots}>- - - - - - - - - - - - - - - - - - - - - - - -</div>

                    <div className={styles.totalRow}>
                        <span>TỔNG TIỀN:</span>
                        <span className={styles.totalAmount}>
                            {Number(ticketData.totalPrice || 0).toLocaleString()} VNĐ
                        </span>
                    </div>

                    {/* QR Code and Barcode */}
                    <div className={styles.qrSection}>
                        <div className={styles.qrBox}>
                            <QRCode
                                value={ticketData.id || ticketData.ticketCode || 'STREAMPHIM'}
                                size={120}
                                bordered={false}
                            />
                        </div>
                        <div className={styles.ticketCode}>
                            MÃ VÉ: <strong>{ticketData.ticketCode || ticketData.id?.substring(0, 8).toUpperCase()}</strong>
                        </div>
                        <div className={styles.ticketFooterNote}>
                            * Vui lòng xuất trình mã vé tại cửa vào rạp.<br />
                            * Vé đã mua không hoàn trả sau giờ chiếu. Chúc bạn xem phim vui vẻ!
                        </div>
                    </div>
                </div>

                {/* Print & Close Actions */}
                <div className={styles.actionsBar}>
                    <Button
                        type="primary"
                        icon={<PrinterOutlined />}
                        size="large"
                        className={styles.btnPrint}
                        onClick={handlePrint}
                    >
                        In Vé Ngay (Print)
                    </Button>
                    <Button size="large" onClick={onClose}>
                        Đóng
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default TicketModal;
