import { useEffect, useState, useRef } from 'react';
import Slider from 'react-slick';
import { Link } from 'react-router-dom';
import { LeftOutlined, RightOutlined, StarFilled, PlayCircleOutlined } from '@ant-design/icons';
import '../App.css';
import { requestFindMovieNew } from '../config/request';

function Banner() {
    const [data, setData] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const sliderRef = useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await requestFindMovieNew();
                if (res && res.metadata && res.metadata.length > 0) {
                    setData(res.metadata.slice(0, 5));
                }
            } catch (err) {
                console.error('Error fetching banner movies:', err);
            }
        };
        fetchData();
    }, []);

    const settings = {
        dots: false,
        infinite: true,
        speed: 800,
        slidesToShow: 1,
        slidesToScroll: 1,
        autoplay: true,
        autoplaySpeed: 6000,
        arrows: false,
        fade: true,
        beforeChange: (current, next) => {
            setCurrentIndex(next);
        },
    };

    const handleThumbnailClick = (index) => {
        setCurrentIndex(index);
        if (sliderRef.current) {
            sliderRef.current.slickGoTo(index);
        }
    };

    if (!data || data.length === 0) {
        return null;
    }

    return (
        <div className="w-full h-[100vh] relative overflow-hidden bg-black select-none">
            {/* Slider Component */}
            <Slider ref={sliderRef} {...settings}>
                {data.map((item, index) => (
                    <div key={item.id || index} className="outline-none">
                        <div className="w-full h-[100vh] relative">
                            {/* Backdrop Image */}
                            <img
                                className="w-full h-full object-cover object-center scale-105 transition-transform duration-1000"
                                src={item.thumb_url}
                                alt={item.name}
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1600&auto=format&fit=crop';
                                }}
                            />

                            {/* Heavy dark gradient overlays matching FlixFlow reference design */}
                            <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/60 to-transparent"></div>
                            <div className="absolute inset-0 bg-gradient-to-r from-[#141414] via-[#141414]/70 to-transparent w-3/4"></div>

                            {/* Banner Content Container */}
                            <div className="absolute inset-x-0 bottom-24 w-[90%] mx-auto z-20 flex flex-col items-start space-y-4 max-w-2xl">
                                {/* Badge & Slide Index */}
                                <div className="flex items-center space-x-3">
                                    <span className="bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded uppercase tracking-wider">
                                        NỔI BẬT
                                    </span>
                                    <span className="text-gray-300 text-sm font-mono">
                                        0{index + 1} / 0{data.length}
                                    </span>
                                </div>

                                {/* Movie Title */}
                                <h1 className="text-4xl md:text-6xl font-black text-white leading-tight drop-shadow-lg">
                                    {item.name}
                                </h1>

                                {/* Rating & Meta Attributes */}
                                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-300">
                                    <div className="flex items-center space-x-1 text-yellow-400 font-bold">
                                        <StarFilled />
                                        <StarFilled />
                                        <StarFilled />
                                        <StarFilled />
                                        <StarFilled />
                                        <span className="text-white ml-1.5 font-semibold">4.8/5</span>
                                    </div>
                                    <span className="text-gray-500">•</span>
                                    <span>{item.time || '137'} phút</span>
                                    <span className="text-gray-500">•</span>
                                    <span>Đạo diễn: {item.director || 'Christopher Nolan'}</span>
                                    <span className="text-gray-500">•</span>
                                    <span className="bg-red-600/80 text-white text-xs px-2 py-0.5 rounded font-medium">
                                        {item.quality || '2D HD'}
                                    </span>
                                </div>

                                {/* Short Description */}
                                <p className="text-gray-300 text-base leading-relaxed line-clamp-2 max-w-xl">
                                    {item.description && item.description.length > 30
                                        ? item.description
                                        : `Đây là mô tả cho bộ phim ${item.name}. Phim mang đến những cảnh quay mãn nhãn và cốt truyện vô cùng hấp dẫn.`}
                                </p>

                                {/* Action CTA Button "Đặt Vé Ngay" */}
                                <div className="pt-2">
                                    <Link to={`/booking/${item.id}`}>
                                        <button className="bg-red-600 hover:bg-red-700 text-white font-bold text-base px-8 py-3.5 rounded-full flex items-center space-x-2.5 shadow-lg shadow-red-600/40 hover:scale-105 transition-all duration-300">
                                            <PlayCircleOutlined className="text-xl" />
                                            <span>Đặt Vé Ngay</span>
                                        </button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </Slider>

            {/* Left & Right Arrow Navigation Controls */}
            <button
                onClick={() => sliderRef.current?.slickPrev()}
                className="absolute left-6 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-black/40 hover:bg-red-600 text-white flex items-center justify-center backdrop-blur-sm border border-white/20 transition-all duration-300"
                aria-label="Previous slide"
            >
                <LeftOutlined className="text-lg" />
            </button>
            <button
                onClick={() => sliderRef.current?.slickNext()}
                className="absolute right-6 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-black/40 hover:bg-red-600 text-white flex items-center justify-center backdrop-blur-sm border border-white/20 transition-all duration-300"
                aria-label="Next slide"
            >
                <RightOutlined className="text-lg" />
            </button>

            {/* Bottom-right Thumbnail Preview Cards Carousel */}
            <div className="absolute right-12 bottom-12 z-30 hidden lg:flex items-center space-x-3 bg-black/50 p-2.5 rounded-2xl backdrop-blur-md border border-white/10">
                {data.map((item, idx) => (
                    <div
                        key={item.id || idx}
                        onClick={() => handleThumbnailClick(idx)}
                        className={`w-16 h-24 rounded-lg overflow-hidden cursor-pointer transition-all duration-300 relative border-2 ${
                            currentIndex === idx
                                ? 'border-red-600 scale-105 shadow-md shadow-red-600/50'
                                : 'border-transparent opacity-60 hover:opacity-100'
                        }`}
                    >
                        <img
                            src={item.poster_url}
                            alt={item.name}
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=300&auto=format&fit=crop';
                            }}
                            className="w-full h-full object-cover"
                        />
                    </div>
                ))}
            </div>

            {/* Bottom-left Slide Progress Indicator Dots */}
            <div className="absolute left-12 bottom-10 z-30 flex items-center space-x-2">
                {data.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => handleThumbnailClick(idx)}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                            currentIndex === idx ? 'w-8 bg-red-600' : 'w-2 bg-gray-600 hover:bg-gray-400'
                        }`}
                    />
                ))}
            </div>
        </div>
    );
}

export default Banner;
