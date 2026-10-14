import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../Components/Header';
import Footer from '../Components/Footer';
import { Form, Input, Button, Divider, Modal, Steps, Alert } from 'antd';
import { LockOutlined, MailOutlined, KeyOutlined, CheckCircleOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { toast, ToastContainer } from 'react-toastify';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { requestLogin, requestLoginGoogle, requestForgotPassword, requestResetPassword } from '../config/request';

function Login() {
    const [loading, setLoading] = useState(false);
    const [forgotModalVisible, setForgotModalVisible] = useState(false);
    const [forgotStep, setForgotStep] = useState(0); // 0: enter email, 1: enter OTP & new password
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotLoading, setForgotLoading] = useState(false);

    const [formLogin] = Form.useForm();
    const [formForgot] = Form.useForm();
    const navigate = useNavigate();

    const onFinish = async (values) => {
        setLoading(true);
        try {
            const res = await requestLogin(values);
            toast.success(res.data.message || 'Đăng nhập thành công!');
            setTimeout(() => {
                window.location.reload();
            }, 1000);
            window.location.href = '/';
        } catch (error) {
            toast.error(error.response?.data?.message || 'Email hoặc mật khẩu không chính xác!');
        } finally {
            setLoading(false);
        }
    };

    const handleSuccess = async (response) => {
        const { credential } = response;
        try {
            const res = await requestLoginGoogle({ credential });
            toast.success(res.message || 'Đăng nhập bằng Google thành công!');
            setTimeout(() => {
                window.location.reload();
            }, 1000);
            navigate('/');
        } catch (error) {
            if (error.response && error.response.data && error.response.data.message) {
                toast.error(error.response.data.message);
            } else {
                toast.error('Đăng nhập bằng Google thất bại. Vui lòng thử lại!');
            }
        }
    };

    // Quick Forgot Password in Modal
    const handleSendOtp = async (values) => {
        setForgotLoading(true);
        try {
            await requestForgotPassword(values);
            setForgotEmail(values.email);
            setForgotStep(1);
            toast.success('Mã xác nhận OTP đã được gửi đến email của bạn!');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Email không tồn tại trong hệ thống!');
        } finally {
            setForgotLoading(false);
        }
    };

    const handleResetPassword = async (values) => {
        setForgotLoading(true);
        try {
            await requestResetPassword(values);
            toast.success('Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay.');
            setForgotModalVisible(false);
            setForgotStep(0);
            formForgot.resetFields();
            // Fill email in login form
            formLogin.setFieldsValue({ email: forgotEmail });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Mã OTP không đúng hoặc đã hết hạn!');
        } finally {
            setForgotLoading(false);
        }
    };

    return (
        <div className="bg-[#161616] min-h-screen">
            <ToastContainer />
            <Header />

            <div className="max-w-md mx-auto py-16 px-4 pt-28">
                <h1 className="text-3xl font-bold text-center text-white mb-2">Đăng Nhập</h1>
                <p className="text-center text-gray-400 mb-8">Vui lòng đăng nhập để tiếp tục trải nghiệm</p>

                <div className="bg-[#1E1E1E] rounded-xl p-8 shadow-2xl border border-gray-800">
                    <Form
                        form={formLogin}
                        name="login"
                        initialValues={{ remember: true }}
                        onFinish={onFinish}
                        layout="vertical"
                        size="large"
                    >
                        <Form.Item
                            name="email"
                            label={<span className="text-gray-300 font-medium">Địa chỉ Email</span>}
                            rules={[
                                { required: true, message: 'Vui lòng nhập email!' },
                                { type: 'email', message: 'Email không đúng định dạng!' },
                            ]}
                        >
                            <Input
                                prefix={<MailOutlined className="text-gray-400 mr-2" />}
                                placeholder="name@example.com"
                                className="h-12 bg-[#292929] border-[#333] text-white rounded-lg focus:border-red-500"
                            />
                        </Form.Item>

                        <Form.Item
                            name="password"
                            label={<span className="text-gray-300 font-medium">Mật khẩu</span>}
                            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
                        >
                            <Input.Password
                                prefix={<LockOutlined className="text-gray-400 mr-2" />}
                                placeholder="Nhập mật khẩu..."
                                className="h-12 bg-[#292929] border-[#333] text-white rounded-lg focus:border-red-500"
                            />
                        </Form.Item>

                        {/* QUÊN MẬT KHẨU PROMINENT SECTION */}
                        <div className="flex justify-between items-center pb-5 pt-1">
                            <span className="text-gray-400 text-xs">Bạn không nhớ mật khẩu?</span>
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setForgotModalVisible(true);
                                        setForgotStep(0);
                                    }}
                                    className="text-red-500 hover:text-red-400 font-semibold text-sm flex items-center gap-1 hover:underline cursor-pointer transition-colors"
                                >
                                    <KeyOutlined /> Quên mật khẩu?
                                </button>
                                <span className="text-gray-600">|</span>
                                <Link
                                    to="/forgot-password"
                                    className="text-gray-400 hover:text-red-400 text-xs hover:underline transition-colors"
                                >
                                    Lấy lại mật khẩu
                                </Link>
                            </div>
                        </div>

                        <Form.Item>
                            <Button
                                type="primary"
                                htmlType="submit"
                                className="w-full h-12 font-bold rounded-lg text-base"
                                loading={loading}
                                style={{
                                    background: '#E53E3E',
                                    borderColor: '#E53E3E',
                                }}
                            >
                                ĐĂNG NHẬP
                            </Button>
                        </Form.Item>
                    </Form>

                    <div className="relative my-6">
                        <Divider plain className="border-t border-gray-700">
                            <span className="text-gray-400 px-4 text-xs uppercase tracking-wider">Hoặc tiếp tục với</span>
                        </Divider>
                    </div>

                    <div className="flex justify-center">
                        <GoogleOAuthProvider clientId={import.meta.env.VITE_CLIENT_ID}>
                            <GoogleLogin onSuccess={handleSuccess} onError={() => console.log('Login Failed')} />
                        </GoogleOAuthProvider>
                    </div>

                    <div className="mt-8 text-center text-sm border-t border-gray-800 pt-6">
                        <span className="text-gray-400">Chưa có tài khoản? </span>
                        <Link to="/register" className="text-red-500 hover:text-red-400 font-semibold hover:underline">
                            Đăng ký tài khoản mới
                        </Link>
                    </div>
                </div>
            </div>

            {/* QUICK FORGOT PASSWORD MODAL */}
            <Modal
                title={<span className="text-white text-lg font-bold">🔑 Khôi Phục Mật Khẩu</span>}
                open={forgotModalVisible}
                onCancel={() => {
                    setForgotModalVisible(false);
                    setForgotStep(0);
                }}
                footer={null}
                centered
                className="custom-dark-modal"
                styles={{
                    content: {
                        background: '#1e1f24',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: 16,
                        color: '#fff',
                    },
                    header: {
                        background: 'transparent',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    },
                }}
            >
                <div className="pt-2">
                    <Steps
                        current={forgotStep}
                        items={[
                            { title: <span className="text-gray-300 text-xs">Nhập Email</span> },
                            { title: <span className="text-gray-300 text-xs">OTP & Mật khẩu mới</span> },
                        ]}
                        size="small"
                        className="mb-6"
                    />

                    {forgotStep === 0 ? (
                        <Form form={formForgot} layout="vertical" onFinish={handleSendOtp}>
                            <p className="text-gray-400 text-sm mb-4">
                                Nhập địa chỉ email đăng ký tài khoản của bạn để nhận mã OTP khôi phục mật khẩu.
                            </p>
                            <Form.Item
                                name="email"
                                rules={[
                                    { required: true, message: 'Vui lòng nhập email!' },
                                    { type: 'email', message: 'Email không hợp lệ!' },
                                ]}
                            >
                                <Input
                                    prefix={<MailOutlined className="text-gray-400 mr-2" />}
                                    placeholder="Nhập email của bạn..."
                                    size="large"
                                    className="bg-[#292929] border-[#444] text-white"
                                />
                            </Form.Item>

                            <Button
                                type="primary"
                                htmlType="submit"
                                size="large"
                                block
                                loading={forgotLoading}
                                style={{ background: '#E53E3E', borderColor: '#E53E3E', fontWeight: 600 }}
                            >
                                Gửi Mã Xác Nhận OTP
                            </Button>
                        </Form>
                    ) : (
                        <Form form={formForgot} layout="vertical" onFinish={handleResetPassword}>
                            <Alert
                                message={`Mã OTP đã gửi đến: ${forgotEmail}`}
                                type="info"
                                showIcon
                                className="mb-4"
                                style={{ background: '#25262b', borderColor: '#333', color: '#ddd' }}
                            />

                            <Form.Item
                                name="otp"
                                label={<span className="text-gray-300 text-xs">Mã OTP (6 chữ số)</span>}
                                rules={[{ required: true, message: 'Vui lòng nhập mã OTP!' }]}
                            >
                                <Input
                                    prefix={<KeyOutlined className="text-gray-400 mr-2" />}
                                    placeholder="Nhập mã OTP..."
                                    size="large"
                                    maxLength={6}
                                    className="bg-[#292929] border-[#444] text-white"
                                />
                            </Form.Item>

                            <Form.Item
                                name="newPassword"
                                label={<span className="text-gray-300 text-xs">Mật khẩu mới</span>}
                                rules={[
                                    { required: true, message: 'Vui lòng nhập mật khẩu mới!' },
                                    { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' },
                                ]}
                            >
                                <Input.Password
                                    prefix={<LockOutlined className="text-gray-400 mr-2" />}
                                    placeholder="Nhập mật khẩu mới..."
                                    size="large"
                                    className="bg-[#292929] border-[#444] text-white"
                                />
                            </Form.Item>

                            <Form.Item
                                name="confirmNewPassword"
                                label={<span className="text-gray-300 text-xs">Xác nhận mật khẩu mới</span>}
                                dependencies={['newPassword']}
                                rules={[
                                    { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
                                    ({ getFieldValue }) => ({
                                        validator(_, value) {
                                            if (!value || getFieldValue('newPassword') === value) {
                                                return Promise.resolve();
                                            }
                                            return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                                        },
                                    }),
                                ]}
                            >
                                <Input.Password
                                    prefix={<LockOutlined className="text-gray-400 mr-2" />}
                                    placeholder="Nhập lại mật khẩu mới..."
                                    size="large"
                                    className="bg-[#292929] border-[#444] text-white"
                                />
                            </Form.Item>

                            <div className="flex gap-3 mt-4">
                                <Button
                                    size="large"
                                    onClick={() => setForgotStep(0)}
                                    icon={<ArrowLeftOutlined />}
                                    style={{ background: 'transparent', borderColor: '#555', color: '#ccc' }}
                                >
                                    Quay lại
                                </Button>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    size="large"
                                    className="flex-1"
                                    loading={forgotLoading}
                                    style={{ background: '#E53E3E', borderColor: '#E53E3E', fontWeight: 600 }}
                                >
                                    Đổi Mật Khẩu & Đăng Nhập
                                </Button>
                            </div>
                        </Form>
                    )}
                </div>
            </Modal>

            <Footer />
        </div>
    );
}

export default Login;
