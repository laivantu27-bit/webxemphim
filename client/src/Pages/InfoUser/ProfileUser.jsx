import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../../Components/Header';
import Footer from '../../Components/Footer';
import { requestLogout, requestGetUserXPInfo, requestGetPaymentByUserId, requestAuth } from '../../config/request';
import { message } from 'antd';
import { HomeOutlined, ArrowLeftOutlined } from '@ant-design/icons';

// Import components
import UserSidebar from './Components/UserSidebar';
import ProfileForm from './Components/ProfileForm';
import BookingHistory from './Components/BookingHistory';
import UserLoyaltyCard from './Components/UserLoyaltyCard';
import StudentVerificationForm from './Components/StudentVerificationForm';
import { ToastContainer } from 'react-toastify';
import AvatarUploadModal from './Components/AvatarUploadModal';

function ProfileUser() {
    const [selectedMenu, setSelectedMenu] = useState('profile');
    const [isAvatarModalVisible, setIsAvatarModalVisible] = useState(false);
    const [userData, setUserData] = useState(null);
    const [xpInfo, setXpInfo] = useState(null);
    const [userPayments, setUserPayments] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchUserData = async () => {
        try {
            setLoading(true);
            const [resAuth, resXP, resPayments] = await Promise.allSettled([
                requestAuth(),
                requestGetUserXPInfo(),
                requestGetPaymentByUserId(),
            ]);

            if (resAuth.status === 'fulfilled' && resAuth.value?.metadata) {
                setUserData(resAuth.value.metadata);
            }

            if (resXP.status === 'fulfilled' && resXP.value?.metadata) {
                setXpInfo(resXP.value.metadata);
            }

            if (resPayments.status === 'fulfilled' && resPayments.value?.metadata) {
                setUserPayments(resPayments.value.metadata);
            }
        } catch (err) {
            console.error('Profile fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUserData();
    }, []);

    const handleMenuSelect = (e) => {
        setSelectedMenu(e.key);
    };

    const handleLogout = async () => {
        try {
            await requestLogout();
            message.success('Đăng xuất thành công!');
            setTimeout(() => {
                window.location.href = '/';
            }, 800);
        } catch (error) {
            console.log(error);
            message.error('Đã xảy ra lỗi khi đăng xuất!');
        }
    };

    const handleAvatarUpload = () => {
        setIsAvatarModalVisible(false);
        fetchUserData();
    };

    return (
        <div className="bg-[#161616] min-h-screen text-white pt-20">
            <ToastContainer />
            <Header />

            <main className="container mx-auto px-4 py-8">
                {/* Navigation Breadcrumb / Back button */}
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4 bg-[#1e1e1e] border border-gray-800 px-5 py-3.5 rounded-xl shadow-md">
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-gray-200 hover:text-white bg-gray-800 hover:bg-red-600 px-4 py-2 rounded-lg border border-gray-700 hover:border-red-500 transition-all duration-200 shadow-sm"
                    >
                        <ArrowLeftOutlined />
                        <span>Quay lại Trang Chủ</span>
                    </Link>
                    <div className="flex items-center gap-2 text-xs md:text-sm text-gray-400">
                        <Link to="/" className="hover:text-red-400 transition-colors flex items-center gap-1">
                            <HomeOutlined /> Trang chủ
                        </Link>
                        <span>/</span>
                        <span className="text-red-500 font-semibold">Thông tin tài khoản</span>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-6">
                    {/* Sidebar */}
                    <div className="w-full md:w-1/4">
                        <UserSidebar
                            user={userData}
                            xpInfo={xpInfo}
                            selectedMenu={selectedMenu}
                            handleMenuSelect={handleMenuSelect}
                            handleLogout={handleLogout}
                        />
                    </div>

                    {/* Main content */}
                    <div className="w-full md:w-3/4">
                        {selectedMenu === 'profile' && (
                            <ProfileForm
                                user={userData}
                                isAvatarModalVisible={isAvatarModalVisible}
                                setIsAvatarModalVisible={setIsAvatarModalVisible}
                            />
                        )}

                        {selectedMenu === 'loyalty' && (
                            <UserLoyaltyCard
                                xpInfo={xpInfo}
                                onRefresh={fetchUserData}
                            />
                        )}

                        {selectedMenu === 'student' && (
                            <StudentVerificationForm
                                xpInfo={xpInfo}
                                onRefresh={fetchUserData}
                            />
                        )}

                        {selectedMenu === 'history' && (
                            <BookingHistory bookings={userPayments} />
                        )}
                    </div>
                </div>
            </main>

            <Footer />

            {/* Avatar upload modal */}
            <AvatarUploadModal
                isVisible={isAvatarModalVisible}
                onClose={() => setIsAvatarModalVisible(false)}
                onUpload={handleAvatarUpload}
            />
        </div>
    );
}

export default ProfileUser;
