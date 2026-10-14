import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Cardbody from './Cardbody';
import { requestGetAllCategory, requestGetAllMovie } from '../config/request';
import {
    CalendarOutlined,
    EnvironmentOutlined,
    GiftOutlined,
    FireOutlined,
    ClockCircleOutlined,
    TagOutlined,
    CheckCircleOutlined,
} from '@ant-design/icons';
import { message } from 'antd';

function HomePage() {
    const [categories, setCategories] = useState([]);
    const [allMovies, setAllMovies] = useState([]);
    const [selectedCategoryTab, setSelectedCategoryTab] = useState('all');
    const [selectedCinema, setSelectedCinema] = useState('cgv-vincom');
    const [selectedCinemaDate, setSelectedCinemaDate] = useState('today');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const resCategories = await requestGetAllCategory();
                setCategories(resCategories.metadata || []);

                const resMovies = await requestGetAllMovie();
                setAllMovies(resMovies.metadata || []);
            } catch (err) {
                console.error('Error fetching home data:', err);
            }
        };
        fetchData();
    }, []);

    // Filter movies for "Phim Đang Chiếu"
    const filteredMovies =
        selectedCategoryTab === 'all'
            ? allMovies
            : allMovies.filter((m) => m.category?.id === selectedCategoryTab || m.category === selectedCategoryTab);

    // Mock Coming Soon movies
    const comingSoonMovies = allMovies.slice(0, 4).map((m, idx) => ({
        ...m,
        releaseDate: idx % 2 === 0 ? '15/10/2024' : '28/10/2024',
    }));

    // Mock Cinema list
    const cinemas = [
        { id: 'cgv-vincom', name: 'CGV Vincom Center', address: '72 Lê Thánh Tôn, Q.1, TP.HCM' },
        { id: 'galaxy-nguyen-du', name: 'Galaxy Cinema Nguyễn Du', address: '116 Nguyễn Du, Q.1, TP.HCM' },
        { id: 'lotte-cantavil', name: 'Lotte Cinema Cantavil', address: 'Tầng 7 Cantavil Premier, Q.2, TP.HCM' },
        { id: 'bhd-bitexco', name: 'BHD Star Bitexco', address: 'Tầng 3 Bitexco Financial Tower, Q.1, TP.HCM' },
    ];

    // Mock Promotions list
    const promotions = [
        {
            id: 1,
            title: 'Combo Bỏng Nước Avengers - Giảm 20%',
            desc: 'Nhận ngay 1 Bỏng Ngô Khổng Lồ + 2 Nước Ngọt khi mua từ 2 vé xem phim Avengers: Endgame.',
            tag: 'HOT DEAL',
            color: 'bg-red-600',
            bg: 'https://images.unsplash.com/photo-1585647347384-2593bc35786b?w=600&auto=format&fit=crop',
        },
        {
            id: 2,
            title: 'Thứ 4 Vui Vẻ - Đồng Giá 45.000 VNĐ',
            desc: 'Áp dụng cho tất cả các suất chiếu vào ngày Thứ 4 hàng tuần cho toàn bộ thành viên.',
            tag: 'ƯU ĐÃI TUẦN',
            color: 'bg-yellow-600',
            bg: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop',
        },
        {
            id: 3,
            title: 'Học Sinh - Sinh Viên Đồng Giá 55.000 VNĐ',
            desc: 'Xuất trình thẻ học sinh/sinh viên tại quầy hoặc ứng dụng để nhận giá vé ưu đãi cực hời.',
            tag: 'HỌC SINH SV',
            color: 'bg-blue-600',
            bg: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=600&auto=format&fit=crop',
        },
        {
            id: 4,
            title: 'Hoàn Tiền 30% Qua Ví MoMo & VNPay',
            desc: 'Nhập mã BANXINCHILL khi thanh toán vé xem phim qua MoMo hoặc VNPay QR.',
            tag: 'CỔNG THANH TOÁN',
            color: 'bg-purple-600',
            bg: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=600&auto=format&fit=crop',
        },
    ];

    return (
        <div className="w-[90%] mx-auto py-12 space-y-20">
            {/* SECTION 1: PHIM ĐANG CHIẾU */}
            <section id="now-showing" className="scroll-mt-24 space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-800 pb-4 gap-4">
                    <div className="flex items-center space-x-3">
                        <FireOutlined className="text-red-600 text-3xl" />
                        <h2 className="text-3xl font-black text-white uppercase tracking-wide">
                            Phim Đang Chiếu
                        </h2>
                    </div>

                    {/* Category Filter Tabs */}
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            onClick={() => setSelectedCategoryTab('all')}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${
                                selectedCategoryTab === 'all'
                                    ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                                    : 'bg-[#222] text-gray-400 hover:text-white hover:bg-[#333]'
                            }`}
                        >
                            Tất cả
                        </button>
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategoryTab(cat.id)}
                                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${
                                    selectedCategoryTab === cat.id
                                        ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                                        : 'bg-[#222] text-gray-400 hover:text-white hover:bg-[#333]'
                                }`}
                            >
                                {cat.nameCategory}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Movie Grid */}
                {filteredMovies.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                        {filteredMovies.map((movie) => (
                            <Link key={movie.id} to={`/movie/${movie.id}`}>
                                <Cardbody item={movie} />
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 text-gray-500">Đang cập nhật danh sách phim...</div>
                )}
            </section>

            {/* SECTION 2: PHIM SẮP CHIẾU */}
            <section id="coming-soon" className="scroll-mt-24 space-y-6">
                <div className="flex items-center space-x-3 border-b border-gray-800 pb-4">
                    <CalendarOutlined className="text-red-600 text-3xl" />
                    <h2 className="text-3xl font-black text-white uppercase tracking-wide">
                        Phim Sắp Chiếu
                    </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                    {comingSoonMovies.map((movie) => (
                        <div
                            key={movie.id}
                            className="bg-[#222] rounded-xl overflow-hidden group hover:scale-[1.02] transition-transform duration-300 border border-gray-800"
                        >
                            <div className="aspect-[16/9] relative overflow-hidden">
                                <img
                                    src={movie.thumb_url || movie.poster_url}
                                    alt={movie.name}
                                    referrerPolicy="no-referrer"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&auto=format&fit=crop';
                                    }}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                                <div className="absolute top-3 left-3 bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded">
                                    Khởi chiếu: {movie.releaseDate}
                                </div>
                            </div>
                            <div className="p-4 space-y-2">
                                <h3 className="text-white font-bold text-lg line-clamp-1 group-hover:text-red-500 transition-colors">
                                    {movie.name}
                                </h3>
                                <p className="text-gray-400 text-xs line-clamp-2">{movie.description}</p>
                                <button
                                    onClick={() => message.success(`Đã đăng ký nhận thông báo phim ${movie.name}!`)}
                                    className="w-full mt-3 bg-[#333] hover:bg-red-600 text-white text-xs font-bold py-2 rounded-lg transition-colors flex items-center justify-center space-x-2"
                                >
                                    <TagOutlined />
                                    <span>Nhận Thông Báo</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* SECTION 3: RẠP & LỊCH CHIẾU */}
            <section id="cinemas" className="scroll-mt-24 bg-[#1c1c1c] p-8 rounded-2xl border border-gray-800 space-y-6">
                <div className="flex items-center space-x-3 border-b border-gray-800 pb-4">
                    <EnvironmentOutlined className="text-red-600 text-3xl" />
                    <div>
                        <h2 className="text-3xl font-black text-white uppercase tracking-wide">
                            Rạp / Lịch Chiếu
                        </h2>
                        <p className="text-gray-400 text-sm">Chọn rạp chiếu gần bạn và chọn suất chiếu thuận tiện nhất</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Cinema Selector */}
                    <div className="space-y-3">
                        <h4 className="text-white font-bold text-base mb-2">Hệ thống Rạp</h4>
                        {cinemas.map((c) => (
                            <div
                                key={c.id}
                                onClick={() => setSelectedCinema(c.id)}
                                className={`p-4 rounded-xl cursor-pointer transition-all duration-300 border ${
                                    selectedCinema === c.id
                                        ? 'bg-red-600/10 border-red-600 text-white'
                                        : 'bg-[#252525] border-transparent text-gray-400 hover:bg-[#2e2e2e] hover:text-gray-200'
                                }`}
                            >
                                <div className="font-bold text-sm text-white flex items-center justify-between">
                                    <span>{c.name}</span>
                                    {selectedCinema === c.id && <CheckCircleOutlined className="text-red-500" />}
                                </div>
                                <div className="text-xs text-gray-400 mt-1 flex items-center space-x-1">
                                    <EnvironmentOutlined />
                                    <span>{c.address}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Schedule & Showtimes */}
                    <div className="md:col-span-2 space-y-4">
                        <h4 className="text-white font-bold text-base">Lịch chiếu phim hôm nay</h4>
                        <div className="space-y-4">
                            {allMovies.slice(0, 3).map((movie) => (
                                <div key={movie.id} className="bg-[#252525] p-4 rounded-xl flex flex-col sm:flex-row gap-4 items-center">
                                    <img
                                        src={movie.poster_url}
                                        alt={movie.name}
                                        referrerPolicy="no-referrer"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=200&auto=format&fit=crop';
                                        }}
                                        className="w-20 h-28 object-cover rounded-lg flex-shrink-0"
                                    />
                                    <div className="flex-1 space-y-2 text-center sm:text-left">
                                        <h5 className="text-white font-bold text-lg">{movie.name}</h5>
                                        <div className="text-gray-400 text-xs flex items-center justify-center sm:justify-start space-x-3">
                                            <span>{movie.time || 120} phút</span>
                                            <span>•</span>
                                            <span className="text-yellow-400 font-bold">{movie.quality || '2D HD'}</span>
                                        </div>
                                        {/* Showtime Buttons */}
                                        <div className="flex flex-wrap gap-2 pt-1">
                                            {['10:00', '12:30', '15:00', '17:30', '20:00', '22:30'].map((time) => (
                                                <Link key={time} to={`/booking/${movie.id}`}>
                                                    <button className="bg-[#333] hover:bg-red-600 text-white text-xs font-semibold px-3 py-1.5 rounded border border-gray-700 hover:border-red-600 transition-colors">
                                                        {time}
                                                    </button>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* SECTION 4: ƯU ĐÃI & KHUYẾN MÃI */}
            <section id="promotions" className="scroll-mt-24 space-y-6">
                <div className="flex items-center space-x-3 border-b border-gray-800 pb-4">
                    <GiftOutlined className="text-red-600 text-3xl" />
                    <div>
                        <h2 className="text-3xl font-black text-white uppercase tracking-wide">
                            Ưu Đãi & Khuyến Mãi
                        </h2>
                        <p className="text-gray-400 text-sm">Các chương trình giảm giá vé và combo bỏng nước hấp dẫn</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {promotions.map((promo) => (
                        <div
                            key={promo.id}
                            className="bg-[#222] rounded-xl overflow-hidden border border-gray-800 group hover:border-red-600 transition-all duration-300 flex flex-col justify-between"
                        >
                            <div>
                                <div className="h-36 relative overflow-hidden">
                                    <img
                                        src={promo.bg}
                                        alt={promo.title}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                    />
                                    <span className={`absolute top-3 left-3 ${promo.color} text-white text-xs font-bold px-2.5 py-1 rounded shadow`}>
                                        {promo.tag}
                                    </span>
                                </div>
                                <div className="p-4 space-y-2">
                                    <h3 className="text-white font-bold text-base line-clamp-1 group-hover:text-red-500 transition-colors">
                                        {promo.title}
                                    </h3>
                                    <p className="text-gray-400 text-xs leading-relaxed line-clamp-3">
                                        {promo.desc}
                                    </p>
                                </div>
                            </div>
                            <div className="p-4 pt-0">
                                <button
                                    onClick={() => message.success(`Đã nhận mã ưu đãi "${promo.title}"!`)}
                                    className="w-full bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white font-bold text-xs py-2 rounded-lg transition-colors border border-red-600/40"
                                >
                                    Nhận Mã Ưu Đãi
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}

export default HomePage;
