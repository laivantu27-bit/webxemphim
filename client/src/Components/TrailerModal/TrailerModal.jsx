import React, { useEffect } from 'react';
import { CloseOutlined, PlayCircleOutlined, VideoCameraOutlined } from '@ant-design/icons';

// Utility to parse YouTube URLs into embed URLs with autoplay
export const getYouTubeEmbedUrl = (url) => {
    if (!url) return null;
    const trimmed = url.trim();
    if (trimmed.includes('youtube.com/embed/')) {
        return trimmed.includes('autoplay=1') ? trimmed : `${trimmed}${trimmed.includes('?') ? '&' : '?'}autoplay=1&rel=0`;
    }
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = trimmed.match(regExp);
    if (match && match[2].length === 11) {
        return `https://www.youtube.com/embed/${match[2]}?autoplay=1&rel=0&modestbranding=1`;
    }
    return null;
};

// Check if URL points directly to a video file
export const isDirectVideoUrl = (url) => {
    if (!url) return false;
    return /\.(mp4|webm|ogg|m4v)(\?.*)?$/i.test(url);
};

export default function TrailerModal({ isOpen, onClose, movie }) {
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            window.addEventListener('keydown', handleKeyDown);
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen || !movie) return null;

    const trailerUrl = movie.trailer_url || '';
    const youtubeEmbed = getYouTubeEmbedUrl(trailerUrl);
    const isDirectVideo = isDirectVideoUrl(trailerUrl);

    return (
        <div 
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
            onClick={onClose}
        >
            <div 
                className="relative w-full max-w-4xl bg-[#141414] rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-red-950/60 to-[#181818] border-b border-white/10">
                    <div className="flex items-center space-x-3">
                        <span className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white shadow-md shadow-red-600/50">
                            <PlayCircleOutlined className="text-base" />
                        </span>
                        <div>
                            <h3 className="text-white text-lg font-bold line-clamp-1">
                                {movie.name}
                            </h3>
                            <span className="text-xs text-red-400 font-medium tracking-wide uppercase">
                                Trailer Chính Thức
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-9 h-9 rounded-full bg-white/10 hover:bg-red-600 text-white flex items-center justify-center transition-all duration-200"
                        title="Đóng trailer (Esc)"
                    >
                        <CloseOutlined className="text-base" />
                    </button>
                </div>

                {/* Video Player Area (16:9 Aspect Ratio) */}
                <div className="relative w-full aspect-video bg-black flex items-center justify-center">
                    {youtubeEmbed ? (
                        <iframe
                            src={youtubeEmbed}
                            title={`${movie.name} Official Trailer`}
                            className="w-full h-full border-0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                        />
                    ) : isDirectVideo ? (
                        <video
                            src={trailerUrl}
                            controls
                            autoPlay
                            className="w-full h-full object-contain"
                        >
                            Trình duyệt của bạn không hỗ trợ phát video này.
                        </video>
                    ) : trailerUrl ? (
                        /* Generic iframe fallback for other embed URLs */
                        <iframe
                            src={trailerUrl}
                            title={`${movie.name} Trailer`}
                            className="w-full h-full border-0"
                            allow="autoplay; encrypted-media"
                            allowFullScreen
                        />
                    ) : (
                        <div className="text-center p-8 space-y-3">
                            <VideoCameraOutlined className="text-5xl text-gray-500" />
                            <p className="text-gray-300 font-medium">Trailer của bộ phim này đang được cập nhật!</p>
                            <p className="text-xs text-gray-500">Vui lòng quay lại sau ít phút hoặc tiến hành đặt vé xem phim.</p>
                        </div>
                    )}
                </div>

                {/* Footer Info */}
                <div className="px-6 py-3.5 bg-[#181818] flex flex-wrap items-center justify-between gap-3 text-sm text-gray-400 border-t border-white/5">
                    <div className="flex items-center space-x-3">
                        <span className="bg-red-600/20 text-red-400 text-xs font-semibold px-2.5 py-1 rounded border border-red-600/30">
                            {movie.quality || 'HD'}
                        </span>
                        {movie.time && <span>Thời lượng: {movie.time} phút</span>}
                        {movie.year && <span>• Năm: {movie.year}</span>}
                    </div>
                    {movie.id && (
                        <a
                            href={`/booking/${movie.id}`}
                            className="inline-flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs px-4 py-2 rounded-full transition-all shadow-md shadow-red-600/30"
                        >
                            <span>Đặt vé xem phim ngay</span>
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
}

