import React, { useState } from 'react';
import { Form, Input, Button, Upload, message, Tag, Card } from 'antd';
import {
    IdcardOutlined,
    UploadOutlined,
    CheckCircleFilled,
    BankOutlined,
    SafetyCertificateOutlined,
    GiftOutlined,
} from '@ant-design/icons';
import { requestSubmitStudentVerification, requestUploadImage } from '../../../config/request';

function StudentVerificationForm({ xpInfo, onRefresh }) {
    const [form] = Form.useForm();
    const [imageUrl, setImageUrl] = useState(xpInfo?.studentIdImage || '');
    const [uploading, setUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const isVerified = xpInfo?.studentVerified;

    // Handle image file selection and upload
    const handleCustomUpload = async ({ file, onSuccess, onError }) => {
        setUploading(true);
        try {
            // Read as data URL or upload
            const reader = new FileReader();
            reader.onload = async (e) => {
                const base64 = e.target.result;
                setImageUrl(base64);
                form.setFieldsValue({ studentIdImage: base64 });
                setUploading(false);
                onSuccess('ok');
                message.success('Tải ảnh thẻ Học sinh / Sinh viên thành công!');
            };
            reader.readAsDataURL(file);
        } catch (err) {
            setUploading(false);
            onError(err);
            message.error('Lỗi khi tải ảnh thẻ');
        }
    };

    const handleFinish = async (values) => {
        if (!imageUrl) {
            message.warning('Vui lòng tải lên ảnh chụp thẻ Học sinh / Sinh viên');
            return;
        }

        setSubmitting(true);
        try {
            const res = await requestSubmitStudentVerification({
                studentSchool: values.studentSchool,
                studentIdImage: imageUrl,
            });
            message.success(res?.message || 'Xác thực thẻ Học sinh / Sinh viên thành công! 🎉');
            if (onRefresh) onRefresh();
        } catch (error) {
            message.error(error?.response?.data?.message || 'Lỗi khi gửi thông tin xác minh');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="bg-[#1f1f1f] rounded-2xl p-8 border border-gray-800 space-y-6">
            {/* Header Banner */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-gray-800">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center text-2xl">
                        <IdcardOutlined />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-white">
                            Xác Minh Thẻ Học Sinh - Sinh Viên
                        </h2>
                        <p className="text-gray-400 text-xs">
                            Điền thông tin và ảnh thẻ để nhận đặc quyền giá vé và bắp nước ưu đãi
                        </p>
                    </div>
                </div>

                {isVerified ? (
                    <Tag color="success" className="px-3 py-1 font-bold text-xs flex items-center gap-1">
                        <CheckCircleFilled /> ĐÃ XÁC MINH HSSV
                    </Tag>
                ) : (
                    <Tag color="warning" className="px-3 py-1 font-bold text-xs">
                        CHƯA XÁC MINH
                    </Tag>
                )}
            </div>

            {/* Exclusive Perks Highlight */}
            <div className="bg-gradient-to-r from-blue-950/40 via-indigo-950/40 to-blue-950/40 border border-blue-500/30 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                <div className="space-y-1">
                    <div className="text-blue-400 font-bold text-sm flex items-center gap-1.5">
                        <GiftOutlined /> ĐẶC QUYỀN DÀNH RIÊNG CHO HỌC SINH - SINH VIÊN:
                    </div>
                    <ul className="text-gray-300 text-xs space-y-0.5 list-disc list-inside">
                        <li>Đồng giá vé chỉ <strong>55.000 VNĐ</strong> cho tất cả các suất chiếu 2D</li>
                        <li>Giảm <strong>20%</strong> toàn bộ combo bỏng ngô và nước ngọt tại rạp</li>
                        <li>Tặng ngay <strong>+50 điểm kinh nghiệm (XP)</strong> sau khi hoàn tất xác minh</li>
                    </ul>
                </div>
                <div className="bg-blue-600 text-white font-extrabold text-xs px-3 py-1.5 rounded-lg whitespace-nowrap shadow-md">
                    TIẾT KIỆM ĐẾN 40%
                </div>
            </div>

            {/* If already verified, display status card */}
            {isVerified ? (
                <div className="bg-[#262626] rounded-xl p-6 border border-emerald-500/40 space-y-4">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-base">
                        <SafetyCertificateOutlined className="text-xl" />
                        Tài khoản của bạn đã được kích hoạt ưu đãi Học sinh / Sinh viên!
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-300">
                        <div>
                            <span className="text-gray-400 text-xs block">Trường học:</span>
                            <strong className="text-white text-base">{xpInfo?.studentSchool || 'Đã xác minh'}</strong>
                        </div>
                        <div>
                            <span className="text-gray-400 text-xs block">Mức giảm giá tự động:</span>
                            <span className="text-yellow-400 font-bold">Đồng giá vé 55.000đ & Giảm 20% bắp nước</span>
                        </div>
                    </div>

                    {xpInfo?.studentIdImage && (
                        <div className="pt-2">
                            <span className="text-gray-400 text-xs block mb-2">Ảnh thẻ đã xác minh:</span>
                            <img
                                src={xpInfo.studentIdImage}
                                alt="Ảnh thẻ HS/SV"
                                className="w-48 h-32 object-cover rounded-lg border border-gray-700 shadow-md"
                            />
                        </div>
                    )}
                </div>
            ) : (
                /* Verification Form */
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleFinish}
                    className="space-y-4"
                >
                    <Form.Item
                        name="studentSchool"
                        label={<span className="text-gray-300 font-semibold">Tên trường THPT / Cao đẳng / Đại học:</span>}
                        rules={[{ required: true, message: 'Vui lòng nhập tên trường học của bạn' }]}
                    >
                        <Input
                            prefix={<BankOutlined className="text-gray-400" />}
                            placeholder="Ví dụ: Đại học Bách Khoa, THPT Chuyên Hà Nội - Amsterdam..."
                            size="large"
                            className="bg-[#2a2a2a] text-white border-gray-700"
                        />
                    </Form.Item>

                    <div className="space-y-2">
                        <label className="text-gray-300 font-semibold text-sm">
                            Ảnh chụp thẻ Học sinh / Sinh viên:
                        </label>
                        <p className="text-gray-400 text-xs">
                            Chụp rõ nét mặt trước thẻ HS/SV có họ tên và tên trường của bạn.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
                            <Upload
                                showUploadList={false}
                                customRequest={handleCustomUpload}
                                accept="image/*"
                            >
                                <Button
                                    size="large"
                                    icon={<UploadOutlined />}
                                    loading={uploading}
                                    className="bg-blue-600 hover:bg-blue-500 text-white border-0"
                                >
                                    Chọn ảnh thẻ từ máy
                                </Button>
                            </Upload>

                            {imageUrl && (
                                <div className="relative">
                                    <img
                                        src={imageUrl}
                                        alt="Ảnh thẻ xem trước"
                                        className="w-36 h-24 object-cover rounded-lg border-2 border-blue-500 shadow-md"
                                    />
                                    <div className="text-[11px] text-emerald-400 font-semibold mt-1 text-center">
                                        ✓ Đã chọn ảnh
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="pt-4">
                        <Button
                            type="primary"
                            htmlType="submit"
                            size="large"
                            block
                            loading={submitting}
                            style={{ background: '#2563eb', fontWeight: 'bold' }}
                        >
                            Gửi Xác Minh & Nhận Ưu Đãi (+50 XP)
                        </Button>
                    </div>
                </Form>
            )}
        </div>
    );
}

export default StudentVerificationForm;

