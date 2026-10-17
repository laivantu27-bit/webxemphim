import { useState, useEffect } from 'react';
import Header from '../Components/Header';
import Footer from '../Components/Footer';
import axios from 'axios';

import { Link, useParams } from 'react-router-dom';
import { requestGetMovieById } from '../config/request';
import { Rate } from 'antd';
import TrailerModal, { getYouTubeEmbedUrl } from '../Components/TrailerModal/TrailerModal';

function DetailMovie() {
    const [movie, setMovie] = useState(null);
    const [loading, setLoading] = useState(true);
    const [previewMovie, setPreviewMovie] = useState(null);
    const [isTrailerOpen, setIsTrailerOpen] = useState(false);

    const { id } = useParams();

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const res = await requestGetMovieById(id);
                setMovie(res.metadata);
                setPreviewMovie(res.metadata.previewMovie);
            } catch (error) {
                console.error('Error fetching movie data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    if (loading) {
        return (
            <div className="bg-[#161616] min-h-screen text-white flex items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-red-600"></div>
            </div>
        );
    }

    if (!movie) {
        return (
            <div className="bg-[#161616] min-h-screen text-white flex items-center justify-center">
                <p className="text-xl">Không tìm thấy thông tin phim</p>
            </div>
        );
    }

    return (
        <div className="bg-[#161616] min-h-screen text-white">
            <header>
                <Header />
            </header>

            <main>
                {/* Hero Section with Backdrop */}
                <div className="relative">
                    {/* Backdrop with gradient overlay */}
                    <div className="w-full h-[90vh] relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent z-10"></div>
                        <img
                            src={`${movie.thumb_url}`}
                            alt={movie.name}
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1200&auto=format&fit=crop';
                            }}
                            className="w-full h-full object-cover object-center"
                        />
                    </div>

                    {/* Movie details overlay */}
                    <div className="absolute inset-0 z-20 flex items-center">
                        <div className="container mx-auto px-4 md:px-8 flex flex-col md:flex-row gap-8 items-start">
                            {/* Poster with play button */}
                            <div className="relative w-[280px] h-[400px] flex-shrink-0">
                                <img
                                    src={`${movie.poster_url}`}
                                    alt={movie.name}
                                    referrerPolicy="no-referrer"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop';
                                    }}
                                    className="w-full h-full object-cover rounded-md shadow-xl"
                                />
                                <div 
                                    className="absolute inset-0 flex items-center justify-center cursor-pointer group"
                                    onClick={() => setIsTrailerOpen(true)}
                                    title="Bấm để xem Trailer"
                                >
                                    <div className="w-16 h-16 rounded-full bg-red-600/60 group-hover:bg-red-600 group-hover:scale-110 flex items-center justify-center transition-all duration-300 shadow-xl shadow-red-600/40">
                                        <div className="w-14 h-14 rounded-full bg-red-600 flex items-center justify-center">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-8 w-8 ml-0.5"
                                                viewBox="0 0 20 20"
                                                fill="currentColor"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                        </div>
                                    </div>
                                    <span className="absolute bottom-4 bg-black/75 backdrop-blur-sm text-xs font-semibold px-3 py-1 rounded-full text-white/90 border border-white/10 group-hover:bg-red-600 transition-colors">
                                        ▶ Xem Trailer
                                    </span>
                                </div>
                            </div>

                            {/* Movie information */}
                            <div className="flex-1 p-4">
                                <h1 className="text-4xl md:text-5xl font-bold text-red-600 mb-2">{movie.name}</h1>

                                {/* Movie details */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2 mb-8">
                                    <div className="flex gap-2 text-sm">
                                        <span className="text-gray-400 w-24">Đạo diễn:</span>
                                        <span>{movie.director || 'Đang cập nhật'}</span>
                                    </div>
                                    <div className="flex gap-2 text-sm">
                                        <span className="text-gray-400 w-24">Thời lượng:</span>
                                        <span>{movie.time || 'Đang cập nhật'} phút</span>
                                    </div>
                                    <div className="flex gap-2 text-sm">
                                        <span className="text-gray-400 w-24">Chất lượng:</span>
                                        <span>{movie.quality || 'HD'}</span>
                                    </div>
                                    <div className="flex gap-2 text-sm">
                                        <span className="text-gray-400 w-24">Giá vé:</span>
                                        <span>
                                            {movie.price
                                                ? `${parseInt(movie.price).toLocaleString('vi-VN')} VND`
                                                : 'Đang cập nhật'}
                                        </span>
                                    </div>
                                    <div className="flex gap-2 text-sm">
                                        <span className="text-gray-400 w-24">Năm sản xuất:</span>
                                        <span>{movie.year}</span>
                                    </div>
                                    <div className="flex gap-2 text-sm">
                                        <span className="text-gray-400 w-24">Quốc gia:</span>
                                        <span>{movie.country || 'Đang cập nhật'}</span>
                                    </div>
                                    <div className="flex gap-2 text-sm col-span-2">
                                        <span className="text-gray-400 w-24">Thể loại:</span>
                                        <span>{movie.category || 'Đang cập nhật'}</span>
                                    </div>
                                    <div className="flex gap-2 text-sm col-span-2">
                                        <span className="text-gray-400 w-24">Diễn viên:</span>
                                        <span>{movie.actor || 'Đang cập nhật'}</span>
                                    </div>

                                    <div className="flex gap-2 text-sm col-span-2">
                                        <span className="text-gray-400 w-24">Năm sản xuất:</span>
                                        <span>{movie.year || 'Đang cập nhật'}</span>
                                    </div>
                                </div>

                                {/* Action buttons */}
                                <div className="flex flex-wrap gap-4 mt-8">
                                    <Link to={`/booking/${movie.id}`}>
                                        <button className="bg-red-600 hover:bg-red-700 text-white py-3.5 px-8 rounded-xl text-lg font-bold shadow-lg shadow-red-600/40 hover:scale-105 transition-all">
                                            Đặt vé ngay
                                        </button>
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={() => setIsTrailerOpen(true)}
                                        className="bg-white/10 hover:bg-white/20 text-white border border-white/20 py-3.5 px-7 rounded-xl text-lg font-semibold flex items-center space-x-2 backdrop-blur-md hover:scale-105 transition-all shadow-md"
                                    >
                                        <span>🎬 Xem Trailer</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Movie description */}
                <div className="container mx-auto px-4 py-12">
                    <h2 className="text-2xl font-bold mb-6 text-red-600 border-l-4 border-red-600 pl-4">
                        NỘI DUNG PHIM - {movie.name}
                    </h2>
                    <div className="bg-[#212121] p-6 rounded-lg">
                        <p className="text-gray-300 leading-relaxed">
                            {movie.description || 'Đang cập nhật nội dung phim...'}
                        </p>
                    </div>

                    {/* Trailer Video Section */}
                    {movie.trailer_url && (
                        <div className="mt-12">
                            <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
                                <h2 className="text-xl sm:text-2xl font-bold text-red-600 border-l-4 border-red-600 pl-4">
                                    TRAILER / VIDEO PHIM - {movie.name}
                                </h2>
                                <div className="flex items-center space-x-2">
                                    {movie.trailer_url && movie.trailer_url.startsWith('http') && (
                                        <a
                                            href={movie.trailer_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs sm:text-sm bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white px-3 py-1.5 rounded-full border border-red-600/40 transition-all flex items-center space-x-1"
                                        >
                                            <span>▶ Mở trên YouTube</span>
                                        </a>
                                    )}
                                    <button
                                        onClick={() => setIsTrailerOpen(true)}
                                        className="text-xs sm:text-sm bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-full transition-all flex items-center space-x-1 shadow-md shadow-red-600/30"
                                    >
                                        <span>🔍 Xem toàn màn hình</span>
                                    </button>
                                </div>
                            </div>
                            <div className="bg-[#212121] p-4 sm:p-6 rounded-2xl border border-white/5 shadow-2xl">
                                <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black shadow-inner">
                                    {getYouTubeEmbedUrl(movie.trailer_url) ? (
                                        <iframe
                                            src={getYouTubeEmbedUrl(movie.trailer_url).replace('autoplay=1', 'autoplay=0')}
                                            title={`${movie.name} Trailer`}
                                            className="w-full h-full border-0"
                                            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        />
                                    ) : (
                                        <video
                                            src={movie.trailer_url}
                                            controls
                                            className="w-full h-full object-contain"
                                        >
                                            Trình duyệt của bạn không hỗ trợ phát video này.
                                        </video>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Reviews section */}
                    <div className="mt-12">
                        <h2 className="text-2xl font-bold mb-6 text-red-600 border-l-4 border-red-600 pl-4">
                            ĐÁNH GIÁ PHIM
                        </h2>
                        {previewMovie &&
                            previewMovie.map((preview) => (
                                <div key={preview.id}>
                                    <div className="flex gap-4 items-center bg-[#212121] p-4 rounded-lg">
                                        <img
                                            className="w-10 h-10 rounded-full"
                                            src={
                                                preview.user.avatar ||
                                                'https://img.freepik.com/premium-vector/user-profile-icon-flat-style-member-avatar-vector-illustration-isolated-background-human-permission-sign-business-concept_157943-15752.jpg?semt=ais_hybrid&w=740'
                                            }
                                            alt=""
                                        />
                                        <div className="flex flex-col gap-2">
                                            <Rate value={preview.rating} disabled style={{ fontSize: '15px' }} />
                                            <h1 className="text-lg font-bold">{preview.user.fullName}</h1>
                                            <p className="text-gray-300">{preview.comment}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            </main>

            <TrailerModal
                isOpen={isTrailerOpen}
                onClose={() => setIsTrailerOpen(false)}
                movie={movie}
            />

            <Footer />
        </div>
    );
}

export default DetailMovie;
