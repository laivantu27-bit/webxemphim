import React, { useState, useEffect } from 'react';
import {
    Card,
    Table,
    Input,
    Select,
    DatePicker,
    Button,
    Tag,
    Space,
    Popconfirm,
    message,
    Tooltip,
    Modal,
} from 'antd';
import {
    HistoryOutlined,
    SearchOutlined,
    PrinterOutlined,
    CloseCircleOutlined,
    ReloadOutlined,
    CheckCircleOutlined,
    EyeOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { requestStaffGetTransactions, requestStaffCancelTransaction } from '../../../../config/request';
import TicketModal from '../TicketModal/TicketModal';
import styles from './TransactionHistory.module.scss';

const TransactionHistory = () => {
    const [transactions, setTransactions] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(15);
    const [search, setSearch] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('');
    const [isCheckIn, setIsCheckIn] = useState('');
    const [selectedDate, setSelectedDate] = useState(null);
    const [loading, setLoading] = useState(false);

    // Reprint modal state
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [ticketModalVisible, setTicketModalVisible] = useState(false);

    useEffect(() => {
        fetchTransactions();
    }, [page, pageSize, paymentMethod, isCheckIn, selectedDate]);

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const params = {
                page,
                limit: pageSize,
                search: search.trim(),
                paymentMethod,
                isCheckIn,
                date: selectedDate ? selectedDate.format('YYYY-MM-DD') : '',
            };

            const res = await requestStaffGetTransactions(params);
            const meta = res?.metadata;
            if (meta) {
                setTransactions(meta.transactions || []);
                setTotal(meta.total || 0);
            }
        } catch (error) {
            message.error('Lỗi khi tải lịch sử giao dịch');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        setPage(1);
        fetchTransactions();
    };

    const handleReset = () => {
        setSearch('');
        setPaymentMethod('');
        setIsCheckIn('');
        setSelectedDate(null);
        setPage(1);
    };

    const handleCancelTransaction = async (paymentId) => {
        try {
            const res = await requestStaffCancelTransaction({
                paymentId,
                reason: 'Nhân viên hủy vé tại quầy theo yêu cầu của khách',
            });
            message.success(res?.message || 'Hủy giao dịch và hoàn ghế thành công');
            fetchTransactions();
        } catch (error) {
            message.error(error.response?.data?.message || 'Không thể hủy vé');
        }
    };

    const handleReprint = (record) => {
        const ticketInfo = {
            id: record.id,
            ticketCode: record.ticketCode,
            movie: {
                name: record.movieName,
                poster_url: record.moviePoster,
            },
            seats: record.seats ? record.seats.split(',').map((s) => s.trim()) : [],
            room: 'Phòng chiếu 1 (StreamPhim Cinema)',
            date: record.showDate,
            time: record.showTime,
            totalPrice: record.totalPrice,
            paymentMethod: record.paymentMethod,
            status: record.status,
            isCheckIn: record.isCheckIn,
            customerName: record.customerName,
            customerPhone: record.customerPhone,
        };
        setSelectedTicket(ticketInfo);
        setTicketModalVisible(true);
    };

    const columns = [
        {
            title: 'Mã Vé',
            dataIndex: 'ticketCode',
            key: 'ticketCode',
            width: 110,
            render: (code) => <span className={styles.codeText}>{code}</span>,
        },
        {
            title: 'Ngày Tạo',
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: 140,
            render: (text) => <span style={{ color: '#aaa' }}>{text}</span>,
        },
        {
            title: 'Phim Chiếu',
            dataIndex: 'movieName',
            key: 'movieName',
            render: (name) => <strong className={styles.movieTitle}>{name}</strong>,
        },
        {
            title: 'Suất Chiếu',
            key: 'showtime',
            width: 150,
            render: (_, r) => (
                <div className={styles.showtimeCell}>
                    <div>📅 {r.showDate}</div>
                    <Tag color="volcano" style={{ marginTop: 2 }}>{r.showTime}</Tag>
                </div>
            ),
        },
        {
            title: 'Vị Trí Ghế',
            dataIndex: 'seats',
            key: 'seats',
            render: (seats) => <Tag color="blue">{seats}</Tag>,
        },
        {
            title: 'Khách Hàng',
            key: 'customer',
            render: (_, r) => (
                <div>
                    <div style={{ fontWeight: 600 }}>{r.customerName}</div>
                    {r.customerPhone && <div style={{ fontSize: 11.5, color: '#888' }}>{r.customerPhone}</div>}
                </div>
            ),
        },
        {
            title: 'Tổng Tiền',
            dataIndex: 'totalPrice',
            key: 'totalPrice',
            align: 'right',
            render: (price) => (
                <strong className={styles.priceText}>
                    {Number(price || 0).toLocaleString()}đ
                </strong>
            ),
        },
        {
            title: 'Thanh Toán',
            dataIndex: 'paymentMethod',
            key: 'paymentMethod',
            align: 'center',
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
            title: 'Trạng Thái',
            key: 'status',
            align: 'center',
            render: (_, r) => {
                if (r.status === 'canceled') {
                    return <Tag color="red">ĐÃ HỦY VÉ</Tag>;
                }
                if (r.isCheckIn) {
                    return <Tag color="green">ĐÃ VÀO RẠP</Tag>;
                }
                return <Tag color="orange">CHƯA SOÁT</Tag>;
            },
        },
        {
            title: 'Thao Tác',
            key: 'actions',
            align: 'center',
            width: 140,
            render: (_, record) => (
                <Space size="small">
                    <Tooltip title="In lại vé">
                        <Button
                            type="primary"
                            icon={<PrinterOutlined />}
                            size="small"
                            onClick={() => handleReprint(record)}
                        />
                    </Tooltip>

                    {record.status !== 'canceled' && !record.isCheckIn && (
                        <Popconfirm
                            title="Xác nhận hủy vé & hoàn ghế?"
                            description="Hành động này sẽ hủy giao dịch và mở lại ghế cho khách khác đặt."
                            okText="Hủy Vé"
                            cancelText="Không"
                            okButtonProps={{ danger: true }}
                            onConfirm={() => handleCancelTransaction(record.id)}
                        >
                            <Tooltip title="Hủy vé / Trả vé">
                                <Button danger icon={<CloseCircleOutlined />} size="small" />
                            </Tooltip>
                        </Popconfirm>
                    )}
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
                            <HistoryOutlined /> Lịch Sử Giao Dịch & Quản Lý Vé
                        </h2>
                        <p className={styles.subtitle}>
                            Tra cứu toàn bộ vé bán tại quầy và online, in lại vé và xử lý hoàn/hủy vé
                        </p>
                    </div>

                    <Button icon={<ReloadOutlined />} onClick={fetchTransactions} loading={loading}>
                        Làm Mới
                    </Button>
                </div>

                {/* Filter Toolbar */}
                <div className={styles.filterBar}>
                    <Input
                        placeholder="Tìm theo tên khách, SĐT, mã vé..."
                        prefix={<SearchOutlined />}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onPressEnter={handleSearch}
                        style={{ width: 260 }}
                        size="large"
                        allowClear
                    />

                    <Select
                        placeholder="Phương thức"
                        value={paymentMethod || undefined}
                        onChange={(val) => setPaymentMethod(val || '')}
                        style={{ width: 150 }}
                        size="large"
                        allowClear
                        options={[
                            { value: 'cash', label: '💵 Tiền mặt' },
                            { value: 'banking', label: '💳 Chuyển khoản' },
                            { value: 'momo', label: '📲 MoMo' },
                            { value: 'vnpay', label: '📲 VNPay' },
                        ]}
                    />

                    <Select
                        placeholder="Tình trạng soát vé"
                        value={isCheckIn || undefined}
                        onChange={(val) => setIsCheckIn(val || '')}
                        style={{ width: 160 }}
                        size="large"
                        allowClear
                        options={[
                            { value: 'true', label: '✅ Đã vào rạp' },
                            { value: 'false', label: '⏳ Chưa soát vé' },
                        ]}
                    />

                    <DatePicker
                        placeholder="Chọn ngày giao dịch"
                        value={selectedDate}
                        onChange={(d) => setSelectedDate(d)}
                        format="DD/MM/YYYY"
                        size="large"
                        allowClear
                    />

                    <Button type="primary" size="large" onClick={handleSearch} icon={<SearchOutlined />}>
                        Tìm Kiếm
                    </Button>

                    <Button size="large" onClick={handleReset}>
                        Đặt Lại
                    </Button>
                </div>

                {/* Transactions Table */}
                <Table
                    columns={columns}
                    dataSource={transactions}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                        current: page,
                        pageSize,
                        total,
                        onChange: (p, ps) => {
                            setPage(p);
                            setPageSize(ps);
                        },
                        showSizeChanger: true,
                        pageSizeOptions: ['10', '15', '25', '50'],
                    }}
                    className={styles.customTable}
                />
            </Card>

            {/* Reprint Ticket Modal */}
            <TicketModal
                visible={ticketModalVisible}
                onClose={() => setTicketModalVisible(false)}
                ticketData={selectedTicket}
            />
        </div>
    );
};

export default TransactionHistory;
