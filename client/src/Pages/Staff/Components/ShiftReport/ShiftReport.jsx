import React, { useState, useEffect, useRef } from 'react';
import { Card, Row, Col, DatePicker, Button, Table, Tag, message, Spin, Statistic, Divider, Space } from 'antd';
import {
    FundOutlined,
    PrinterOutlined,
    DollarCircleOutlined,
    ShoppingOutlined,
    CoffeeOutlined,
    CheckCircleOutlined,
    ReloadOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { requestStaffGetShiftReport } from '../../../../config/request';
import styles from './ShiftReport.module.scss';

const ShiftReport = () => {
    const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const printableRef = useRef(null);

    useEffect(() => {
        fetchReport();
    }, [selectedDate]);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const res = await requestStaffGetShiftReport({ date: selectedDate });
            setReportData(res?.metadata);
        } catch (error) {
            message.error('Lỗi khi tải báo cáo ca làm việc');
        } finally {
            setLoading(false);
        }
    };

    const handlePrintShiftReport = () => {
        window.print();
    };

    const columns = [
        {
            title: 'Mã Giao Dịch',
            dataIndex: 'id',
            key: 'id',
            render: (text) => <span className={styles.codeText}>{text.substring(0, 8).toUpperCase()}</span>,
        },
        {
            title: 'Giờ',
            dataIndex: 'time',
            key: 'time',
            width: 100,
            render: (text) => <Tag color="blue">{text}</Tag>,
        },
        {
            title: 'Phim Chiếu',
            dataIndex: 'movieName',
            key: 'movieName',
            render: (text) => <strong>{text}</strong>,
        },
        {
            title: 'Ghế',
            dataIndex: 'seats',
            key: 'seats',
            render: (text) => <Tag color="geekblue">{text}</Tag>,
        },
        {
            title: 'Khách Hàng',
            dataIndex: 'customerName',
            key: 'customerName',
        },
        {
            title: 'Hình Thức',
            dataIndex: 'paymentMethod',
            key: 'paymentMethod',
            render: (method) => {
                const m = (method || '').toLowerCase();
                let color = 'cyan';
                let label = method?.toUpperCase();
                if (m === 'cash' || m === 'direct') {
                    color = 'green';
                    label = 'TIỀN MẶT';
                } else if (m === 'banking') {
                    color = 'purple';
                    label = 'CHUYỂN KHOẢN';
                }
                return <Tag color={color}>{label}</Tag>;
            },
        },
        {
            title: 'Tổng Tiền',
            dataIndex: 'totalPrice',
            key: 'totalPrice',
            align: 'right',
            render: (price) => (
                <span className={styles.priceHighlight}>
                    {Number(price || 0).toLocaleString()}đ
                </span>
            ),
        },
        {
            title: 'Soát Vé',
            dataIndex: 'isCheckIn',
            key: 'isCheckIn',
            align: 'center',
            render: (checked) =>
                checked ? (
                    <Tag color="green">ĐÃ VÀO</Tag>
                ) : (
                    <Tag color="default">CHƯA VÀO</Tag>
                ),
        },
    ];

    return (
        <div className={styles.container}>
            <Card className={styles.reportCard}>
                <div className={styles.headerBar}>
                    <div className={styles.titleInfo}>
                        <h2 className={styles.title}>
                            <FundOutlined /> Báo Cáo Ca Làm Việc & Kết Toán
                        </h2>
                        <p className={styles.subtitle}>
                            Theo dõi doanh thu bán vé tại quầy, bắp nước và số lượng soát vé trong ca
                        </p>
                    </div>

                    <div className={styles.controls}>
                        <DatePicker
                            size="large"
                            value={dayjs(selectedDate)}
                            format="DD/MM/YYYY"
                            onChange={(d) =>
                                setSelectedDate(d ? d.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'))
                            }
                        />
                        <Button
                            type="primary"
                            icon={<PrinterOutlined />}
                            size="large"
                            className={styles.btnPrint}
                            onClick={handlePrintShiftReport}
                        >
                            In Biên Bản Giao Ca
                        </Button>
                        <Button icon={<ReloadOutlined />} size="large" onClick={fetchReport} loading={loading}>
                            Tải Lại
                        </Button>
                    </div>
                </div>

                {loading ? (
                    <div className={styles.loadingBox}>
                        <Spin size="large" tip="Đang tính toán doanh thu ca..." />
                    </div>
                ) : (
                    <div className={styles.reportContent} ref={printableRef}>
                        {/* Printable Header - Only visible on Print */}
                        <div className={styles.printHeader}>
                            <h2>🎬 BIÊN BẢN BÁO CÁO KẾT TOÁN CA LÀM VIỆC</h2>
                            <p>Rạp chiếu phim: STREAMPHIM CINEMA</p>
                            <p>Ngày báo cáo: <strong>{dayjs(selectedDate).format('DD/MM/YYYY')}</strong></p>
                            <Divider style={{ margin: '8px 0' }} />
                        </div>

                        {/* Top KPI Cards */}
                        <Row gutter={[16, 16]} className={styles.kpiRow}>
                            <Col xs={24} sm={12} lg={6}>
                                <div className={`${styles.kpiCard} ${styles.totalKpi}`}>
                                    <div className={styles.kpiIcon}>💰</div>
                                    <div className={styles.kpiBody}>
                                        <div className={styles.kpiLabel}>Tổng Doanh Thu Ca</div>
                                        <div className={styles.kpiNumber}>
                                            {Number(reportData?.totalRevenue || 0).toLocaleString()}đ
                                        </div>
                                    </div>
                                </div>
                            </Col>

                            <Col xs={24} sm={12} lg={6}>
                                <div className={`${styles.kpiCard} ${styles.ticketKpi}`}>
                                    <div className={styles.kpiIcon}>🎟️</div>
                                    <div className={styles.kpiBody}>
                                        <div className={styles.kpiLabel}>Doanh Thu Vé Phim</div>
                                        <div className={styles.kpiNumber}>
                                            {Number(reportData?.ticketRevenue || 0).toLocaleString()}đ
                                        </div>
                                        <div className={styles.kpiSub}>
                                            Số lượng: {reportData?.totalTicketCount || 0} vé
                                        </div>
                                    </div>
                                </div>
                            </Col>

                            <Col xs={24} sm={12} lg={6}>
                                <div className={`${styles.kpiCard} ${styles.snackKpi}`}>
                                    <div className={styles.kpiIcon}>🍿</div>
                                    <div className={styles.kpiBody}>
                                        <div className={styles.kpiLabel}>Doanh Thu Bắp Nước</div>
                                        <div className={styles.kpiNumber}>
                                            {Number(reportData?.totalSnackRevenue || 0).toLocaleString()}đ
                                        </div>
                                        <div className={styles.kpiSub}>Dịch vụ kèm theo</div>
                                    </div>
                                </div>
                            </Col>

                            <Col xs={24} sm={12} lg={6}>
                                <div className={`${styles.kpiCard} ${styles.checkInKpi}`}>
                                    <div className={styles.kpiIcon}>🚪</div>
                                    <div className={styles.kpiBody}>
                                        <div className={styles.kpiLabel}>Lượt Soát Vé Vào Rạp</div>
                                        <div className={styles.kpiNumber}>
                                            {reportData?.checkedInCount || 0} lượt
                                        </div>
                                        <div className={styles.kpiSub}>Khách đã vào phòng chiếu</div>
                                    </div>
                                </div>
                            </Col>
                        </Row>

                        {/* Payment Breakdown Cards */}
                        <div className={styles.paymentSection}>
                            <h3 className={styles.subTitle}>💵 Doanh Thu Theo Phương Thức Thanh Toán:</h3>
                            <Row gutter={[16, 16]}>
                                <Col xs={12} md={6}>
                                    <div className={styles.payBox}>
                                        <div className={styles.payName}>💵 Tiền mặt (Cash):</div>
                                        <div className={`${styles.payAmount} ${styles.green}`}>
                                            {Number(reportData?.paymentBreakdown?.cash || 0).toLocaleString()}đ
                                        </div>
                                    </div>
                                </Col>
                                <Col xs={12} md={6}>
                                    <div className={styles.payBox}>
                                        <div className={styles.payName}>💳 Chuyển khoản QR:</div>
                                        <div className={`${styles.payAmount} ${styles.purple}`}>
                                            {Number(reportData?.paymentBreakdown?.banking || 0).toLocaleString()}đ
                                        </div>
                                    </div>
                                </Col>
                                <Col xs={12} md={6}>
                                    <div className={styles.payBox}>
                                        <div className={styles.payName}>📲 Ví MoMo:</div>
                                        <div className={`${styles.payAmount} ${styles.pink}`}>
                                            {Number(reportData?.paymentBreakdown?.momo || 0).toLocaleString()}đ
                                        </div>
                                    </div>
                                </Col>
                                <Col xs={12} md={6}>
                                    <div className={styles.payBox}>
                                        <div className={styles.payName}>📲 Ví VNPay:</div>
                                        <div className={`${styles.payAmount} ${styles.blue}`}>
                                            {Number(reportData?.paymentBreakdown?.vnpay || 0).toLocaleString()}đ
                                        </div>
                                    </div>
                                </Col>
                            </Row>
                        </div>

                        {/* Shift Transactions Table */}
                        <div className={styles.tableSection}>
                            <h3 className={styles.subTitle}>
                                📋 Danh Sách Giao Dịch Trong Ca ({reportData?.transactions?.length || 0}):
                            </h3>
                            <Table
                                columns={columns}
                                dataSource={reportData?.transactions || []}
                                rowKey="id"
                                pagination={{ pageSize: 10 }}
                                className={styles.customTable}
                            />
                        </div>

                        {/* Signatures for Print */}
                        <div className={styles.signatureSection}>
                            <Row gutter={40}>
                                <Col span={12} style={{ textAlign: 'center' }}>
                                    <p><strong>Người Lập Báo Cáo / Nhân Viên</strong></p>
                                    <p style={{ color: '#888', fontSize: 11 }}>(Ký và ghi rõ họ tên)</p>
                                    <div style={{ height: 60 }}></div>
                                </Col>
                                <Col span={12} style={{ textAlign: 'center' }}>
                                    <p><strong>Quản Lý Ca Trực / Thu Ngân Trưởng</strong></p>
                                    <p style={{ color: '#888', fontSize: 11 }}>(Ký và ghi rõ họ tên)</p>
                                    <div style={{ height: 60 }}></div>
                                </Col>
                            </Row>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default ShiftReport;
