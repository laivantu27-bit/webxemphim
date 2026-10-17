import { useEffect, useState } from 'react';
import Header from '../../Components/Header';
import Footer from '../../Components/Footer';
import { requestLogout, requestGetUserXPInfo, requestGetPaymentByUserId, requestAuth } from '../../config/request';
import { message } from 'antd';

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

            <main className="container mx-auto px-4 py-12">
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
