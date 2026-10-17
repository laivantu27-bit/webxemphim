import { useEffect, useState } from 'react';
import { Table, Space, Button, message, Modal, Form, Select, Tag, Badge } from 'antd';
import { EditOutlined, TeamOutlined, SafetyCertificateOutlined, UserOutlined } from '@ant-design/icons';
import classNames from 'classnames/bind';
import styles from './ManagerUser.module.scss';
import { requestGetUserByAdmin, requestUpdateRoleUser } from '../../../../config/request';

const cx = classNames.bind(styles);

// Hàm lấy role thực từ user (hỗ trợ cả field cũ isAdmin và mới role)
const getUserRole = (user) => {
    if (user.role && user.role !== 'customer') return user.role;
    if (user.role === 'customer') return 'customer';
    return user.isAdmin === '1' ? 'admin' : 'customer';
};

const roleConfig = {
    admin: { label: 'Admin', color: 'red', icon: <SafetyCertificateOutlined /> },
    staff: { label: 'Nhân viên', color: 'blue', icon: <TeamOutlined /> },
    customer: { label: 'Khách hàng', color: 'green', icon: <UserOutlined /> },
};

function ManagerUser() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [form] = Form.useForm();

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await requestGetUserByAdmin();
            setUsers(res.metadata);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleEditUser = (user) => {
        setSelectedUser(user);
        form.setFieldsValue({
            userId: user.id,
            role: getUserRole(user),
        });
        setIsModalVisible(true);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        setSelectedUser(null);
        form.resetFields();
    };

    const handleOk = () => {
        form.submit();
    };

    const handleFinish = async (values) => {
        await requestUpdateRoleUser(values);
        await fetchUsers();
        message.success(`Cập nhật vai trò người dùng thành công`);
        setIsModalVisible(false);
    };

    const columns = [
        {
            title: 'Họ và tên',
            dataIndex: 'fullName',
            key: 'fullName',
            sorter: (a, b) => a.fullName.localeCompare(b.fullName),
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
        },
        {
            title: 'Số điện thoại',
            dataIndex: 'phone',
            key: 'phone',
        },
        {
            title: 'Vai trò',
            key: 'role',
            render: (_, record) => {
                const role = getUserRole(record);
                const config = roleConfig[role] || roleConfig.customer;
                return (
                    <Tag color={config.color} icon={config.icon}>
                        {config.label}
                    </Tag>
                );
            },
            filters: [
                { text: 'Admin', value: 'admin' },
                { text: 'Nhân viên', value: 'staff' },
                { text: 'Khách hàng', value: 'customer' },
            ],
            onFilter: (value, record) => getUserRole(record) === value,
        },
        {
            title: 'Thao tác',
            key: 'action',
            render: (_, record) => (
                <Space size="middle">
                    <Button
                        type="primary"
                        icon={<EditOutlined />}
                        onClick={() => handleEditUser(record)}
                        className={cx('edit-btn')}
                    >
                        Sửa quyền
                    </Button>
                </Space>
            ),
        },
    ];

    return (
        <div className={cx('wrapper')}>
            <h2 className={cx('title')}>Quản lý người dùng</h2>

            {/* Summary badges */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                <Badge count={users.filter((u) => getUserRole(u) === 'admin').length} color="red">
                    <Tag icon={<SafetyCertificateOutlined />} color="red" style={{ padding: '4px 12px', fontSize: 13 }}>
                        Admin
                    </Tag>
                </Badge>
                <Badge count={users.filter((u) => getUserRole(u) === 'staff').length} color="blue">
                    <Tag icon={<TeamOutlined />} color="blue" style={{ padding: '4px 12px', fontSize: 13 }}>
                        Nhân viên
                    </Tag>
                </Badge>
                <Badge count={users.filter((u) => getUserRole(u) === 'customer').length} color="green">
                    <Tag icon={<UserOutlined />} color="green" style={{ padding: '4px 12px', fontSize: 13 }}>
                        Khách hàng
                    </Tag>
                </Badge>
            </div>

            <Table
                columns={columns}
                dataSource={users}
                rowKey="id"
                loading={loading}
                pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showTotal: (total) => `Tổng số ${total} người dùng`,
                }}
            />

            <Modal
                title="Chỉnh sửa vai trò người dùng"
                open={isModalVisible}
                onOk={handleOk}
                onCancel={handleCancel}
                okText="Cập nhật"
                cancelText="Hủy"
                className={cx('permission-modal')}
            >
                {selectedUser && (
                    <div
                        className={cx('user-info')}
                        style={{ marginBottom: 16, padding: '12px', background: '#f5f5f5', borderRadius: 8 }}
                    >
                        <p>
                            <strong>Họ và tên:</strong> {selectedUser.fullName}
                        </p>
                        <p>
                            <strong>Email:</strong> {selectedUser.email}
                        </p>
                        <p>
                            <strong>Vai trò hiện tại:</strong>{' '}
                            {(() => {
                                const role = getUserRole(selectedUser);
                                const config = roleConfig[role] || roleConfig.customer;
                                return (
                                    <Tag color={config.color} icon={config.icon}>
                                        {config.label}
                                    </Tag>
                                );
                            })()}
                        </p>
                    </div>
                )}
                <Form form={form} layout="vertical" onFinish={handleFinish}>
                    <Form.Item name="userId" hidden>
                        <input />
                    </Form.Item>
                    <Form.Item
                        name="role"
                        label="Vai trò mới"
                        rules={[{ required: true, message: 'Vui lòng chọn vai trò!' }]}
                    >
                        <Select size="large">
                            <Select.Option value="customer">
                                <Tag color="green" icon={<UserOutlined />}>
                                    Khách hàng
                                </Tag>
                                <span style={{ marginLeft: 8, color: '#666' }}>— Xem phim, đặt vé</span>
                            </Select.Option>
                            <Select.Option value="staff">
                                <Tag color="blue" icon={<TeamOutlined />}>
                                    Nhân viên
                                </Tag>
                                <span style={{ marginLeft: 8, color: '#666' }}>— Quét QR, bán vé tại quầy</span>
                            </Select.Option>
                            <Select.Option value="admin">
                                <Tag color="red" icon={<SafetyCertificateOutlined />}>
                                    Admin
                                </Tag>
                                <span style={{ marginLeft: 8, color: '#666' }}>— Toàn quyền quản lý</span>
                            </Select.Option>
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}

export default ManagerUser;
