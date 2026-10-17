import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Cardbody from './Cardbody';
import {
    requestGetAllCategory,
    requestGetAllMovie,
    requestGetAllBranches,
    requestGetPendingReviewMovies,
    requestCreatePreviewMovie,
} from '../config/request';
import {
    CalendarOutlined,
    EnvironmentOutlined,
    GiftOutlined,
    FireOutlined,
    ClockCircleOutlined,
    TagOutlined,
    CheckCircleOutlined,
    CompassOutlined,
    AimOutlined,
    PhoneOutlined,
    StarFilled,
    StarOutlined,
    CloseOutlined,
    TrophyOutlined,
    SendOutlined,
} from '@ant-design/icons';
import { message, Rate, Input, Modal, Button, Spin, Tag } from 'antd';
import TrailerModal from './TrailerModal/TrailerModal';

function HomePage() {
    const [categories, setCategories] = useState([]);
    const [allMovies, setAllMovies] = useState([]);
    const [branches, setBranches] = useState([]);
    const [selectedCategoryTab, setSelectedCategoryTab] = useState('all');
    const [selectedProvince, setSelectedProvince] = useState('all');
    const [selectedBranch, setSelectedBranch] = useState(null);
    const [selectedTrailerMovie, setSelectedTrailerMovie] = useState(null);

    // Geolocation states
    const [userCoords, setUserCoords] = useState(null);
    const [loadingLocation, setLoadingLocation] = useState(false);

    // Post-movie review states
    const [pendingMovies, setPendingMovies] = useState([]);
    const [reviewModalVisible, setReviewModalVisible] = useState(false);
    const [currentReviewMovie, setCurrentReviewMovie] = useState(null);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState('');
    const [submittingReview, setSubmittingReview] = useState(false);
    const [dismissReviewToast, setDismissReviewToast] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const resCategories = await requestGetAllCategory();
                setCategories(resCategories.metadata || []);

                const resMovies = await requestGetAllMovie();
                const movieList = resMovies.metadata || [];
                setAllMovies(movieList);

                // Fetch cinema branches
                const resBranches = await requestGetAllBranches();
                const branchList = resBranches.metadata || [];
                setBranches(branchList);
                if (branchList.length > 0) {
                    setSelectedBranch(branchList[0]);
                }

                // Check for movies user watched but hasn't reviewed yet
                try {
                    const resPending = await requestGetPendingReviewMovies();
                    if (resPending?.metadata && resPending.metadata.length > 0) {
                        setPendingMovies(resPending.metadata);
                        setCurrentReviewMovie(resPending.metadata[0]);
                    }
                } catch (e) {
                    // Not logged in or no pending reviews
                }
            } catch (err) {
                console.error('Error fetching home data:', err);
            }
        };
        fetchData();
    }, []);

    // Haversine formula to compute distance in km
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        if (!lat1 || !lon1 || !lat2 || !lon2) return null;
        const R = 6371; // km
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLon = ((lon2 - lon1) * Math.PI) / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((lat1 * Math.PI) / 180) *
                Math.cos((lat2 * Math.PI) / 180) *
                Math.sin(dLon / 2) *
                Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return parseFloat((R * c).toFixed(1));
    };

    // Trigger browser geolocation
    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            message.warning('Trình duyệt của bạn không hỗ trợ định vị GPS');
            return;
        }
        setLoadingLocation(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const coords = {
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                };
                setUserCoords(coords);
                setLoadingLocation(false);
                message.success('Đã định vị thành công! Hệ thống đã sắp xếp rạp gần bạn nhất lên đầu 📍');
            },
            (err) => {
                setLoadingLocation(false);
                message.error('Không thể lấy vị trí. Vui lòng cho phép quyền truy cập vị trí trên trình duyệt!');
            },
            { enableHighAccuracy: true, timeout: 8000 }
        );
    };

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

    // List of unique provinces from branches
    const provinces = ['all', ...new Set(branches.map((b) => b.province))];

    // Filter and sort branches by distance if userCoords available
    const displayedBranches = branches
        .filter((b) => selectedProvince === 'all' || b.province === selectedProvince)
        .map((b) => ({
            ...b,
            distance: userCoords ? calculateDistance(userCoords.lat, userCoords.lng, b.lat, b.lng) : null,
        }))
        .sort((a, b) => {
            if (a.distance !== null && b.distance !== null) {
                return a.distance - b.distance;
            }
            return 0;
        });

    // Handle submit movie rating (1-5 stars)
    const handleSubmitReview = async () => {
        if (!currentReviewMovie) return;
        setSubmittingReview(true);
        try {
            const res = await requestCreatePreviewMovie({
                movieId: currentReviewMovie.id,
                rating: reviewRating,
                comment: reviewComment,
            });
            message.success(res?.message || 'Đánh giá phim thành công! Bạn nhận được +50 điểm XP 🌟');
            setReviewModalVisible(false);
            setDismissReviewToast(true);
            // Remove reviewed movie from pending list
            setPendingMovies((prev) => prev.filter((m) => m.id !== currentReviewMovie.id));
        } catch (error) {
            message.error(error?.response?.data?.message || 'Lỗi khi gửi đánh giá');
        } finally {
            setSubmittingReview(false);
        }
    };

    // Promotions list
    const promotions = [
        {
            id: 1,
            title: 'Combo Bỏng Nước Avengers - Giảm 20%',
            desc: 'Nhận ngay 1 Bỏng Ngô Khổng Lồ + 2 Nước Ngọt khi mua từ 2 vé xem phim.',
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
            desc: 'Xuất trình thẻ học sinh/sinh viên hoặc xác thực tài khoản để nhận giá vé ưu đãi cực hời.',
            tag: 'HỌC SINH SV',
            color: 'bg-blue-600',
            bg: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=600&auto=format&fit=crop',
        },
        {
            id: 4,
            title: 'Tích Lũy Điểm Kinh Nghiệm (XP)',
            desc: 'Tích lũy 100 XP mỗi vé và 50 XP mỗi đánh giá phim để đổi bim bim, nước ngọt và giảm giá vé.',
            tag: 'THÀNH VIÊN VIP',
            color: 'bg-purple-600',
            bg: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=600&auto=format&fit=crop',
        },
    ];

    return (
        <div className="w-[90%] mx-auto py-12 space-y-20 relative">
            {/* ================= POST-MOVIE RATING NOTIFICATION TOAST ================= */}
            {pendingMovies.length > 0 && !dismissReviewToast && currentReviewMovie && (
                <div className="fixed bottom-6 left-6 z-50 max-w-sm bg-[#1e1e1e] border-2 border-yellow-500/70 rounded-2xl p-4 shadow-2xl shadow-yellow-500/20 text-white animate-slide-up backdrop-blur-md">
                    <button
                        onClick={() => setDismissReviewToast(true)}
                        className="absolute top-2.5 right-2.5 text-gray-400 hover:text-white p-1"
                    >
                        <CloseOutlined />
                    </button>
                    <div className="flex items-start gap-3">
                        <img
                            src={currentReviewMovie.thumb_url || currentReviewMovie.poster_url}
                            alt={currentReviewMovie.name}
                            className="w-14 h-20 object-cover rounded-lg border border-gray-700 flex-shrink-0"
                        />
                        <div className="flex-1">
                            <div className="flex items-center gap-1.5 text-yellow-400 text-xs font-bold uppercase tracking-wider mb-1">
                                <TrophyOutlined /> Nhận +50 XP Thưởng
                            </div>
                            <h4 className="font-bold text-sm text-white line-clamp-1">
                                Bạn thấy phim &quot;{currentReviewMovie.name}&quot; thế nào?
                            </h4>
                            <p className="text-gray-300 text-xs mt-0.5 line-clamp-2">
                                Đánh giá 1-5 sao để giúp khán giả khác và nhận ngay 50 điểm kinh nghiệm!
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                                <button
                                    onClick={() => setReviewModalVisible(true)}
                                    className="bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-extrabold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                                >
                                    <StarFilled /> Đánh giá ngay
                                </button>
                                <button
                                    onClick={() => setDismissReviewToast(true)}
                                    className="text-gray-400 hover:text-gray-200 text-xs px-2 py-1"
                                >
                                    Để sau
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ================= SECTION 1: PHIM ĐANG CHIẾU ================= */}
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
                                <Cardbody item={movie} onWatchTrailer={(m) => setSelectedTrailerMovie(m)} />
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 text-gray-500">Đang cập nhật danh sách phim...</div>
                )}
            </section>

            {/* ================= SECTION 2: PHIM SẮP CHIẾU ================= */}
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
                                <div className="grid grid-cols-2 gap-2 mt-3">
                                    <button
                                        onClick={() => setSelectedTrailerMovie(movie)}
                                        className="bg-white/10 hover:bg-red-600 text-white text-xs font-bold py-2 rounded-lg transition-colors flex items-center justify-center space-x-1"
                                    >
                                        <span>🎬 Trailer</span>
                                    </button>
                                    <button
                                        onClick={() => message.success(`Đã đăng ký nhận thông báo phim ${movie.name}!`)}
                                        className="bg-[#333] hover:bg-[#444] text-gray-300 hover:text-white text-xs font-bold py-2 rounded-lg transition-colors flex items-center justify-center space-x-1"
                                    >
                                        <TagOutlined />
                                        <span>Báo tôi</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ================= SECTION 3: HỆ THỐNG RẠP CGV CÁC TỈNH THÀNH & TÌM RẠP GẦN NHẤT ================= */}
            <section id="cinemas" className="scroll-mt-24 bg-[#1c1c1c] p-8 rounded-2xl border border-gray-800 space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-800 pb-4 gap-4">
                    <div className="flex items-center space-x-3">
                        <EnvironmentOutlined className="text-red-600 text-3xl" />
                        <div>
                            <h2 className="text-3xl font-black text-white uppercase tracking-wide">
                                Hệ Thống Rạp CGV Các Tỉnh Thành
                            </h2>
                            <p className="text-gray-400 text-sm">
                                Tìm cụm rạp CGV gần bạn nhất và đặt vé xem phim thuận tiện
                            </p>
                        </div>
                    </div>

                    {/* Geolocation Button */}
                    <button
                        onClick={handleGetLocation}
                        disabled={loadingLocation}
                        className="bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-500 hover:to-rose-400 text-white font-bold text-sm px-5 py-2.5 rounded-full shadow-lg shadow-red-600/30 transition-all flex items-center space-x-2"
                    >
                        {loadingLocation ? (
                            <>
                                <Spin size="small" />
                                <span>Đang xác định vị trí...</span>
                            </>
                        ) : (
                            <>
                                <AimOutlined className="text-lg" />
                                <span>📍 Mở vị trí tìm rạp gần nhất</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Province Filter Chips */}
                <div className="flex flex-wrap items-center gap-2 pb-2">
                    <span className="text-gray-400 text-sm font-semibold mr-1">Tỉnh / Thành phố:</span>
                    {provinces.map((prov) => (
                        <button
                            key={prov}
                            onClick={() => setSelectedProvince(prov)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                                selectedProvince === prov
                                    ? 'bg-red-600 text-white'
                                    : 'bg-[#2a2a2a] text-gray-300 hover:bg-[#333] hover:text-white'
                            }`}
                        >
                            {prov === 'all' ? 'Tất cả tỉnh thành' : prov}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Cinema Branch List */}
                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        <div className="flex justify-between items-center mb-1">
                            <h4 className="text-white font-bold text-base">Danh sách cụm rạp ({displayedBranches.length})</h4>
                            {userCoords && <Tag color="green">Đã định vị GPS</Tag>}
                        </div>

                        {displayedBranches.map((branch, index) => {
                            const isSelected = selectedBranch?.id === branch.id;
                            const isClosest = userCoords && index === 0;

                            return (
                                <div
                                    key={branch.id}
                                    onClick={() => setSelectedBranch(branch)}
                                    className={`p-4 rounded-xl cursor-pointer transition-all duration-300 border relative ${
                                        isSelected
                                            ? 'bg-red-600/10 border-red-500 text-white shadow-md'
                                            : 'bg-[#252525] border-transparent text-gray-400 hover:bg-[#2e2e2e] hover:text-gray-200'
                                    }`}
                                >
                                    {isClosest && (
                                        <div className="absolute top-2 right-2 bg-yellow-500 text-black text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                                            🌟 Gần bạn nhất
                                        </div>
                                    )}

                                    <div className="font-bold text-sm text-white flex items-center justify-between pr-6">
                                        <span>{branch.name}</span>
                                        {isSelected && <CheckCircleOutlined className="text-red-500" />}
                                    </div>

                                    <div className="text-xs text-gray-400 mt-1 flex items-start space-x-1.5">
                                        <EnvironmentOutlined className="mt-0.5 flex-shrink-0 text-red-500" />
                                        <span className="line-clamp-2">{branch.address}</span>
                                    </div>

                                    <div className="flex items-center justify-between text-xs mt-3 pt-2 border-t border-gray-700/50">
                                        <span className="text-gray-300">
                                            📞 {branch.phone || '1900 6017'}
                                        </span>
                                        {branch.distance !== null && (
                                            <span className="text-yellow-400 font-bold bg-yellow-400/10 px-2 py-0.5 rounded">
                                                Cách {branch.distance} km
                                            </span>
                                        )}
                                    </div>

                                    {/* Google Maps Direction Button */}
                                    <div className="mt-2 text-right">
                                        <a
                                            href={`https://www.google.com/maps/dir/?api=1&destination=${branch.lat},${branch.lng}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            className="inline-flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 hover:underline"
                                        >
                                            <CompassOutlined /> Chỉ đường Google Maps
                                        </a>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Showtimes at Selected Branch */}
                    <div className="md:col-span-2 space-y-4">
                        <div className="bg-[#242424] p-4 rounded-xl border border-gray-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                            <div>
                                <h4 className="text-white font-extrabold text-lg flex items-center gap-2">
                                    🏢 {selectedBranch?.name || 'Cụm Rạp CGV'}
                                </h4>
                                <p className="text-gray-400 text-xs mt-0.5">
                                    📍 {selectedBranch?.address} • ⏰ Mở cửa: {selectedBranch?.openHours || '08:00 - 23:30'}
                                </p>
                            </div>
                            <span className="bg-red-600/20 text-red-400 border border-red-500/40 text-xs px-2.5 py-1 rounded-full font-bold">
                                {selectedBranch?.totalRooms || 8} Phòng chiếu HD/IMAX
                            </span>
                        </div>

                        <h4 className="text-white font-bold text-base">Lịch chiếu phim hôm nay tại rạp này:</h4>
                        <div className="space-y-4">
                            {allMovies.slice(0, 4).map((movie) => (
                                <div key={movie.id} className="bg-[#252525] p-4 rounded-xl flex flex-col sm:flex-row gap-4 items-center border border-gray-800 hover:border-gray-700 transition-colors">
                                    <img
                                        src={movie.poster_url || movie.thumb_url}
                                        alt={movie.name}
                                        referrerPolicy="no-referrer"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=200&auto=format&fit=crop';
                                        }}
                                        className="w-20 h-28 object-cover rounded-lg flex-shrink-0"
                                    />
                                    <div className="flex-1 space-y-2 text-center sm:text-left w-full">
                                        <h5 className="text-white font-bold text-lg">{movie.name}</h5>
                                        <div className="text-gray-400 text-xs flex items-center justify-center sm:justify-start space-x-3">
                                            <span>{movie.time || 120} phút</span>
                                            <span>•</span>
                                            <span className="text-yellow-400 font-bold">{movie.quality || '2D Digital'}</span>
                                            <span>•</span>
                                            <span className="text-red-400 font-mono font-bold">{Number(movie.price || 95000).toLocaleString()}đ</span>
                                        </div>
                                        {/* Showtime Buttons */}
                                        <div className="flex flex-wrap gap-2 pt-1">
                                            {['09:30', '11:45', '14:20', '17:15', '19:40', '22:10'].map((time) => (
                                                <Link key={time} to={`/booking/${movie.id}`}>
                                                    <button className="bg-[#333] hover:bg-red-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-700 hover:border-red-600 transition-all hover:scale-105">
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

            {/* ================= SECTION 4: ƯU ĐÃI & KHUYẾN MÃI ================= */}
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

            {/* ================= POST-MOVIE RATING MODAL ================= */}
            <Modal
                open={reviewModalVisible}
                onCancel={() => setReviewModalVisible(false)}
                footer={null}
                centered
                className="review-movie-modal"
            >
                {currentReviewMovie && (
                    <div className="p-2 text-center space-y-4">
                        <div className="w-16 h-16 mx-auto rounded-full bg-yellow-500/20 text-yellow-500 flex items-center justify-center text-3xl">
                            <StarFilled />
                        </div>
                        <h3 className="text-xl font-black text-gray-900">
                            Đánh giá phim & Nhận 50 XP
                        </h3>
                        <p className="text-gray-600 text-sm">
                            Bạn đã xem phim <strong className="text-red-600">{currentReviewMovie.name}</strong>. Cảm nhận của bạn về bộ phim này như thế nào?
                        </p>

                        <div className="py-2">
                            <Rate
                                value={reviewRating}
                                onChange={(val) => setReviewRating(val)}
                                style={{ fontSize: 32, color: '#f59e0b' }}
                            />
                            <div className="text-xs text-gray-500 mt-1">
                                {reviewRating === 5 && '🌟 Tuyệt đỉnh, rất đáng xem!'}
                                {reviewRating === 4 && '👍 Phim hay, hình ảnh đẹp!'}
                                {reviewRating === 3 && '👌 Phim tạm ổn, xem giải trí'}
                                {reviewRating === 2 && '👎 Chưa như kỳ vọng'}
                                {reviewRating === 1 && '⚠️ Không thích'}
                            </div>
                        </div>

                        <Input.TextArea
                            rows={3}
                            placeholder="Chia sẻ vài dòng cảm nghĩ của bạn về bộ phim (tùy chọn)..."
                            value={reviewComment}
                            onChange={(e) => setReviewComment(e.target.value)}
                        />

                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2.5 text-xs text-yellow-800 text-left flex items-center gap-2">
                            <TrophyOutlined className="text-base text-yellow-600 flex-shrink-0" />
                            <span>Sau khi gửi đánh giá, bạn sẽ nhận được ngay <strong>+50 điểm kinh nghiệm (XP)</strong> vào thẻ thành viên!</span>
                        </div>

                        <div className="flex gap-2 pt-2">
                            <Button
                                onClick={() => setReviewModalVisible(false)}
                                style={{ flex: 1 }}
                            >
                                Đóng
                            </Button>
                            <Button
                                type="primary"
                                loading={submittingReview}
                                onClick={handleSubmitReview}
                                icon={<SendOutlined />}
                                style={{ flex: 2, background: '#ef4444' }}
                            >
                                Gửi Đánh Giá (+50 XP)
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Global Trailer Modal */}
            <TrailerModal
                isOpen={!!selectedTrailerMovie}
                onClose={() => setSelectedTrailerMovie(null)}
                movie={selectedTrailerMovie}
            />
        </div>
    );
}

export default HomePage;
