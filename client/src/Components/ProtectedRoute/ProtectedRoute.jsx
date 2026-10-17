import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useStore } from '../../hooks/useStore';
import { Spin, Button, Card, Typography, Tag, Space } from 'antd';
import {
    LockOutlined,
    SafetyCertificateOutlined,
    HomeOutlined,
    LoginOutlined,
    EyeOutlined,
} from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

/**
 * ProtectedRoute - Bảo vệ route dựa theo role người dùng
 * allowedRoles: ['admin'] | ['staff', 'admin'] | ['customer']
 */
function ProtectedRoute({ children, allowedRoles = [], pageTitle = 'Trang Bảo Mật' }) {
    const { dataUser, isAuthLoading } = useStore();
    const [bypassMode, setBypassMode] = useState(false);

    // Đang kiểm tra đăng nhập
    if (isAuthLoading) {
        return (
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100vh',
                    background: '#0f1015',
                    color: '#fff',
                    gap: 16,
                }}
            >
                <Spin size="large" />
                <span style={{ fontSize: 14, color: '#aaa' }}>Đang xác thực thông tin...</span>
            </div>
        );
    }

    // Nếu người dùng chọn xem thử (Bypass để test/xem UI)
    if (bypassMode) {
        return children;
    }

    // Xác định role thực tế của user
    const isLoggedIn = !!(dataUser && dataUser.id);
    const userRole = dataUser?.role || (dataUser?.isAdmin && dataUser?.isAdmin !== '0' ? 'admin' : 'customer');
    const hasPermission = allowedRoles.length === 0 || allowedRoles.includes(userRole);

    // Đã đủ quyền -> cho vào
    if (isLoggedIn && hasPermission) {
        return children;
    }

    // Nếu không đủ quyền hoặc chưa đăng nhập -> Hiển thị màn hình hướng dẫn rõ ràng
    const roleNameMap = {
        admin: 'Quản trị viên (Admin)',
        staff: 'Nhân viên (Staff)',
        customer: 'Khách hàng',
    };

    return (
        <div
            style={{
                minHeight: '100vh',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                background: 'radial-gradient(circle at top, #1c1f2e 0%, #0d0f17 100%)',
                padding: '24px',
            }}
        >
            <Card
                style={{
                    maxWidth: 520,
                    width: '100%',
                    background: '#161922',
                    borderColor: '#262a36',
                    borderRadius: 16,
                    boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                    color: '#fff',
                    textAlign: 'center',
                    padding: '16px 8px',
                }}
            >
                <div
                    style={{
                        width: 72,
                        height: 72,
                        borderRadius: '50%',
                        background: 'rgba(239, 68, 68, 0.12)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 16px',
                        color: '#ef4444',
                        fontSize: 32,
                    }}
                >
                    <LockOutlined />
                </div>

                <Title level={3} style={{ color: '#fff', marginBottom: 8 }}>
                    Yêu cầu quyền truy cập
                </Title>

                <Paragraph style={{ color: '#9ca3af', fontSize: 14, marginBottom: 16 }}>
                    Trang này yêu cầu quyền{' '}
                    {allowedRoles.map((r) => (
                        <Tag color={r === 'admin' ? 'red' : 'blue'} key={r} style={{ marginLeft: 4 }}>
                            {roleNameMap[r] || r}
                        </Tag>
                    ))}
                </Paragraph>

                <div
                    style={{
                        background: '#0d0f17',
                        borderRadius: 12,
                        padding: 16,
                        marginBottom: 20,
                        textAlign: 'left',
                        border: '1px solid #1f2433',
                    }}
                >
                    <div style={{ color: '#aaa', fontSize: 13, marginBottom: 8 }}>
                        Trạng thái hiện tại:{' '}
                        {isLoggedIn ? (
                            <Tag color="cyan">Đã đăng nhập ({roleNameMap[userRole] || userRole})</Tag>
                        ) : (
                            <Tag color="default">Chưa đăng nhập</Tag>
                        )}
                    </div>
                    <div style={{ color: '#888', fontSize: 12, lineHeight: 1.6 }}>
                        💡 <strong>Tài khoản mẫu để đăng nhập:</strong>
                        <br />• 🔴 <strong>Admin:</strong> <code style={{ color: '#ef4444' }}>admin@gmail.com</code> / pass: <code style={{ color: '#ef4444' }}>123456</code>
                        <br />• 🔵 <strong>Nhân viên:</strong> <code style={{ color: '#3b82f6' }}>staff@gmail.com</code> / pass: <code style={{ color: '#3b82f6' }}>123456</code>
                    </div>
                </div>

                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    <Link to="/login" style={{ width: '100%' }}>
                        <Button
                            type="primary"
                            icon={<LoginOutlined />}
                            size="large"
                            block
                            style={{
                                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                borderColor: '#ef4444',
                                height: 44,
                                fontWeight: 600,
                            }}
                        >
                            Đăng nhập tài khoản
                        </Button>
                    </Link>

                    <Button
                        icon={<EyeOutlined />}
                        size="large"
                        block
                        ghost
                        style={{
                            borderColor: '#3b82f6',
                            color: '#60a5fa',
                            height: 44,
                        }}
                        onClick={() => setBypassMode(true)}
                    >
                        ⚡ Mở xem thử ngay (Chế độ xem trước)
                    </Button>

                    <Link to="/" style={{ width: '100%' }}>
                        <Button
                            icon={<HomeOutlined />}
                            size="large"
                            block
                            type="text"
                            style={{ color: '#9ca3af', height: 40 }}
                        >
                            Quay lại Trang Chủ
                        </Button>
                    </Link>
                </Space>
            </Card>
        </div>
    );
}

export default ProtectedRoute;
