import { useEffect, useState } from 'react';
import styles from './ManagerVouchers.module.scss';
import classNames from 'classnames/bind';
import {
    Table,
    Button,
    Modal,
    Form,
    Input,
    InputNumber,
    Select,
    Space,
    Tag,
    message,
    Tooltip,
    Card,
    Row,
    Col,
    Statistic,
} from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    TagOutlined,
    CopyOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
} from '@ant-design/icons';
import {
    requestGetAllVouchers,
    requestCreateVoucher,
    requestUpdateVoucher,
    requestDeleteVoucher,
} from '../../../../config/request';

const cx = classNames.bind(styles);
const { TextArea } = Input;

function ManagerVouchers() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
    const [form] = Form.useForm();
    const [vouchers, setVouchers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editingVoucher, setEditingVoucher] = useState(null);
    const [discountTypeWatch, setDiscountTypeWatch] = useState('fixed');

    const fetchVouchers = async () => {
        try {
            setLoading(true);
            const res = await requestGetAllVouchers();
            setVouchers(res.metadata || []);
        } catch (error) {
            message.error('Lỗi khi tải danh sách mã giảm giá');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVouchers();
    }, []);

    const handleOpenAddModal = () => {
        setModalMode('add');
        setEditingVoucher(null);
        setDiscountTypeWatch('fixed');
        form.resetFields();
        form.setFieldsValue({
            discountType: 'fixed',
            minOrderValue: 100000,
            quantity: 100,
            status: 'active',
            discountValue: 20000,
        });
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (voucher) => {
        setModalMode('edit');
        setEditingVoucher(voucher);
        setDiscountTypeWatch(voucher.discountType || 'fixed');
        form.setFieldsValue({
            code: voucher.code,
            description: voucher.description,
            discountType: voucher.discountType,
            discountValue: voucher.discountValue,
            minOrderValue: voucher.minOrderValue || 0,
            maxDiscount: voucher.maxDiscount || 0,
            quantity: voucher.quantity || 100,
            status: voucher.status || 'active',
        });
        setIsModalOpen(true);
    };

    const handleFormSubmit = async (values) => {
        try {
            if (modalMode === 'add') {
                await requestCreateVoucher(values);
                message.success(`Tạo mã giảm giá "${values.code}" thành công`);
            } else {
                await requestUpdateVoucher({
                    id: editingVoucher.id,
                    ...values,
                });
                message.success('Cập nhật mã giảm giá thành công');
            }
            setIsModalOpen(false);
            fetchVouchers();
        } catch (error) {
            message.error(error.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại');
        }
    };

    const handleDelete = (id, code) => {
        Modal.confirm({
            title: 'Xác nhận xóa mã giảm giá',
            content: `Bạn có chắc chắn muốn xóa mã "${code}" không? Thao tác này không thể hoàn tác.`,
            okText: 'Xóa',
            okType: 'danger',
            cancelText: 'Hủy',
            onOk: async () => {
                try {
                    await requestDeleteVoucher(id);
                    message.success(`Đã xóa mã giảm giá "${code}"`);
                    fetchVouchers();
                } catch (error) {
                    message.error(error.response?.data?.message || 'Không thể xóa mã giảm giá');
                }
            },
        });
    };

    const handleCopyCode = (code) => {
        navigator.clipboard.writeText(code);
        message.success(`Đã sao chép mã: ${code}`);
    };

    const columns = [
        {
            title: 'STT',
            key: 'index',
            width: 55,
            align: 'center',
            render: (_, __, index) => index + 1,
        },
        {
            title: 'Mã Giảm Giá',
            dataIndex: 'code',
            key: 'code',
            width: 140,
            render: (code) => (
                <Tooltip title="Nhấp để sao chép mã">
                    <span className={cx('code-badge')} onClick={() => handleCopyCode(code)}>
                        {code} <CopyOutlined style={{ fontSize: 12, marginLeft: 4 }} />
                    </span>
                </Tooltip>
            ),
        },
        {
            title: 'Mô tả ưu đãi',
            dataIndex: 'description',
            key: 'description',
            ellipsis: true,
        },
        {
            title: 'Mức giảm giá',
            key: 'discountValue',
            width: 140,
            render: (_, record) => {
                if (record.discountType === 'percent') {
                    return (
                        <Space direction="vertical" size={2}>
                            <Tag color="magenta" style={{ fontWeight: 'bold', fontSize: 13 }}>
                                Giảm {record.discountValue}%
                            </Tag>
                            {record.maxDiscount > 0 && (
                                <span style={{ fontSize: 11, color: '#888' }}>
                                    Tối đa {(record.maxDiscount || 0).toLocaleString('vi-VN')} đ
                                </span>
                            )}
                        </Space>
                    );
                }
                return (
                    <Tag color="red" style={{ fontWeight: 'bold', fontSize: 13 }}>
                        -{(record.discountValue || 0).toLocaleString('vi-VN')} đ
                    </Tag>
                );
            },
        },
        {
            title: 'Đơn hàng tối thiểu (Điều kiện)',
            dataIndex: 'minOrderValue',
            key: 'minOrderValue',
            width: 180,
            render: (val) => (
                <div className={cx('min-order-tag')}>
                    <span style={{ marginRight: 4 }}>🛒 Từ:</span>
                    <strong>{(val || 0).toLocaleString('vi-VN')} đ</strong>
                </div>
            ),
        },
        {
            title: 'Số lượng / Đã dùng',
            key: 'usage',
            width: 140,
            align: 'center',
            render: (_, record) => {
                const used = record.usedCount || 0;
                const total = record.quantity || 0;
                const isFull = used >= total;
                return (
                    <Tag color={isFull ? 'error' : 'blue'}>
                        {used} / {total} {isFull ? '(Hết lượt)' : ''}
                    </Tag>
                );
            },
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            width: 120,
            align: 'center',
            render: (status) =>
                status === 'active' ? (
                    <Tag icon={<CheckCircleOutlined />} color="success">
                        Hoạt động
                    </Tag>
                ) : (
                    <Tag icon={<CloseCircleOutlined />} color="default">
                        Tạm dừng
                    </Tag>
                ),
        },
        {
            title: 'Hành động',
            key: 'action',
            width: 110,
            align: 'center',
            render: (_, record) => (
                <Space size="middle">
                    <Tooltip title="Chỉnh sửa">
                        <Button
                            type="text"
                            icon={<EditOutlined style={{ color: '#1890ff' }} />}
                            onClick={() => handleOpenEditModal(record)}
                        />
                    </Tooltip>
                    <Tooltip title="Xóa">
                        <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => handleDelete(record.id, record.code)}
                        />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    // Stats
    const totalVouchers = vouchers.length;
    const activeVouchers = vouchers.filter((v) => v.status === 'active').length;
    const totalUsed = vouchers.reduce((sum, v) => sum + (v.usedCount || 0), 0);

    return (
        <div className={cx('wrapper')}>
            <div className={cx('header')}>
                <div>
                    <h2>🏷️ Quản Lý Mã Giảm Giá & Khuyến Mãi</h2>
                    <p style={{ margin: '4px 0 0', color: '#666', fontSize: 13 }}>
                        Thiết lập điều kiện khuyến mãi: Giảm giá khi mua bao nhiêu tiền trở lên (vé + bắp nước)
                    </p>
                </div>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleOpenAddModal}
                    size="large"
                    style={{ background: '#e50914', borderColor: '#e50914' }}
                >
                    Thêm mã giảm giá mới
                </Button>
            </div>

            {/* Quick stats cards */}
            <Row gutter={16} style={{ marginBottom: 20 }}>
                <Col span={8}>
                    <Card bordered={false} style={{ background: '#f6ffed', border: '1px solid #b7eb8f' }}>
                        <Statistic
                            title="Mã đang hoạt động"
                            value={activeVouchers}
                            suffix={`/ ${totalVouchers} mã`}
                            valueStyle={{ color: '#52c41a', fontWeight: 'bold' }}
                            prefix={<TagOutlined />}
                        />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card bordered={false} style={{ background: '#e6f7ff', border: '1px solid #91d5ff' }}>
                        <Statistic
                            title="Lượt khách đã áp dụng"
                            value={totalUsed}
                            valueStyle={{ color: '#1890ff', fontWeight: 'bold' }}
                            suffix="lượt"
                        />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card bordered={false} style={{ background: '#fff7e6', border: '1px solid #ffd591' }}>
                        <Statistic
                            title="Mã giảm giá cao nhất"
                            value={
                                vouchers.length > 0
                                    ? Math.max(
                                          ...vouchers
                                              .filter((v) => v.discountType === 'fixed')
                                              .map((v) => v.discountValue || 0),
                                          0,
                                      ).toLocaleString('vi-VN')
                                    : '0'
                            }
                            suffix="đ"
                            valueStyle={{ color: '#fa8c16', fontWeight: 'bold' }}
                        />
                    </Card>
                </Col>
            </Row>

            <Table
                className={cx('voucher-table')}
                columns={columns}
                dataSource={vouchers}
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 8 }}
            />

            <Modal
                title={
                    <span style={{ fontSize: 18, fontWeight: 700 }}>
                        {modalMode === 'add' ? '🎟️ Tạo Mã Giảm Giá Mới' : '✏️ Chỉnh Sửa Mã Giảm Giá'}
                    </span>
                }
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                width={650}
                destroyOnClose
            >
                <Form form={form} layout="vertical" onFinish={handleFormSubmit} style={{ marginTop: 16 }}>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="code"
                                label="Mã giảm giá (Code)"
                                rules={[
                                    { required: true, message: 'Vui lòng nhập mã giảm giá' },
                                    { min: 3, message: 'Mã tối thiểu 3 ký tự' },
                                ]}
                            >
                                <Input
                                    placeholder="VD: GIAM20K, COMBO50"
                                    style={{ textTransform: 'uppercase', fontWeight: 600 }}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="status"
                                label="Trạng thái hoạt động"
                                rules={[{ required: true }]}
                            >
                                <Select>
                                    <Select.Option value="active">🟢 Hoạt động</Select.Option>
                                    <Select.Option value="inactive">🔴 Tạm dừng</Select.Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item name="description" label="Mô tả ưu đãi cho khách hàng">
                        <TextArea
                            rows={2}
                            placeholder="VD: Giảm 20.000đ khi đặt vé kèm bắp nước từ 150.000đ trở lên"
                        />
                    </Form.Item>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="discountType"
                                label="Loại giảm giá"
                                rules={[{ required: true }]}
                            >
                                <Select onChange={(val) => setDiscountTypeWatch(val)}>
                                    <Select.Option value="fixed">Giảm số tiền cố định (VNĐ)</Select.Option>
                                    <Select.Option value="percent">Giảm theo phần trăm (%)</Select.Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="discountValue"
                                label={discountTypeWatch === 'fixed' ? 'Mức giảm (VNĐ)' : 'Mức giảm (%)'}
                                rules={[{ required: true, message: 'Vui lòng nhập mức giảm' }]}
                            >
                                <InputNumber
                                    min={1}
                                    max={discountTypeWatch === 'percent' ? 100 : 10000000}
                                    style={{ width: '100%' }}
                                    formatter={(value) =>
                                        discountTypeWatch === 'fixed'
                                            ? `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                                            : `${value}%`
                                    }
                                    parser={(value) => value.replace(/\$\s?|(,*)|(%*)/g, '')}
                                    placeholder={discountTypeWatch === 'fixed' ? '20,000' : '10%'}
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    {/* CORE USER REQUIREMENT: ĐIỀU KIỆN MUA TỪ BAO NHIÊU TIỀN TRỞ LÊN */}
                    <div
                        style={{
                            background: '#fffbe6',
                            border: '1px solid #ffe58f',
                            borderRadius: 8,
                            padding: '12px 16px',
                            marginBottom: 16,
                        }}
                    >
                        <Form.Item
                            name="minOrderValue"
                            label={
                                <span style={{ fontWeight: 700, color: '#d46b08' }}>
                                    🛒 Điều kiện: Đơn hàng tối thiểu để được giảm giá (VNĐ) *
                                </span>
                            }
                            rules={[{ required: true, message: 'Vui lòng nhập đơn hàng tối thiểu' }]}
                            extra="Khách hàng phải mua tổng tiền vé + bắp nước từ số tiền này trở lên mới được dùng mã."
                            style={{ marginBottom: 0 }}
                        >
                            <InputNumber
                                min={0}
                                step={10000}
                                style={{ width: '100%', fontWeight: 'bold' }}
                                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                                placeholder="VD: 150000 (mua từ 150.000đ trở lên)"
                            />
                        </Form.Item>
                    </div>

                    <Row gutter={16}>
                        {discountTypeWatch === 'percent' && (
                            <Col span={12}>
                                <Form.Item
                                    name="maxDiscount"
                                    label="Mức giảm tối đa (VNĐ)"
                                    extra="0 = Không giới hạn"
                                >
                                    <InputNumber
                                        min={0}
                                        style={{ width: '100%' }}
                                        formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                        parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                                        placeholder="VD: 50000"
                                    />
                                </Form.Item>
                            </Col>
                        )}
                        <Col span={discountTypeWatch === 'percent' ? 12 : 24}>
                            <Form.Item
                                name="quantity"
                                label="Số lượng mã phát hành"
                                rules={[{ required: true, message: 'Vui lòng nhập số lượng' }]}
                            >
                                <InputNumber min={1} max={100000} style={{ width: '100%' }} placeholder="100" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <div className={cx('form-actions')}>
                        <Space>
                            <Button onClick={() => setIsModalOpen(false)}>Hủy</Button>
                            <Button
                                type="primary"
                                htmlType="submit"
                                style={{ background: '#e50914', borderColor: '#e50914' }}
                            >
                                {modalMode === 'add' ? 'Tạo mã giảm giá' : 'Lưu thay đổi'}
                            </Button>
                        </Space>
                    </div>
                </Form>
            </Modal>
        </div>
    );
}

export default ManagerVouchers;

