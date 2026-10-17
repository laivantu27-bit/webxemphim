import React, { useState, useEffect } from 'react';
import { Table, Tag, Space, Button, Modal, Descriptions, Select, message, DatePicker, Row, Col } from 'antd';
import classNames from 'classnames/bind';
import styles from './ManagerOrder.module.scss';

import dayjs from 'dayjs';
import { requestGetPaymentByAdmin, requestUpdatePaymentStatus } from '../../../../config/request';

const cx = classNames.bind(styles);
const { RangePicker } = DatePicker;

function ManagerOrder() {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [statusFilter, setStatusFilter] = useState('all');
    const [dateRange, setDateRange] = useState(null);

    // Fetch payments data when component mounts

    const fetchPayments = async () => {
        try {
            setLoading(true);
            const response = await requestGetPaymentByAdmin();
            setPayments(Array.isArray(response?.metadata) ? response.metadata : []);
        } catch (error) {
            console.error('Error fetching payments:', error);
            message.error('Lỗi khi tải danh sách thanh toán');
            setPayments([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayments();
    }, []);

    const handleViewDetails = (record) => {
        setSelectedPayment(record);
        setIsModalVisible(true);
    };

    const handleStatusChange = async (newStatus, record) => {
        try {
            const data = {
                id: record.id,
                status: newStatus,
            };
            await requestUpdatePaymentStatus(data);
            message.success('Cập nhật trạng thái thành công');
            fetchPayments();
        } catch (error) {
            console.error('Error updating status:', error);
            message.error('Lỗi khi cập nhật trạng thái');
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            pending: 'gold',
            success: 'green',
            failed: 'red',
            canceled: 'default',
        };
        return colors[status?.toLowerCase()] || 'blue';
    };

    const getStatusText = (status) => {
        const statusText = {
            pending: 'Chờ xử lý',
            success: 'Thành công',
            failed: 'Thất bại',
            canceled: 'Đã hủy',
        };
        return statusText[status?.toLowerCase()] || status;
    };

    const handleFilterChange = (type, value) => {
        if (type === 'status') {
            setStatusFilter(value);
        } else if (type === 'date') {
            setDateRange(value);
        }
    };

    const getFilteredPayments = () => {
        let filteredPayments = Array.isArray(payments) ? [...payments] : [];

        // Filter by status
        if (statusFilter !== 'all') {
            filteredPayments = filteredPayments.filter((payment) => payment.status === statusFilter);
        }

        // Filter by date range
        if (dateRange && dateRange[0] && dateRange[1]) {
            const startDate = dateRange[0].startOf('day');
            const endDate = dateRange[1].endOf('day');
            filteredPayments = filteredPayments.filter((payment) => {
                const paymentDate = dayjs(payment.date);
                return paymentDate.isAfter(startDate) && paymentDate.isBefore(endDate);
            });
        }

        return filteredPayments;
    };

    const columns = [
        {
            title: 'Mã đơn',
            dataIndex: 'id',
            key: 'id',
            width: '12%',
            render: (id) => <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{id}</span>,
        },
        {
            title: 'Khách hàng',
            dataIndex: 'userId',
            key: 'userId',
            render: (userId, record) => (
                <div>
                    <div style={{ fontWeight: 600 }}>{record?.user?.fullName || record?.customerName || 'Khách vãng lai'}</div>
                    {record?.customerPhone && <div style={{ fontSize: 12, color: '#888' }}>SĐT: {record.customerPhone}</div>}
                    {record?.staffId && <Tag color="purple" style={{ marginTop: 2 }}>Bán tại quầy</Tag>}
                </div>
            ),
        },
        {
            title: 'Ảnh phim',
            dataIndex: 'movieId',
            key: 'movieImg',
            width: '7%',
            render: (movieId, record) => (
                <img
                    className={cx('image')}
                    src={record?.movie?.poster_url || record?.movie?.thumb_url || 'https://placehold.co/60x90?text=Film'}
                    alt="ảnh phim"
                    style={{ width: 45, height: 60, objectFit: 'cover', borderRadius: 4 }}
                />
            ),
        },
        {
            title: 'Tên phim',
            dataIndex: 'movieId',
            key: 'movieName',
            render: (movieId, record) => (
                <div>
                    <div style={{ fontWeight: 600 }}>{record?.movie?.name || 'Phim đã chiếu'}</div>
                    <div style={{ fontSize: 12, color: '#888' }}>
                        Suất: {record?.time} - {dayjs(record?.date).format('DD/MM/YYYY')}
                    </div>
                </div>
            ),
        },
        {
            title: 'Ghế',
            dataIndex: 'seatId',
            key: 'seatId',
            width: '10%',
            render: (seatId) => <Tag color="volcano">{seatId}</Tag>,
        },
        {
            title: 'Tổng tiền',
            dataIndex: 'totalPrice',
            key: 'totalPrice',
            width: '12%',
            align: 'right',
            render: (price) => <span className={cx('price')}>{Number(price || 0).toLocaleString('vi-VN')}đ</span>,
        },
        {
            title: 'Trạng thái',
            key: 'status',
            dataIndex: 'status',
            width: '14%',
            render: (status, record) => (
                <Select
                    value={status}
                    style={{ width: 130 }}
                    onChange={(newStatus) => handleStatusChange(newStatus, record)}
                    className={cx('status-select')}
                >
                    <Select.Option value="pending">
                        <Tag color="gold">Chờ xử lý</Tag>
                    </Select.Option>
                    <Select.Option value="success">
                        <Tag color="green">Thành công</Tag>
                    </Select.Option>
                    <Select.Option value="failed">
                        <Tag color="red">Thất bại</Tag>
                    </Select.Option>
                    <Select.Option value="canceled">
                        <Tag color="default">Đã hủy</Tag>
                    </Select.Option>
                </Select>
            ),
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: '10%',
            align: 'center',
            render: (_, record) => (
                <Button type="primary" onClick={() => handleViewDetails(record)} className={cx('action-button')}>
                    Chi tiết
                </Button>
            ),
        },
    ];

    return (
        <div className={cx('wrapper')}>
            <div className={cx('header')}>
                <h2 className={cx('title')}>Quản lý thanh toán vé xem phim</h2>
            </div>

            <div className={cx('filters')}>
                <Row gutter={16}>
                    <Col span={8}>
                        <Select
                            style={{ width: '100%' }}
                            placeholder="Lọc theo trạng thái"
                            value={statusFilter}
                            onChange={(value) => handleFilterChange('status', value)}
                        >
                            <Select.Option value="all">Tất cả trạng thái</Select.Option>
                            <Select.Option value="pending">Chờ xử lý</Select.Option>
                            <Select.Option value="success">Thành công</Select.Option>
                            <Select.Option value="failed">Thất bại</Select.Option>
                            <Select.Option value="canceled">Đã hủy</Select.Option>
                        </Select>
                    </Col>
                    <Col span={8}>
                        <RangePicker
                            style={{ width: '100%' }}
                            placeholder={['Từ ngày', 'Đến ngày']}
                            value={dateRange}
                            onChange={(value) => handleFilterChange('date', value)}
                            format="DD/MM/YYYY"
                        />
                    </Col>
                </Row>
            </div>

            <div className={cx('content')}>
                <Table
                    columns={columns}
                    dataSource={getFilteredPayments()}
                    rowKey="id"
                    pagination={{
                        pageSize: 10,
                        position: ['bottomCenter'],
                    }}
                    loading={loading}
                    className={cx('payment-table')}
                />
            </div>

            <Modal
                title={<div className={cx('modal-title')}>Chi tiết thanh toán</div>}
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                footer={null}
                width={700}
                className={cx('payment-modal')}
            >
                {selectedPayment && (
                    <Descriptions bordered column={1}>
                        <Descriptions.Item label="Mã thanh toán">{selectedPayment.id}</Descriptions.Item>
                        <Descriptions.Item label="Khách hàng">
                            {selectedPayment?.user?.fullName || selectedPayment?.customerName || 'Khách vãng lai'}
                            {selectedPayment?.customerPhone && ` (SĐT: ${selectedPayment.customerPhone})`}
                        </Descriptions.Item>
                        <Descriptions.Item label="Tên phim">{selectedPayment?.movie?.name || 'Phim đã lưu'}</Descriptions.Item>
                        {selectedPayment?.movie?.thumb_url && (
                            <Descriptions.Item label="Ảnh phim">
                                <img src={selectedPayment.movie.thumb_url} alt="ảnh phim" style={{ width: 80, borderRadius: 4 }} />
                            </Descriptions.Item>
                        )}
                        <Descriptions.Item label="Ghế">{selectedPayment.seatId}</Descriptions.Item>
                        <Descriptions.Item label="Thời gian">{selectedPayment.time}</Descriptions.Item>
                        <Descriptions.Item label="Ngày xem">
                            {dayjs(selectedPayment.date).format('DD/MM/YYYY')}
                        </Descriptions.Item>
                        <Descriptions.Item label="Tổng tiền">
                            {Number(selectedPayment.totalPrice || 0).toLocaleString('vi-VN')}đ
                        </Descriptions.Item>
                        <Descriptions.Item label="Trạng thái">
                            <Tag color={getStatusColor(selectedPayment.status)}>
                                {getStatusText(selectedPayment.status)}
                            </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Phương thức thanh toán">
                            {selectedPayment.paymentMethod === 'momo'
                                ? 'Ví MoMo'
                                : selectedPayment.paymentMethod === 'vnpay'
                                ? 'Cổng VNPay'
                                : selectedPayment.paymentMethod === 'cash'
                                ? 'Tiền mặt tại quầy'
                                : selectedPayment.paymentMethod === 'banking'
                                ? 'Chuyển khoản QR'
                                : selectedPayment.paymentMethod}
                        </Descriptions.Item>
                        {selectedPayment.voucherCode && (
                            <Descriptions.Item label="Mã giảm giá">
                                <Tag color="green">{selectedPayment.voucherCode}</Tag> (Giảm {Number(selectedPayment.discountAmount || 0).toLocaleString('vi-VN')}đ)
                            </Descriptions.Item>
                        )}
                    </Descriptions>
                )}
            </Modal>
        </div>
    );
}

export default ManagerOrder;
