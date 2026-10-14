import { useEffect, useState } from 'react';
import styles from './ManagerServices.module.scss';
import classNames from 'classnames/bind';
import { Table, Button, Modal, Form, Input, InputNumber, Select, Space, Tag, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import {
    requestGetAllServices,
    requestCreateService,
    requestUpdateService,
    requestDeleteService,
} from '../../../../config/request';

const cx = classNames.bind(styles);
const { TextArea } = Input;

function ManagerServices() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add');
    const [form] = Form.useForm();
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchServices = async () => {
        try {
            setLoading(true);
            const res = await requestGetAllServices();
            setServices(res.metadata || []);
        } catch (error) {
            message.error('Lỗi khi tải danh sách dịch vụ');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchServices();
    }, []);

    const columns = [
        {
            title: 'STT',
            key: 'index',
            width: 60,
            align: 'center',
            render: (_, __, index) => index + 1,
        },
        {
            title: 'Hình ảnh',
            dataIndex: 'image',
            key: 'image',
            width: 80,
            render: (img) => (
                <img
                    src={img || 'https://images.unsplash.com/photo-1572177812156-58036aae439c?w=100'}
                    alt="service"
                    className={cx('service-image')}
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1572177812156-58036aae439c?w=100';
                    }}
                />
            ),
        },
        {
            title: 'Tên dịch vụ',
            dataIndex: 'name',
            key: 'name',
            render: (text) => <strong>{text}</strong>,
        },
        {
            title: 'Phân loại',
            dataIndex: 'category',
            key: 'category',
            render: (cat) => {
                const map = {
                    combo: { color: 'purple', label: 'Combo Tiết Kiệm' },
                    food: { color: 'orange', label: 'Bắp / Đồ ăn' },
                    drink: { color: 'cyan', label: 'Nước uống' },
                };
                const item = map[cat] || { color: 'default', label: cat };
                return <Tag color={item.color}>{item.label}</Tag>;
            },
        },
        {
            title: 'Đơn giá',
            dataIndex: 'price',
            key: 'price',
            render: (price) => (
                <span style={{ color: '#d4380d', fontWeight: 'bold' }}>
                    {(price || 0).toLocaleString('vi-VN')} đ
                </span>
            ),
        },
        {
            title: 'Mô tả',
            dataIndex: 'description',
            key: 'description',
            ellipsis: true,
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (status) =>
                status === 'active' ? (
                    <Tag color="green">Đang bán</Tag>
                ) : (
                    <Tag color="red">Tạm ngưng</Tag>
                ),
        },
        {
            title: 'Thao tác',
            key: 'action',
            render: (_, record) => (
                <Space size="small">
                    <Button
                        type="primary"
                        icon={<EditOutlined />}
                        onClick={() => {
                            setModalMode('edit');
                            setIsModalOpen(true);
                            form.setFieldsValue({ ...record });
                        }}
                    >
                        Sửa
                    </Button>
                    <Button danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)}>
                        Xóa
                    </Button>
                </Space>
            ),
        },
    ];

    const handleDelete = (id) => {
        Modal.confirm({
            title: 'Xác nhận xóa',
            content: 'Bạn có chắc chắn muốn xóa dịch vụ này không?',
            okText: 'Xóa',
            cancelText: 'Hủy',
            okType: 'danger',
            onOk: async () => {
                try {
                    await requestDeleteService(id);
                    message.success('Đã xóa dịch vụ thành công');
                    await fetchServices();
                } catch (error) {
                    message.error('Lỗi khi xóa dịch vụ');
                }
            },
        });
    };

    const handleSubmit = async (values) => {
        try {
            if (modalMode === 'add') {
                await requestCreateService(values);
                message.success('Đã thêm dịch vụ thành công');
            } else {
                await requestUpdateService(values);
                message.success('Đã cập nhật dịch vụ thành công');
            }
            setIsModalOpen(false);
            form.resetFields();
            await fetchServices();
        } catch (error) {
            message.error(error?.response?.data?.message || 'Có lỗi xảy ra');
        }
    };

    return (
        <div className={cx('wrapper')}>
            <div className={cx('header')}>
                <h2>Quản lý Dịch vụ Bắp & Nước</h2>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => {
                        setModalMode('add');
                        setIsModalOpen(true);
                        form.resetFields();
                    }}
                >
                    Thêm dịch vụ mới
                </Button>
            </div>

            <Table
                columns={columns}
                dataSource={services}
                bordered
                loading={loading}
                rowKey="id"
                className={cx('service-table')}
                pagination={{ pageSize: 8 }}
            />

            <Modal
                title={modalMode === 'add' ? 'Thêm dịch vụ mới' : 'Sửa dịch vụ'}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                width={560}
            >
                <Form form={form} layout="vertical" onFinish={handleSubmit}>
                    <Form.Item name="id" hidden>
                        <Input />
                    </Form.Item>

                    <Form.Item
                        name="name"
                        label="Tên dịch vụ / món"
                        rules={[{ required: true, message: 'Vui lòng nhập tên dịch vụ!' }]}
                    >
                        <Input placeholder="VD: Bắp rang bơ phô mai, Coca-Cola size L" />
                    </Form.Item>

                    <Space style={{ width: '100%' }} size="large">
                        <Form.Item
                            name="category"
                            label="Phân loại"
                            initialValue="food"
                            rules={[{ required: true }]}
                            style={{ flex: 1 }}
                        >
                            <Select
                                options={[
                                    { value: 'combo', label: '🍿🥤 Combo Tiết Kiệm' },
                                    { value: 'food', label: '🍿 Bắp rang / Đồ ăn' },
                                    { value: 'drink', label: '🥤 Nước uống' },
                                ]}
                            />
                        </Form.Item>

                        <Form.Item
                            name="price"
                            label="Đơn giá (VNĐ)"
                            rules={[{ required: true, message: 'Vui lòng nhập đơn giá!' }]}
                            style={{ flex: 1 }}
                        >
                            <InputNumber
                                min={1000}
                                step={5000}
                                style={{ width: '100%' }}
                                placeholder="VD: 55000"
                                formatter={(val) => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                parser={(val) => val.replace(/\$\s?|(,*)/g, '')}
                            />
                        </Form.Item>
                    </Space>

                    <Form.Item name="image" label="Link hình ảnh (URL)">
                        <Input placeholder="https://..." />
                    </Form.Item>

                    <Form.Item name="description" label="Mô tả món">
                        <TextArea rows={2} placeholder="Chi tiết món, hương vị, kích cỡ..." />
                    </Form.Item>

                    <Form.Item name="status" label="Trạng thái" initialValue="active">
                        <Select
                            options={[
                                { value: 'active', label: '🟢 Đang mở bán' },
                                { value: 'inactive', label: '🔴 Tạm ngưng bán' },
                            ]}
                        />
                    </Form.Item>

                    <Form.Item className={cx('form-actions')}>
                        <Space>
                            <Button type="primary" htmlType="submit">
                                {modalMode === 'add' ? 'Thêm mới' : 'Lưu thay đổi'}
                            </Button>
                            <Button onClick={() => setIsModalOpen(false)}>Hủy</Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}

export default ManagerServices;
