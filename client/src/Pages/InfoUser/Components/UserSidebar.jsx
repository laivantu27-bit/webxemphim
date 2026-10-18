import { Avatar, Menu, Tag } from 'antd';
import {
    UserOutlined,
    HistoryOutlined,
    LogoutOutlined,
    TrophyOutlined,
    IdcardOutlined,
    CrownOutlined,
    HomeOutlined,
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../../../hooks/useStore';

function UserSidebar({ selectedMenu, handleMenuSelect, handleLogout, xpInfo }) {
    const { dataUser } = useStore();
    const navigate = useNavigate();

    const level = xpInfo?.level || dataUser?.level || 'Bronze';
    const levelColors = {
        Bronze: 'gold',
        Silver: 'cyan',
        Gold: 'warning',
        Diamond: 'purple',
    };

    return (
        <div className="bg-gradient-to-b from-[#1a1a1a] to-[#161616] rounded-xl overflow-hidden shadow-lg border border-gray-800">
            {/* Back to Home Quick Button */}
            <div className="p-3 border-b border-gray-800/80 bg-[#141414]">
                <Link
                    to="/"
                    className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-semibold text-sm shadow-md transition-all duration-200 transform hover:-translate-y-0.5"
                >
                    <HomeOutlined className="text-base" />
                    <span>← Về Trang Chủ</span>
                </Link>
            </div>
            <div className="p-6 flex flex-col items-center border-b border-gray-800 text-center">
                <Avatar
                    size={80}
                    src={dataUser.avatar}
                    icon={!dataUser.avatar && <UserOutlined />}
                    className="mb-3 border-2 border-red-600 shadow-lg"
                />
                <h3 className="text-lg font-bold text-white">{dataUser.fullName}</h3>
                <p className="text-gray-400 text-xs mt-0.5">{dataUser.email}</p>

                {/* Level Tag */}
                <div className="mt-3 flex items-center gap-1.5">
                    <Tag color={levelColors[level] || 'gold'} className="font-bold uppercase tracking-wider px-2.5 py-0.5">
                        <CrownOutlined /> {level} Member
                    </Tag>
                    {xpInfo?.xpPoints !== undefined && (
                        <span className="text-yellow-400 font-mono text-xs font-bold">
                            {Number(xpInfo.xpPoints).toLocaleString()} XP
                        </span>
                    )}
                </div>
            </div>

            <Menu
                mode="inline"
                selectedKeys={[selectedMenu]}
                onClick={handleMenuSelect}
                className="bg-transparent border-0 py-2"
                items={[
                    {
                        key: 'profile',
                        icon: <UserOutlined />,
                        label: 'Thông tin cá nhân',
                        className: 'hover:text-red-500 text-white',
                    },
                    {
                        key: 'loyalty',
                        icon: <TrophyOutlined className="text-yellow-400" />,
                        label: 'Thẻ thành viên & Đổi quà',
                        className: 'hover:text-red-500 text-white font-semibold',
                    },
                    {
                        key: 'student',
                        icon: <IdcardOutlined className="text-blue-400" />,
                        label: 'Ưu đãi Học sinh / SV',
                        className: 'hover:text-red-500 text-white font-semibold',
                    },
                    {
                        key: 'history',
                        icon: <HistoryOutlined />,
                        label: 'Lịch sử đặt vé',
                        className: 'hover:text-red-500 text-white',
                    },
                    {
                        key: 'home',
                        icon: <HomeOutlined className="text-red-400" />,
                        label: 'Về Trang Chủ',
                        className: 'hover:text-red-500 text-white font-medium border-t border-gray-800/80 mt-1',
                        onClick: () => navigate('/'),
                    },
                    {
                        key: 'logout',
                        icon: <LogoutOutlined />,
                        label: 'Đăng xuất',
                        className: 'text-red-500 hover:text-red-400 font-medium',
                        onClick: handleLogout,
                    },
                ]}
            />
        </div>
    );
}

export default UserSidebar;
