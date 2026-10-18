import { useEffect, useState, useRef } from 'react';
import logo from '../assets/images/logo.png';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Dropdown, Space, Avatar, Empty } from 'antd';
import {
    UserOutlined,
    DownOutlined,
    MenuOutlined,
    LogoutOutlined,
    SettingOutlined,
    SearchOutlined,
    HomeOutlined,
} from '@ant-design/icons';
import { useStore } from '../hooks/useStore';
import { requestLogout, requestSearchMovie } from '../config/request';
import useDebounce from '../hooks/useDebounce';
import NotificationDropdown from './NotificationDropdown/NotificationDropdown';

function Header() {
    const { dataUser } = useStore();
    const navigate = useNavigate();
    const location = useLocation();

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [searchMovie, setSearchMovie] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showResults, setShowResults] = useState(false);
    const [loading, setLoading] = useState(false);
    const searchRef = useRef(null);

    const debounce = useDebounce(searchMovie, 500);

    const handleNavClick = (e, sectionId) => {
        e.preventDefault();
        if (location.pathname === '/') {
            const el = document.getElementById(sectionId);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth' });
            } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        } else {
            navigate('/');
            setTimeout(() => {
                const el = document.getElementById(sectionId);
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth' });
                } else {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            }, 150);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowResults(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        if (debounce) {
            setLoading(true);
            const fetchData = async () => {
                try {
                    const res = await requestSearchMovie(debounce);
                    setSearchResults(res.metadata || []);
                    setShowResults(true);
                } catch (error) {
                    console.log(error);
                    setSearchResults([]);
                } finally {
                    setLoading(false);
                }
            };
            fetchData();
        } else {
            setSearchResults([]);
            setShowResults(false);
        }
    }, [debounce]);

    const handleLogout = async () => {
        try {
            await requestLogout();
            setTimeout(() => {
                window.location.reload();
            }, 1000);
            window.location.href = '/';
        } catch (error) {
            console.log(error);
        }
    };

    const userRole = dataUser?.role || (dataUser?.isAdmin && dataUser?.isAdmin !== '0' ? 'admin' : 'customer');
    const isAdmin = userRole === 'admin';
    const isStaff = userRole === 'staff' || isAdmin;

    const userMenuItems = [
        {
            key: 'home',
            label: (
                <Link to="/" className="flex items-center gap-2 text-white font-medium hover:text-red-400">
                    <HomeOutlined className="text-red-500" />
                    <span>Trang chủ</span>
                </Link>
            ),
        },
        ...(isAdmin
            ? [
                  {
                      key: 'admin_portal',
                      label: (
                          <Link to="/admin" className="flex items-center gap-2 text-red-400 font-semibold">
                              <span>👑 Trang Quản Trị (Admin)</span>
                          </Link>
                      ),
                  },
              ]
            : []),
        ...(isStaff
            ? [
                  {
                      key: 'staff_portal',
                      label: (
                          <Link to="/staff" className="flex items-center gap-2 text-blue-400 font-semibold">
                              <span>🎟️ Cổng Nhân Viên (Staff)</span>
                          </Link>
                      ),
                  },
              ]
            : []),
        {
            key: '1',
            label: (
                <Link to="/profile" className="flex items-center gap-2">
                    <UserOutlined />
                    <span>Thông tin tài khoản</span>
                </Link>
            ),
        },
        {
            key: '2',
            label: (
                <Link to="/settings" className="flex items-center gap-2">
                    <SettingOutlined />
                    <span>Cài đặt</span>
                </Link>
            ),
        },
        {
            key: '3',
            label: (
                <div onClick={handleLogout} className="flex items-center gap-2 text-red-500 cursor-pointer">
                    <LogoutOutlined />
                    <span>Đăng xuất</span>
                </div>
            ),
        },
    ];

    return (
        <div className="h-[80px] fixed top-0 left-0 right-0 z-50 opacity-90 w-full bg-[#2226] backdrop-blur-sm">
            <div className="flex justify-between items-center h-full w-[90%] mx-auto relative">
                {/* Logo & Nav Links */}
                <div className="h-full flex items-center gap-8">
                    <Link to="/" className="flex items-center">
                        <img src={logo} alt="logo" className="h-[50px] object-contain hover:scale-105 transition-transform" />
                    </Link>
                    <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-gray-300">
                        <Link to="/" className="hover:text-red-500 transition-colors flex items-center gap-1.5 text-white font-medium">
                            <HomeOutlined />
                            <span>Trang Chủ</span>
                        </Link>
                        <a href="/#now-showing" onClick={(e) => handleNavClick(e, 'now-showing')} className="hover:text-red-500 transition-colors">
                            Phim Đang Chiếu
                        </a>
                        <a href="/#coming-soon" onClick={(e) => handleNavClick(e, 'coming-soon')} className="hover:text-red-500 transition-colors">
                            Phim Sắp Chiếu
                        </a>
                        <a href="/#cinemas" onClick={(e) => handleNavClick(e, 'cinemas')} className="hover:text-red-500 transition-colors">
                            Rạp / Lịch Chiếu
                        </a>
                        <a href="/#promotions" onClick={(e) => handleNavClick(e, 'promotions')} className="hover:text-red-500 transition-colors">
                            Ưu Đãi
                        </a>
                    </nav>
                </div>

                {/* Mobile menu button and notification */}
                <div className="md:hidden flex items-center gap-3">
                    <NotificationDropdown />
                    <button
                        className="text-white p-2"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        aria-label="Toggle menu"
                    >
                        <MenuOutlined className="text-xl" />
                    </button>
                </div>

                {/* Search bar - hidden on mobile, visible on larger screens */}
                <div className="hidden md:block flex-grow px-4 max-w-[400px] relative" ref={searchRef}>
                    <div className="relative">
                        <input
                            className="bg-[#22262A] rounded-full px-4 py-2 w-[400px] h-[40px] text-white placeholder:text-white text-sm pl-10"
                            type="text"
                            placeholder="Tìm kiếm phim...."
                            value={searchMovie}
                            onChange={(e) => setSearchMovie(e.target.value)}
                            onClick={() => searchResults.length > 0 && setShowResults(true)}
                        />
                        <SearchOutlined className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white" />
                    </div>

                    {/* Search Results Dropdown */}
                    {showResults && (
                        <div className="absolute w-[400px] bg-[#22262A] mt-1 rounded-lg shadow-lg max-h-[400px] overflow-auto z-50">
                            {loading ? (
                                <div className="p-4 text-center text-white">Đang tìm kiếm...</div>
                            ) : searchResults.length > 0 ? (
                                <div className="py-2">
                                    {searchResults.map((movie) => (
                                        <Link
                                            to={`/movie/${movie.id}`}
                                            key={movie.id}
                                            onClick={() => setShowResults(false)}
                                        >
                                            <div className="flex items-center p-2 hover:bg-[#33373B] cursor-pointer transition-all duration-300">
                                                <div className="w-[60px] h-[80px] overflow-hidden rounded-md flex-shrink-0 bg-neutral-800">
                                                    <img
                                                        src={movie.poster_url || movie.thumb_url}
                                                        alt={movie.name}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            e.target.src = 'https://via.placeholder.com/60x80?text=Movie';
                                                        }}
                                                    />
                                                </div>
                                                <div className="ml-3 flex-grow">
                                                    <div className="text-white font-medium text-sm line-clamp-1">{movie.name}</div>
                                                    <div className="text-gray-400 text-xs mt-0.5">
                                                        <span>{movie.year || '2024'}</span>
                                                        {movie.time && <span> • {movie.time} phút</span>}
                                                        {movie.quality && <span className="ml-1 text-red-400">({movie.quality})</span>}
                                                    </div>
                                                    <div className="text-red-500 font-semibold text-xs mt-1">
                                                        {Number(movie.price || 0).toLocaleString()} VNĐ
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-4">
                                    <Empty
                                        description={<span className="text-white">Không tìm thấy phim</span>}
                                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Auth buttons or user dropdown - hidden on mobile, visible on larger screens */}
                <div className="hidden md:flex items-center gap-4">
                    <NotificationDropdown />
                    {dataUser && dataUser.id ? (
                        <Dropdown menu={{ items: userMenuItems }} trigger={['click']} placement="bottomRight">
                            <a onClick={(e) => e.preventDefault()} className="cursor-pointer">
                                <Space className="flex items-center">
                                    <Avatar
                                        src={dataUser.avatar}
                                        icon={!dataUser.avatar && <UserOutlined />}
                                        size="default"
                                    />
                                    <span className="text-white text-sm hidden md:inline-block">
                                        {dataUser.fullName || dataUser.email}
                                    </span>
                                    <DownOutlined className="text-white text-xs" />
                                </Space>
                            </a>
                        </Dropdown>
                    ) : (
                        <>
                            <Link to="/login">
                                <button className="bg-[#22262A] rounded-full px-8 py-2 text-white text-sm hover:bg-[#33373B] transition-all duration-300">
                                    Đăng nhập
                                </button>
                            </Link>
                            <Link to="/register">
                                <button className="bg-[#22262A] rounded-full px-8 py-2 text-white text-sm hover:bg-[#33373B] transition-all duration-300">
                                    Đăng ký
                                </button>
                            </Link>
                        </>
                    )}
                </div>

                {/* Mobile menu - only visible when toggled */}
                {mobileMenuOpen && (
                    <div className="md:hidden absolute top-full right-0 w-full bg-[#161616] rounded-b-lg shadow-lg py-4 px-4 z-50">
                        <div className="mb-4 relative">
                            <input
                                className="bg-[#22262A] rounded-full px-4 py-2 w-full h-[40px] text-white placeholder:text-white text-sm pl-10"
                                type="text"
                                placeholder="Tìm kiếm phim...."
                                value={searchMovie}
                                onChange={(e) => setSearchMovie(e.target.value)}
                            />
                            <SearchOutlined className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white" />
                        </div>

                        {/* Mobile Search Results */}
                        {showResults && searchMovie && (
                            <div className="bg-[#22262A] mb-4 rounded-lg shadow-lg max-h-[300px] overflow-auto z-50">
                                {loading ? (
                                    <div className="p-4 text-center text-white">Đang tìm kiếm...</div>
                                ) : searchResults.length > 0 ? (
                                    <div className="py-2">
                                        {searchResults.map((movie) => (
                                            <Link
                                                to={`/movie/${movie.id}`}
                                                key={movie.id}
                                                onClick={() => {
                                                    setShowResults(false);
                                                    setMobileMenuOpen(false);
                                                }}
                                            >
                                                <div className="flex items-center p-2 hover:bg-[#33373B] cursor-pointer transition-all duration-300">
                                                    <div className="w-[50px] h-[70px] overflow-hidden rounded-md flex-shrink-0 bg-neutral-800">
                                                        <img
                                                            src={movie.poster_url || movie.thumb_url}
                                                            alt={movie.name}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                e.target.src = 'https://via.placeholder.com/50x70?text=Movie';
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="ml-3 flex-grow">
                                                        <div className="text-white font-medium text-sm line-clamp-1">{movie.name}</div>
                                                        <div className="text-gray-400 text-xs mt-0.5">
                                                            <span>{movie.year || '2024'}</span>
                                                            {movie.time && <span> • {movie.time} phút</span>}
                                                            {movie.quality && <span className="ml-1 text-red-400">({movie.quality})</span>}
                                                        </div>
                                                        <div className="text-red-500 font-semibold text-xs mt-1">
                                                            {Number(movie.price || 0).toLocaleString()} VNĐ
                                                        </div>
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-4">
                                        <Empty
                                            description={<span className="text-white">Không tìm thấy phim</span>}
                                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {dataUser && dataUser.id ? (
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-2 py-2 border-b border-gray-700">
                                    <Avatar
                                        src={dataUser.avatar}
                                        icon={!dataUser.avatar && <UserOutlined />}
                                        size="default"
                                    />
                                    <span className="text-white text-sm font-semibold">{dataUser.fullName || dataUser.email}</span>
                                    {isAdmin && <span className="text-xs bg-red-900/60 text-red-300 px-2 py-0.5 rounded border border-red-500/40">Admin</span>}
                                    {!isAdmin && isStaff && <span className="text-xs bg-blue-900/60 text-blue-300 px-2 py-0.5 rounded border border-blue-500/40">Staff</span>}
                                </div>

                                <Link
                                    to="/"
                                    className="flex items-center gap-2 text-white py-2 hover:text-red-400 font-semibold"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    <HomeOutlined className="text-red-500 text-lg" />
                                    <span>Trang chủ</span>
                                </Link>

                                <div className="flex flex-col gap-1 pl-6 border-l border-gray-800 text-sm">
                                    <a
                                        href="/#now-showing"
                                        onClick={(e) => {
                                            setMobileMenuOpen(false);
                                            handleNavClick(e, 'now-showing');
                                        }}
                                        className="text-gray-300 py-1 hover:text-red-400"
                                    >
                                        Phim Đang Chiếu
                                    </a>
                                    <a
                                        href="/#coming-soon"
                                        onClick={(e) => {
                                            setMobileMenuOpen(false);
                                            handleNavClick(e, 'coming-soon');
                                        }}
                                        className="text-gray-300 py-1 hover:text-red-400"
                                    >
                                        Phim Sắp Chiếu
                                    </a>
                                    <a
                                        href="/#cinemas"
                                        onClick={(e) => {
                                            setMobileMenuOpen(false);
                                            handleNavClick(e, 'cinemas');
                                        }}
                                        className="text-gray-300 py-1 hover:text-red-400"
                                    >
                                        Rạp / Lịch Chiếu
                                    </a>
                                    <a
                                        href="/#promotions"
                                        onClick={(e) => {
                                            setMobileMenuOpen(false);
                                            handleNavClick(e, 'promotions');
                                        }}
                                        className="text-gray-300 py-1 hover:text-red-400"
                                    >
                                        Ưu Đãi
                                    </a>
                                </div>

                                {isAdmin && (
                                    <Link
                                        to="/admin"
                                        className="flex items-center gap-2 text-red-400 font-semibold py-2"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        <span>👑 Trang Quản Trị (Admin)</span>
                                    </Link>
                                )}

                                {isStaff && (
                                    <Link
                                        to="/staff"
                                        className="flex items-center gap-2 text-blue-400 font-semibold py-2"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        <span>🎟️ Cổng Nhân Viên (Staff)</span>
                                    </Link>
                                )}

                                <Link
                                    to="/profile"
                                    className="flex items-center gap-2 text-white py-2"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    <UserOutlined />
                                    <span>Thông tin tài khoản</span>
                                </Link>

                                <Link
                                    to="/settings"
                                    className="flex items-center gap-2 text-white py-2"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    <SettingOutlined />
                                    <span>Cài đặt</span>
                                </Link>

                                <div
                                    onClick={() => {
                                        setMobileMenuOpen(false);
                                        handleLogout();
                                    }}
                                    className="flex items-center gap-2 text-red-500 py-2 cursor-pointer"
                                >
                                    <LogoutOutlined />
                                    <span>Đăng xuất</span>
                                </div>
                            </div>

                        ) : (
                            <div className="flex flex-col gap-3">
                                <Link to="/login" className="w-full">
                                    <button className="bg-[#22262A] rounded-full px-8 py-2 text-white text-sm hover:bg-[#33373B] transition-all duration-300 w-full">
                                        Đăng nhập
                                    </button>
                                </Link>
                                <Link to="/register" className="w-full">
                                    <button className="bg-[#22262A] rounded-full px-8 py-2 text-white text-sm hover:bg-[#33373B] transition-all duration-300 w-full">
                                        Đăng ký
                                    </button>
                                </Link>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Header;
