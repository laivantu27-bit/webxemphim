import React, { useState, useEffect } from 'react';
import { Table, Tag, Space, Button, Modal, Form, Input, InputNumber, Select, message, Popconfirm } from 'antd';
import {
    EnvironmentOutlined,
    PlusOutlined,
    ReloadOutlined,
    EditOutlined,
    DeleteOutlined,
    CompassOutlined,
} from '@ant-design/icons';
import {
    requestGetAllBranches,
    requestCreateBranch,
    requestUpdateBranch,
    requestDeleteBranch,
    requestSeedBranches,
} from '../../../../config/request';

const PROVINCES = [
    'Hà Nội',
    'Hồ Chí Minh',
    'Đà Nẵng',
    'Cần Thơ',
    'Hải Phòng',
    'Đồng Nai',
    'Bình Dương',
    'Khánh Hòa',
    'Thừa Thiên Huế',
    'Bà Rịa - Vũng Tàu',
];

function ManagerBranches() {
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingBranch, setEditingBranch] = useState(null);
    const [form] = Form.useForm();

    const fetchBranches = async () => {
        setLoading(true);
        try {
            const res = await requestGetAllBranches();
            setBranches(Array.isArray(res?.metadata) ? res.metadata : []);
        } catch (error) {
            message.error('Lỗi khi tải danh sách cụm rạp');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBranches();
    }, []);

    const handleOpenModal = (branch = null) => {
        setEditingBranch(branch);
        if (branch) {
            form.setFieldsValue(branch);
        } else {
            form.resetFields();
            form.setFieldsValue({
                brand: 'CGV',
                province: 'Hồ Chí Minh',
                totalRooms: 8,
                openHours: '08:00 - 23:30',
                status: 'active',
            });
        }
        setModalVisible(true);
    };

    const handleSave = async () => {
        try {
            const values = await form.validateFields();
            if (editingBranch) {
                await requestUpdateBranch({ id: editingBranch.id, ...values });
                message.success('Cập nhật cụm rạp thành công');
            } else {
                await requestCreateBranch(values);
                message.success('Thêm cụm rạp mới thành công');
            }
            setModalVisible(false);
            fetchBranches();
        } catch (error) {
            message.error(error?.response?.data?.message || 'Lỗi khi lưu cụm rạp');
        }
    };

    const handleDelete = async (id) => {
        try {
            await requestDeleteBranch(id);
            message.success('Xóa cụm rạp thành công');
            fetchBranches();
        } catch (error) {
            message.error('Lỗi khi xóa cụm rạp');
        }
    };

    const handleSeed = async () => {
        try {
            await requestSeedBranches();
            message.success('Khởi tạo lại danh sách cụm rạp CGV toàn quốc thành công');
            fetchBranches();
        } catch (error) {
            message.error('Lỗi khi khởi tạo cụm rạp');
        }
    };

    const columns = [
        {
            title: 'Tên cụm rạp',
            dataIndex: 'name',
            key: 'name',
            render: (text, r) => (
                <div>
                    <div style={{ fontWeight: 600, color: '#1677ff' }}>{text}</div>
                    <Tag color="red" style={{ fontSize: 11, marginTop: 2 }}>{r.brand || 'CGV'}</Tag>
                </div>
            ),
        },
        {
            title: 'Tỉnh / Thành',
            dataIndex: 'province',
            key: 'province',
            render: (text) => <Tag color="blue">{text}</Tag>,
        },
        {
            title: 'Địa chỉ chi tiết',
            dataIndex: 'address',
            key: 'address',
            ellipsis: true,
        },
        {
            title: 'Tọa độ GPS',
            key: 'gps',
            render: (_, r) => (
                <a
                    href={`https://www.google.com/maps?q=${r.lat},${r.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                >
                    <CompassOutlined /> {r.lat?.toFixed(4)}, {r.lng?.toFixed(4)}
                </a>
            ),
        },
        {
            title: 'Số phòng chiếu',
            dataIndex: 'totalRooms',
            key: 'totalRooms',
            align: 'center',
            render: (rooms) => <Tag color="purple">{rooms || 6} phòng</Tag>,
        },
        {
            title: 'Hotline',
            dataIndex: 'phone',
            key: 'phone',
            render: (p) => p || '1900 6017',
        },
        {
            title: 'Thao tác',
            key: 'action',
            align: 'center',
            render: (_, r) => (
                <Space>
                    <Button size="small" icon={<EditOutlined />} onClick={() => handleOpenModal(r)}>
                        Sửa
                    </Button>
                    <Popconfirm
                        title="Bạn có chắc muốn xóa cụm rạp này?"
                        onConfirm={() => handleDelete(r.id)}
                        okText="Xóa"
                        cancelText="Hủy"
                        okButtonProps={{ danger: true }}
                    >
                        <Button size="small" danger icon={<DeleteOutlined />}>
                            Xóa
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div style={{ padding: 24, background: '#fff', borderRadius: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>
                        <EnvironmentOutlined style={{ color: '#ef4444', marginRight: 8 }} />
                        Quản lý cụm rạp CGV các tỉnh thành
                    </h2>
                    <p style={{ margin: '4px 0 0', color: '#666', fontSize: 13 }}>
                        Quản lý danh sách chi nhánh, địa chỉ và tọa độ GPS phục vụ tính năng tìm rạp gần nhất
                    </p>
                </div>
                <Space>
                    <Button icon={<ReloadOutlined />} onClick={handleSeed}>
                        Khởi tạo dữ liệu CGV mẫu
                    </Button>
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()}>
                        Thêm cụm rạp mới
                    </Button>
                </Space>
            </div>

            <Table
                dataSource={branches}
                columns={columns}
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 8 }}
            />

            <Modal
                title={editingBranch ? 'Chỉnh sửa cụm rạp' : 'Thêm cụm rạp mới'}
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                onOk={handleSave}
                okText="Lưu rạp"
                cancelText="Hủy"
                width={650}
            >
                <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
                    <Form.Item
                        name="name"
                        label="Tên cụm rạp"
                        rules={[{ required: true, message: 'Vui lòng nhập tên rạp' }]}
                    >
                        <Input placeholder="Ví dụ: CGV Vincom Center Bà Triệu" />
                    </Form.Item>

                    <Form.Item name="province" label="Tỉnh / Thành phố" rules={[{ required: true }]}>
                        <Select options={PROVINCES.map((p) => ({ value: p, label: p }))} />
                    </Form.Item>

                    <Form.Item
                        name="address"
                        label="Địa chỉ chi tiết"
                        rules={[{ required: true, message: 'Vui lòng nhập địa chỉ' }]}
                    >
                        <Input placeholder="Số nhà, đường, phường, quận..." />
                    </Form.Item>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <Form.Item
                            name="lat"
                            label="Vĩ độ (Latitude GPS)"
                            rules={[{ required: true, message: 'Vui lòng nhập vĩ độ' }]}
                        >
                            <InputNumber style={{ width: '100%' }} step={0.0001} placeholder="Ví dụ: 10.7779" />
                        </Form.Item>

                        <Form.Item
                            name="lng"
                            label="Kinh độ (Longitude GPS)"
                            rules={[{ required: true, message: 'Vui lòng nhập kinh độ' }]}
                        >
                            <InputNumber style={{ width: '100%' }} step={0.0001} placeholder="Ví dụ: 106.7018" />
                        </Form.Item>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <Form.Item name="totalRooms" label="Số phòng chiếu">
                            <InputNumber style={{ width: '100%' }} min={1} max={30} />
                        </Form.Item>

                        <Form.Item name="phone" label="Số điện thoại / Hotline">
                            <Input placeholder="1900 6017" />
                        </Form.Item>
                    </div>

                    <Form.Item name="openHours" label="Giờ mở cửa">
                        <Input placeholder="08:00 - 23:30" />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}

export default ManagerBranches;

