import { useEffect, useState } from 'react';
import Footer from '../Components/Footer';
import Header from '../Components/Header';
import { Radio, Button, Divider, Modal, message, Tag, Badge, Input, Alert, Spin } from 'antd';
import {
    EnvironmentOutlined,
    ClockCircleOutlined,
    CalendarOutlined,
    CoffeeOutlined,
    TagOutlined,
    PlusOutlined,
    MinusOutlined,
    CheckCircleFilled,
    ExclamationCircleFilled,
    CheckOutlined,
    CloseOutlined,
    GiftOutlined,
    CreditCardOutlined,
    ShopOutlined,
    CopyOutlined,
    QrcodeOutlined,
    SafetyCertificateFilled,
    DownloadOutlined,
} from '@ant-design/icons';
import momoLogo from '../assets/images/momo-logo.png';
import vnpayLogo from '../assets/images/vnpay-logo.png';
import moment from 'moment';
import axios from 'axios';

import { useParams } from 'react-router-dom';
import {
    requestCreatePayment,
    requestGetMovieById,
    requestGetSeatByMovieId,
    requestGetActiveServices,
    requestGetActiveVouchers,
    requestCheckVoucher,
} from '../config/request';
import {
    calculateSeatsTotal,
    getSeatPrice,
    ROW_PRICE_CONFIG,
} from '../utils/seatPricing';

function BookMovie() {
    const [selectedDate, setSelectedDate] = useState(moment()); // Default to today's date
    const [selectedTime, setSelectedTime] = useState(null);
    const [selectedSeats, setSelectedSeats] = useState([]);
    const [paymentMethod, setPaymentMethod] = useState('vietqr');
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isVietQrModalVisible, setIsVietQrModalVisible] = useState(false);
    const [vietQrCode, setVietQrCode] = useState('');
    const [qrCountdown, setQrCountdown] = useState(900);
    const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
    const [movieDetails, setMovieDetails] = useState(null);
    const [availableDates, setAvailableDates] = useState([]);
    const [currentTime, setCurrentTime] = useState(moment());
    const [seats, setSeats] = useState([]);
    const [seatsByRow, setSeatsByRow] = useState({});
    const [isLoadingSeats, setIsLoadingSeats] = useState(false);

    // Services (snacks & drinks) state
    const [services, setServices] = useState([]);
    const [selectedServices, setSelectedServices] = useState({}); // { [id]: count }
    const [serviceFilter, setServiceFilter] = useState('all');
    const [isLoadingServices, setIsLoadingServices] = useState(false);

    // Vouchers state
    const [vouchers, setVouchers] = useState([]);
    const [voucherCodeInput, setVoucherCodeInput] = useState('');
    const [appliedVoucher, setAppliedVoucher] = useState(null);
    const [voucherDiscount, setVoucherDiscount] = useState(0);
    const [voucherError, setVoucherError] = useState('');
    const [isCheckingVoucher, setIsCheckingVoucher] = useState(false);

    const { id } = useParams();

    // Fetch active snacks and vouchers on component mount
    useEffect(() => {
        const fetchServicesAndVouchers = async () => {
            try {
                setIsLoadingServices(true);
                const [servicesRes, vouchersRes] = await Promise.all([
                    requestGetActiveServices(),
                    requestGetActiveVouchers(),
                ]);
                setServices(servicesRes.metadata || []);
                setVouchers(vouchersRes.metadata || []);
            } catch (err) {
                console.error('Lỗi khi tải bắp nước / mã giảm giá:', err);
            } finally {
                setIsLoadingServices(false);
            }
        };
        fetchServicesAndVouchers();
    }, []);

    // Service quantity handlers
    const handleIncreaseService = (serviceId) => {
        setSelectedServices((prev) => ({
            ...prev,
            [serviceId]: (prev[serviceId] || 0) + 1,
        }));
    };

    const handleDecreaseService = (serviceId) => {
        setSelectedServices((prev) => {
            const current = prev[serviceId] || 0;
            if (current <= 1) {
                const next = { ...prev };
                delete next[serviceId];
                return next;
            }
            return {
                ...prev,
                [serviceId]: current - 1,
            };
        });
    };

    // Update current time every minute
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(moment());
        }, 60000); // update every minute

        return () => clearInterval(timer);
    }, []);

    // Countdown timer for VietQR payment modal
    useEffect(() => {
        let timer = null;
        if (isVietQrModalVisible && qrCountdown > 0) {
            timer = setInterval(() => {
                setQrCountdown((prev) => (prev > 0 ? prev - 1 : 0));
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [isVietQrModalVisible, qrCountdown]);

    const formatCountdown = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleCopy = (text, label) => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text);
        }
        message.success(`Đã sao chép ${label}!`);
    };

    // Map for Vietnamese day names
    const viDayNames = {
        Mon: 'Thứ 2',
        Tue: 'Thứ 3',
        Wed: 'Thứ 4',
        Thu: 'Thứ 5',
        Fri: 'Thứ 6',
        Sat: 'Thứ 7',
        Sun: 'CN',
    };

    // Get Vietnamese day name
    const getViDayName = (date) => {
        const englishDay = date.format('ddd');
        return viDayNames[englishDay] || englishDay;
    };

    // Fetch movie details
    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await requestGetMovieById(id);
                setMovieDetails(res.metadata);

                // Generate available dates for the next 30 days by default
                const dates = [];
                const today = moment();
                let startDate = today.clone();

                // If movie has dateStart and it's in the future, use it as the start date
                if (res.metadata.dateStart) {
                    const movieStartDate = moment(res.metadata.dateStart);
                    if (movieStartDate.isValid() && movieStartDate.isAfter(today)) {
                        startDate = movieStartDate;
                    }
                }

                // Calculate end date (use dateEnd if available, otherwise today + 30 days)
                const endDate =
                    res.metadata.dateEnd && moment(res.metadata.dateEnd).isValid()
                        ? moment(res.metadata.dateEnd)
                        : today.clone().add(30, 'days');

                // Generate dates from start to end
                let currentDate = startDate.clone();
                while (currentDate.isSameOrBefore(endDate)) {
                    dates.push(currentDate.clone());
                    currentDate.add(1, 'days');
                }

                setAvailableDates(dates);

                // Always set default date to today unless today is before movie start date
                if (startDate.isAfter(today)) {
                    setSelectedDate(startDate);
                } else {
                    setSelectedDate(today);
                }
            } catch (error) {
                console.error('Error fetching movie data:', error);
            }
        };
        fetchData();
    }, [id]);

    // Fetch seats when movie, date and time are selected
    useEffect(() => {
        if (movieDetails && selectedDate && selectedTime) {
            fetchSeats();
        }
    }, [movieDetails, selectedDate, selectedTime]);

    // Mock data for available time slots
    const availableTimeSlots = ['10:00', '12:30', '15:00', '17:30', '20:00', '22:30'];

    // Fetch seats from the server
    const fetchSeats = async () => {
        setIsLoadingSeats(true);
        try {
            // Format date for API request
            const formattedDate = selectedDate.format('YYYY-MM-DD');

            try {
                const data = {
                    date: formattedDate,
                    time: selectedTime,
                    idMovie: id,
                };
                // Gọi API để lấy danh sách ghế đã đặt theo ngày và giờ
                const response = await requestGetSeatByMovieId(data);

                // API trả về dữ liệu trong response.metadata
                if (response && response.metadata) {
                    // Lấy danh sách ghế đã đặt từ API
                    const bookedSeats = response.metadata;

                    // Tạo danh sách mã ghế đã đặt
                    const bookedSeatCodes = bookedSeats.map((seat) => seat.seat_code);

                    // Tạo bản đồ chỗ ngồi đầy đủ
                    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
                    const allSeats = [];
                    const seatsByRowObj = {};

                    rows.forEach((row) => {
                        seatsByRowObj[row] = [];
                        for (let i = 1; i <= 12; i++) {
                            const seatCode = `${row}${i}`;

                            // Kiểm tra ghế đã được đặt hay chưa
                            const isBooked = bookedSeatCodes.includes(seatCode);

                            const seat = {
                                row: row,
                                number: i,
                                seat_code: seatCode,
                                status: isBooked ? 'booked' : 'available',
                                movieId: id,
                                date: formattedDate,
                                time: selectedTime,
                            };

                            allSeats.push(seat);
                            seatsByRowObj[row].push(seat);
                        }
                    });

                    // Sắp xếp các hàng ghế theo thứ tự bảng chữ cái
                    const sortedSeatsByRow = Object.fromEntries(
                        Object.entries(seatsByRowObj).sort(([rowA], [rowB]) => rowA.localeCompare(rowB)),
                    );

                    // Cập nhật state
                    setSeats(allSeats);
                    setSeatsByRow(sortedSeatsByRow);
                    setSelectedSeats([]); // Reset selected seats when changing time/date
                    setIsLoadingSeats(false);
                    return;
                }
            } catch (apiError) {
                console.error('Error fetching seats from API:', apiError);
            }

            // Nếu API thất bại hoặc không có dữ liệu, tạo bản đồ chỗ ngồi mô phỏng
            const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
            const mockSeats = [];
            const mockSeatsByRow = {};

            rows.forEach((row) => {
                mockSeatsByRow[row] = [];
                for (let i = 1; i <= 12; i++) {
                    // Chỉ sử dụng trạng thái "available" và "booked" theo API
                    const randomStatus = Math.random() < 0.85 ? 'available' : 'booked';

                    const seat = {
                        row: row,
                        number: i,
                        seat_code: `${row}${i}`,
                        status: randomStatus,
                        movieId: id,
                        date: formattedDate,
                        time: selectedTime,
                    };

                    mockSeats.push(seat);
                    mockSeatsByRow[row].push(seat);
                }
            });

            setSeats(mockSeats);
            setSeatsByRow(mockSeatsByRow);
            setSelectedSeats([]); // Reset selected seats when changing time/date
        } catch (error) {
            console.error('Error fetching seats:', error);
            message.error('Không thể tải dữ liệu ghế ngồi');
        } finally {
            setIsLoadingSeats(false);
        }
    };

    // Check if a time slot is already past for today
    const isTimeSlotPast = (timeSlot) => {
        // Only apply time restrictions for today
        if (!selectedDate.isSame(moment(), 'day')) return false;

        const [hours, minutes] = timeSlot.split(':').map(Number);
        const slotTime = moment().set({
            hours,
            minutes,
            seconds: 0,
            milliseconds: 0,
        });

        // Add 10 minutes buffer (cannot book less than 10 minutes before showtime)
        return slotTime.isBefore(moment().add(10, 'minutes'));
    };

    const handleSeatClick = (seatCode) => {
        const seat = seats.find((s) => s.seat_code === seatCode);

        if (!seat || seat.status !== 'available') {
            return;
        }

        if (selectedSeats.includes(seatCode)) {
            setSelectedSeats(selectedSeats.filter((code) => code !== seatCode));
        } else {
            setSelectedSeats([...selectedSeats, seatCode]);
        }
    };

    const getSeatStatus = (seatCode) => {
        const seat = seats.find((s) => s.seat_code === seatCode);
        if (!seat) return 'booked';

        if (seat.status === 'booked') {
            return 'booked';
        }

        return selectedSeats.includes(seatCode) ? 'selected' : 'available';
    };

    const handleDateChange = (date) => {
        setSelectedDate(date);
        setSelectedTime(null); // Reset time when date changes
        setSelectedSeats([]); // Reset selected seats
    };

    const handleTimeSelection = (time) => {
        if (isTimeSlotPast(time)) {
            message.error('Suất chiếu này đã bắt đầu. Vui lòng chọn suất chiếu khác.');
            return;
        }
        setSelectedTime(time);
    };

    const handlePayment = () => {
        if (!selectedDate || !selectedTime || selectedSeats.length === 0 || !paymentMethod) {
            message.error('Vui lòng chọn đầy đủ thông tin đặt vé!');
            return;
        }

        if (paymentMethod === 'vietqr') {
            const randomCode = 'SP' + Math.floor(100000 + Math.random() * 900000);
            setVietQrCode(randomCode);
            setQrCountdown(900); // 15 phút
            setIsVietQrModalVisible(true);
        } else {
            setIsModalVisible(true);
        }
    };

    // Price calculations: giá từng hàng ghế khác nhau (ngồi đầu cao hơn ngồi sau)
    const ticketPrice = movieDetails?.price ? parseInt(movieDetails.price, 10) : 0;
    const ticketTotal = calculateSeatsTotal(ticketPrice, selectedSeats);


    // Selected services list with details
    const selectedServicesList = services
        .filter((s) => (selectedServices[s.id] || 0) > 0)
        .map((s) => ({
            id: s.id,
            name: s.name,
            price: s.price,
            image: s.image,
            category: s.category,
            quantity: selectedServices[s.id],
        }));

    const snackTotal = selectedServicesList.reduce(
        (sum, item) => sum + (item.price || 0) * item.quantity,
        0,
    );

    const subtotal = ticketTotal + snackTotal;

    // Re-check voucher validity when subtotal changes
    useEffect(() => {
        if (appliedVoucher) {
            if (subtotal < (appliedVoucher.minOrderValue || 0)) {
                setVoucherError(
                    `Mã "${appliedVoucher.code}" yêu cầu đơn tối thiểu ${(appliedVoucher.minOrderValue || 0).toLocaleString('vi-VN')} đ. Đơn hiện tại: ${subtotal.toLocaleString('vi-VN')} đ (còn thiếu ${(appliedVoucher.minOrderValue - subtotal).toLocaleString('vi-VN')} đ). Hãy chọn thêm vé hoặc bắp nước để được áp dụng!`
                );
                setAppliedVoucher(null);
                setVoucherDiscount(0);
            } else {
                if (appliedVoucher.discountType === 'percent') {
                    const rawDiscount = Math.round((subtotal * appliedVoucher.discountValue) / 100);
                    const finalDiscount = appliedVoucher.maxDiscount > 0 ? Math.min(rawDiscount, appliedVoucher.maxDiscount) : rawDiscount;
                    setVoucherDiscount(finalDiscount);
                } else {
                    setVoucherDiscount(Math.min(appliedVoucher.discountValue, subtotal));
                }
                setVoucherError('');
            }
        }
    }, [subtotal, appliedVoucher]);

    const discountAmount = appliedVoucher ? voucherDiscount : 0;
    const totalAmount = Math.max(0, subtotal - discountAmount);
    const formattedPrice = (price) => (price || 0).toLocaleString('vi-VN') + ' VNĐ';

    const handleApplyVoucher = async (codeParam) => {
        const code = (typeof codeParam === 'string' ? codeParam : voucherCodeInput).trim().toUpperCase();
        if (!code) {
            message.warning('Vui lòng nhập mã giảm giá');
            return;
        }

        if (subtotal === 0) {
            message.warning('Vui lòng chọn ghế trước khi áp dụng mã giảm giá');
            return;
        }

        try {
            setIsCheckingVoucher(true);
            setVoucherError('');
            const res = await requestCheckVoucher({
                code,
                orderAmount: subtotal,
            });

            if (res.metadata?.valid) {
                setAppliedVoucher(res.metadata.voucher);
                setVoucherDiscount(res.metadata.discountAmount);
                setVoucherCodeInput(code);
                message.success(`Áp dụng thành công mã "${code}": Giảm ${res.metadata.discountAmount.toLocaleString('vi-VN')} VNĐ!`);
            }
        } catch (err) {
            const errMsg = err.response?.data?.message || 'Mã giảm giá không hợp lệ hoặc chưa đủ điều kiện áp dụng';
            setVoucherError(errMsg);
            setAppliedVoucher(null);
            setVoucherDiscount(0);
            message.error(errMsg);
        } finally {
            setIsCheckingVoucher(false);
        }
    };

    const handleRemoveVoucher = () => {
        setAppliedVoucher(null);
        setVoucherDiscount(0);
        setVoucherError('');
        setVoucherCodeInput('');
        message.info('Đã hủy áp dụng mã giảm giá');
    };

    const handlePaymentConfirm = async () => {
        setIsSubmittingPayment(true);
        const data = {
            typePayment: paymentMethod,
            idMovie: movieDetails.id,
            idSeat: selectedSeats,
            time: selectedTime,
            date: selectedDate.format('YYYY-MM-DD'),
            services: selectedServicesList,
            voucherCode: appliedVoucher ? appliedVoucher.code : null,
            discountAmount: discountAmount,
            totalPrice: totalAmount,
        };

        try {
            const res = await requestCreatePayment(data);
            if (paymentMethod === 'momo') {
                if (res.metadata?.payUrl) {
                    window.open(res.metadata.payUrl);
                } else {
                    message.success('Đã tạo liên kết thanh toán MoMo');
                    window.location.href = `/payment-success/${res.metadata.id}`;
                }
            } else {
                // VietQR / Direct / Cash / Bank Transfer
                message.success('Thanh toán thành công! Vé của bạn đã được xuất.');
                setIsVietQrModalVisible(false);
                setIsModalVisible(false);
                window.location.href = `/payment-success/${res.metadata.id}`;
            }
        } catch (error) {
            console.error(error);
            message.error(error.response?.data?.message || 'Có lỗi xảy ra khi tạo thanh toán');
        } finally {
            setIsSubmittingPayment(false);
        }
    };

    // Format a date display string based on movie dates
    const getShowtimeDateRange = () => {
        if (!movieDetails) return 'Đang cập nhật';

        const startDateStr =
            movieDetails.dateStart && moment(movieDetails.dateStart).isValid()
                ? moment(movieDetails.dateStart).format('DD/MM/YYYY')
                : 'Hôm nay';

        const endDateStr =
            movieDetails.dateEnd && moment(movieDetails.dateEnd).isValid()
                ? moment(movieDetails.dateEnd).format('DD/MM/YYYY')
                : 'Không giới hạn';

        return `${startDateStr} - ${endDateStr}`;
    };

    // Render seat by seat status and row tier
    const renderSeat = (seat) => {
        const status = getSeatStatus(seat.seat_code);
        const row = seat.row;
        const config = ROW_PRICE_CONFIG[row] || { name: 'Ghế Tiêu Chuẩn', extra: 0, tag: 'Ghế' };
        const seatPrice = getSeatPrice(ticketPrice, seat.seat_code);
        const priceLabel = Math.round(seatPrice / 1000) + 'k';

        let colorClass = '';
        if (status === 'selected') {
            colorClass = 'bg-red-600 text-white font-bold ring-2 ring-red-400 shadow-md shadow-red-600/50 cursor-pointer transform scale-[1.03]';
        } else if (status === 'booked') {
            colorClass = 'bg-[#1e1e24] border border-gray-800 text-gray-600 cursor-not-allowed opacity-40';
        } else {
            // available - phân loại màu theo hàng ghế
            if (row === 'A' || row === 'B') {
                colorClass = 'bg-[#2d2215] border border-amber-500/70 text-amber-200 hover:bg-[#45331e] hover:border-amber-400 cursor-pointer';
            } else if (row === 'C' || row === 'D') {
                colorClass = 'bg-[#221733] border border-purple-500/70 text-purple-200 hover:bg-[#34244f] hover:border-purple-400 cursor-pointer';
            } else if (row === 'E') {
                colorClass = 'bg-[#16233b] border border-blue-500/60 text-blue-200 hover:bg-[#203457] hover:border-blue-400 cursor-pointer';
            } else {
                colorClass = 'bg-[#132620] border border-emerald-500/60 text-emerald-200 hover:bg-[#1a382f] hover:border-emerald-400 cursor-pointer';
            }
        }

        return (
            <div
                key={seat.seat_code}
                className={`h-11 flex flex-col items-center justify-center rounded text-xs transition-all relative select-none ${colorClass}`}
                onClick={() => handleSeatClick(seat.seat_code)}
                title={`Ghế ${seat.seat_code}: ${seatPrice.toLocaleString('vi-VN')} đ (${config.name})`}
            >
                <span className="font-semibold leading-none">{seat.seat_code}</span>
                {status !== 'booked' && (
                    <span className="text-[10px] opacity-80 leading-none mt-1 font-mono">
                        {priceLabel}
                    </span>
                )}
            </div>
        );
    };


    return (
        <div className="bg-[#161616] min-h-screen text-white">
            <header>
                <Header />
            </header>

            <main className="container mx-auto py-20 px-4">
                <div className="flex flex-col md:flex-row gap-8 pt-16">
                    {/* Movie details - Left side */}
                    <div className="w-full md:w-1/3">
                        <div className="bg-[#222] p-6 rounded-lg shadow-lg">
                            <div className="mb-4">
                                <img
                                    src={`${movieDetails?.poster_url}`}
                                    alt={movieDetails?.name}
                                    referrerPolicy="no-referrer"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop';
                                    }}
                                    className="w-full h-auto rounded-md mb-4"
                                />
                            </div>

                            <h1 className="text-2xl font-bold mb-2">{movieDetails?.name}</h1>

                            <div className="text-gray-300 space-y-3">
                                <div className="flex items-center gap-2">
                                    <ClockCircleOutlined />
                                    <span>{movieDetails?.time} phút</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CalendarOutlined />
                                    <span>Lịch chiếu: {getShowtimeDateRange()}</span>
                                </div>
                            </div>

                            {selectedDate && selectedTime && selectedSeats.length > 0 && (
                                <>
                                    <Divider className="border-gray-700 my-4" />

                                    <div className="space-y-2 text-sm">
                                        <p className="text-gray-300">
                                            Ngày chiếu:{' '}
                                            <span className="text-white font-medium">
                                                {getViDayName(selectedDate)}, {selectedDate.format('DD/MM/YYYY')}
                                            </span>
                                        </p>
                                        <p className="text-gray-300">
                                            Giờ chiếu: <span className="text-white font-medium">{selectedTime}</span>
                                        </p>
                                        <div>
                                            <p className="text-gray-300 mb-1">
                                                Ghế đã chọn ({selectedSeats.length}):
                                            </p>
                                            <div className="space-y-1.5 pl-2 max-h-36 overflow-y-auto mb-2 border-l-2 border-red-500/60">
                                                {selectedSeats.map((code) => {
                                                    const row = code.charAt(0);
                                                    const config = ROW_PRICE_CONFIG[row] || {};
                                                    const price = getSeatPrice(ticketPrice, code);
                                                    return (
                                                        <div key={code} className="flex justify-between text-xs text-gray-300">
                                                            <span>
                                                                • Ghế <strong className="text-white">{code}</strong>{' '}
                                                                <span className="text-[11px] text-gray-400">({config.tag || 'Ghế'})</span>:
                                                            </span>
                                                            <span className="text-amber-400 font-mono font-medium">
                                                                {price.toLocaleString('vi-VN')} đ
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                        <div className="flex justify-between text-gray-300 pt-1 border-t border-gray-800">
                                            <span>Tổng tiền vé:</span>
                                            <span className="text-white font-semibold">{ticketTotal.toLocaleString('vi-VN')} đ</span>
                                        </div>


                                        {selectedServicesList.length > 0 && (
                                            <div className="pt-2 border-t border-gray-800">
                                                <p className="text-amber-400 font-medium mb-1">🍿 Bắp nước đi kèm:</p>
                                                <div className="space-y-1 pl-2">
                                                    {selectedServicesList.map((item) => (
                                                        <div key={item.id} className="flex justify-between text-xs text-gray-300">
                                                            <span>• {item.name} x{item.quantity}</span>
                                                            <span className="text-white font-medium">
                                                                {(item.price * item.quantity).toLocaleString('vi-VN')} đ
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="flex justify-between text-xs text-amber-300 pt-1 font-semibold">
                                                    <span>Tổng bắp nước:</span>
                                                    <span>+{snackTotal.toLocaleString('vi-VN')} đ</span>
                                                </div>
                                            </div>
                                        )}

                                        {appliedVoucher && (
                                            <div className="pt-2 border-t border-gray-800">
                                                <div className="flex justify-between text-sm text-green-400 font-semibold">
                                                    <span>🏷️ Giảm giá ({appliedVoucher.code}):</span>
                                                    <span>-{discountAmount.toLocaleString('vi-VN')} đ</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <Divider className="border-gray-700 my-4" />

                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="text-lg font-semibold">Tổng thanh toán:</p>
                                            {appliedVoucher && (
                                                <p className="text-xs text-gray-400 line-through">
                                                    {subtotal.toLocaleString('vi-VN')} đ
                                                </p>
                                            )}
                                        </div>
                                        <p className="text-xl font-bold text-red-500">{formattedPrice(totalAmount)}</p>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Booking form - Right side */}
                    <div className="w-full md:w-2/3">
                        <div className="bg-[#222] p-6 rounded-lg shadow-lg mb-6">
                            <h2 className="text-xl font-semibold mb-4">Chọn ngày xem phim</h2>

                            {availableDates.length > 0 && (
                                <div className="date-selector">
                                    <div className="grid grid-cols-3 sm:grid-cols-7 gap-3">
                                        {availableDates.slice(0, 7).map((date, index) => {
                                            const isToday = date.isSame(moment(), 'day');
                                            return (
                                                <div
                                                    key={index}
                                                    className={`
                                                        cursor-pointer rounded text-center px-1 py-3
                                                        border transition-all duration-200
                                                        ${
                                                            selectedDate && date.isSame(selectedDate, 'day')
                                                                ? 'bg-red-600 border-red-700 text-white'
                                                                : isToday
                                                                ? 'bg-[#333] border-yellow-500 text-yellow-400 hover:bg-[#444]'
                                                                : 'bg-[#333] border-transparent text-gray-300 hover:bg-[#444] hover:border-gray-600'
                                                        }
                                                    `}
                                                    onClick={() => handleDateChange(date)}
                                                >
                                                    <div className="text-sm font-medium mb-1">{getViDayName(date)}</div>
                                                    <div
                                                        className={`text-lg font-bold ${
                                                            isToday ? 'text-yellow-400' : ''
                                                        }`}
                                                    >
                                                        {date.format('DD')}
                                                    </div>
                                                    <div className="text-xs opacity-70">{date.format('MM/YYYY')}</div>
                                                    {isToday && (
                                                        <div className="mt-1">
                                                            <span className="bg-yellow-600 text-yellow-100 text-xs px-2 py-0.5 rounded-full">
                                                                Hôm nay
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {selectedDate && (
                            <div className="bg-[#222] p-6 rounded-lg shadow-lg mb-6">
                                <h2 className="text-xl font-semibold mb-4">
                                    Chọn suất chiếu
                                    {selectedDate.isSame(moment(), 'day') && (
                                        <span className="ml-2 text-sm text-yellow-500">
                                            (Giờ hiện tại: {moment().format('HH:mm')})
                                        </span>
                                    )}
                                </h2>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {availableTimeSlots.map((time) => {
                                        const isPast = isTimeSlotPast(time);
                                        return (
                                            <div
                                                key={time}
                                                className={`
                                                    py-2 px-4 border rounded-md text-center transition-colors
                                                    ${
                                                        selectedTime === time
                                                            ? 'bg-red-600 border-red-700 text-white'
                                                            : isPast
                                                            ? 'bg-gray-700 border-gray-800 text-gray-500 cursor-not-allowed'
                                                            : 'border-gray-700 hover:border-gray-500 text-gray-300 cursor-pointer'
                                                    }
                                                `}
                                                onClick={() => !isPast && handleTimeSelection(time)}
                                            >
                                                {time}
                                                {isPast && <div className="text-xs mt-1 text-gray-500">Đã qua</div>}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {selectedDate && selectedTime && (
                            <div className="bg-[#222] p-6 rounded-lg shadow-lg mb-6">
                                <h2 className="text-xl font-semibold mb-4">Chọn ghế ngồi</h2>

                                <div className="bg-[#333] p-4 mb-8 rounded-md text-center">
                                    <div className="w-2/3 h-2 bg-gray-600 mx-auto rounded-lg mb-8"></div>
                                    <p className="text-gray-400 text-sm">MÀN HÌNH</p>
                                </div>

                                {isLoadingSeats ? (
                                    <div className="flex justify-center py-8">
                                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-red-600"></div>
                                    </div>
                                ) : Object.keys(seatsByRow).length > 0 ? (
                                    <div className="mb-6">
                                        {/* Seat layout by rows with price tier info */}
                                        {Object.entries(seatsByRow).map(([row, rowSeats]) => {
                                            const config = ROW_PRICE_CONFIG[row] || { name: 'Tiêu chuẩn', extra: 0, tag: 'Ghế' };
                                            const samplePrice = getSeatPrice(ticketPrice, `${row}1`);
                                            const isTop = row === 'A' || row === 'B';
                                            const isMid = row === 'C' || row === 'D';
                                            const isEco = row === 'F' || row === 'G';

                                            const badgeColor = isTop
                                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                                : isMid
                                                ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                                                : isEco
                                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                                : 'bg-blue-500/20 text-blue-300 border-blue-500/40';

                                            return (
                                                <div key={row} className="mb-3">
                                                    <div className="flex items-center justify-between mb-1 text-xs">
                                                        <div className="flex items-center gap-2">
                                                            <div
                                                                className={`w-6 h-6 flex items-center justify-center font-bold text-white rounded shadow-sm text-xs ${
                                                                    isTop
                                                                        ? 'bg-amber-600'
                                                                        : isMid
                                                                        ? 'bg-purple-600'
                                                                        : isEco
                                                                        ? 'bg-emerald-600'
                                                                        : 'bg-blue-600'
                                                                }`}
                                                            >
                                                                {row}
                                                            </div>
                                                            <span className="text-gray-200 font-medium">
                                                                Hàng {row}
                                                            </span>
                                                            <span
                                                                className={`text-[11px] px-2 py-0.5 rounded-full border ${badgeColor} font-medium`}
                                                            >
                                                                {config.name}
                                                            </span>
                                                        </div>
                                                        <div className="text-gray-400 font-mono text-[12px]">
                                                            Giá:{' '}
                                                            <span className="text-amber-400 font-semibold">
                                                                {samplePrice.toLocaleString('vi-VN')} đ
                                                            </span>
                                                            {config.extra > 0 && (
                                                                <span className="text-amber-400/90 ml-1 text-[11px]">
                                                                    (+{config.extra.toLocaleString('vi-VN')} đ)
                                                                </span>
                                                            )}
                                                            {config.extra < 0 && (
                                                                <span className="text-emerald-400/90 ml-1 text-[11px]">
                                                                    ({config.extra.toLocaleString('vi-VN')} đ)
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-12 gap-2">
                                                        {rowSeats.map((seat) => renderSeat(seat))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-gray-400">
                                        Không có thông tin ghế ngồi cho suất chiếu này
                                    </div>
                                )}

                                {/* Bảng phân loại & chú thích giá từng hàng ghế */}
                                <div className="mt-6 pt-5 border-t border-gray-800">
                                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-3 text-center">
                                        Phân Loại Giá Theo Hàng Ghế (Ngồi đầu giá cao hơn ngồi sau)
                                    </p>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 text-xs">
                                        <div className="p-2.5 rounded-lg bg-[#2b2214] border border-amber-500/60 flex items-center gap-2">
                                            <div className="w-5 h-5 rounded bg-amber-500 flex items-center justify-center font-bold text-black text-[11px]">
                                                A-B
                                            </div>
                                            <div>
                                                <div className="font-semibold text-amber-300">VIP Hàng Đầu</div>
                                                <div className="text-[11px] text-gray-300 font-mono">
                                                    {getSeatPrice(ticketPrice, 'A1').toLocaleString('vi-VN')} đ
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-2.5 rounded-lg bg-[#241a35] border border-purple-500/60 flex items-center gap-2">
                                            <div className="w-5 h-5 rounded bg-purple-500 flex items-center justify-center font-bold text-white text-[11px]">
                                                C-D
                                            </div>
                                            <div>
                                                <div className="font-semibold text-purple-300">Ghế Trung Tâm</div>
                                                <div className="text-[11px] text-gray-300 font-mono">
                                                    {getSeatPrice(ticketPrice, 'C1').toLocaleString('vi-VN')} đ
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-2.5 rounded-lg bg-[#162238] border border-blue-500/60 flex items-center gap-2">
                                            <div className="w-5 h-5 rounded bg-blue-500 flex items-center justify-center font-bold text-white text-[11px]">
                                                E
                                            </div>
                                            <div>
                                                <div className="font-semibold text-blue-300">Tiêu Chuẩn</div>
                                                <div className="text-[11px] text-gray-300 font-mono">
                                                    {getSeatPrice(ticketPrice, 'E1').toLocaleString('vi-VN')} đ
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-2.5 rounded-lg bg-[#132822] border border-emerald-500/60 flex items-center gap-2">
                                            <div className="w-5 h-5 rounded bg-emerald-500 flex items-center justify-center font-bold text-white text-[11px]">
                                                F-G
                                            </div>
                                            <div>
                                                <div className="font-semibold text-emerald-300">Ghế Tiết Kiệm</div>
                                                <div className="text-[11px] text-gray-300 font-mono">
                                                    {getSeatPrice(ticketPrice, 'G1').toLocaleString('vi-VN')} đ
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Chú thích trạng thái ghế */}
                                    <div className="flex flex-wrap gap-5 justify-center text-xs text-gray-400">
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 bg-red-600 rounded"></div>
                                            <span className="text-white">Đang chọn</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 bg-[#1e1e24] border border-gray-700 rounded opacity-50"></div>
                                            <span>Đã bán / Đã đặt</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}


                        {selectedDate && selectedTime && selectedSeats.length > 0 && (
                            <>
                                {/* 1. DỊCH VỤ BẮP NƯỚC ĐI KÈM */}
                                <div className="bg-[#222] p-6 rounded-lg shadow-lg mb-6 border border-gray-800">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-gray-700">
                                        <div>
                                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                                <CoffeeOutlined className="text-amber-500" /> Bắp rang bơ & Nước ngọt đi kèm (Tùy chọn)
                                            </h2>
                                            <p className="text-gray-400 text-sm mt-1">
                                                Thưởng thức combo bắp nước giòn ngon chuẩn rạp. Nhận ngay tại quầy không chờ đợi!
                                            </p>
                                        </div>
                                        {selectedServicesList.length > 0 && (
                                            <Tag color="gold" className="text-sm py-1 px-3 mt-2 sm:mt-0 font-semibold self-start sm:self-center">
                                                Đã chọn: {selectedServicesList.reduce((s, i) => s + i.quantity, 0)} phần (+{snackTotal.toLocaleString('vi-VN')} đ)
                                            </Tag>
                                        )}
                                    </div>

                                    {/* Category filters */}
                                    <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
                                        {[
                                            { key: 'all', label: 'Tất cả' },
                                            { key: 'combo', label: '🍿 Combo Tiết Kiệm' },
                                            { key: 'food', label: '🍿 Bắp rang bơ' },
                                            { key: 'drink', label: '🥤 Nước uống' },
                                        ].map((tab) => (
                                            <button
                                                key={tab.key}
                                                type="button"
                                                onClick={() => setServiceFilter(tab.key)}
                                                className={`px-4 py-1.5 rounded-full text-sm font-medium transition cursor-pointer ${
                                                    serviceFilter === tab.key
                                                        ? 'bg-red-600 text-white'
                                                        : 'bg-[#333] text-gray-300 hover:bg-[#444]'
                                                }`}
                                            >
                                                {tab.label}
                                            </button>
                                        ))}
                                    </div>

                                    {isLoadingServices ? (
                                        <div className="py-8 text-center"><Spin /></div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {services
                                                .filter((s) => serviceFilter === 'all' || s.category === serviceFilter)
                                                .map((service) => {
                                                    const qty = selectedServices[service.id] || 0;
                                                    return (
                                                        <div
                                                            key={service.id}
                                                            className={`p-3 rounded-lg border transition flex flex-col justify-between ${
                                                                qty > 0
                                                                    ? 'bg-[#2a2421] border-amber-500/80 shadow-md'
                                                                    : 'bg-[#292929] border-gray-700/80 hover:border-gray-600'
                                                            }`}
                                                        >
                                                            <div className="flex gap-3">
                                                                <img
                                                                    src={service.image || 'https://images.unsplash.com/photo-1572177812156-58036aae439c?w=100'}
                                                                    alt={service.name}
                                                                    className="w-16 h-16 object-cover rounded-md flex-shrink-0"
                                                                    onError={(e) => {
                                                                        e.target.onerror = null;
                                                                        e.target.src = 'https://images.unsplash.com/photo-1572177812156-58036aae439c?w=100';
                                                                    }}
                                                                />
                                                                <div className="flex-1 min-w-0">
                                                                    <h4 className="font-semibold text-white text-sm truncate">{service.name}</h4>
                                                                    <p className="text-gray-400 text-xs line-clamp-2 mt-0.5">{service.description}</p>
                                                                    <p className="text-amber-400 font-bold text-sm mt-1">
                                                                        {(service.price || 0).toLocaleString('vi-VN')} đ
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            {/* Quantity selector */}
                                                            <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-700/50">
                                                                <span className="text-xs text-gray-400">
                                                                    {qty > 0 ? (
                                                                        <span className="text-amber-300 font-medium">
                                                                            Tổng: {(service.price * qty).toLocaleString('vi-VN')} đ
                                                                        </span>
                                                                    ) : (
                                                                        'Số lượng'
                                                                    )}
                                                                </span>
                                                                <div className="flex items-center gap-2">
                                                                    <button
                                                                        type="button"
                                                                        disabled={qty === 0}
                                                                        onClick={() => handleDecreaseService(service.id)}
                                                                        className={`w-7 h-7 rounded flex items-center justify-center font-bold cursor-pointer transition ${
                                                                            qty === 0
                                                                                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                                                                : 'bg-red-600/80 text-white hover:bg-red-600'
                                                                        }`}
                                                                    >
                                                                        -
                                                                    </button>
                                                                    <span className="w-6 text-center font-bold text-white text-sm">{qty}</span>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleIncreaseService(service.id)}
                                                                        className="w-7 h-7 rounded bg-green-600 text-white hover:bg-green-500 flex items-center justify-center font-bold cursor-pointer transition"
                                                                    >
                                                                        +
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                        </div>
                                    )}
                                </div>

                                {/* 2. MÃ GIẢM GIÁ & ƯU ĐÃI (Áp mã với điều kiện minOrderValue) */}
                                <div className="bg-[#222] p-6 rounded-lg shadow-lg mb-6 border border-gray-800">
                                    <div className="pb-3 mb-4 border-b border-gray-700">
                                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                            <TagOutlined className="text-red-500" /> Mã giảm giá & Ưu đãi
                                        </h2>
                                        <p className="text-gray-400 text-sm mt-1">
                                            Nhập mã hoặc chọn mã khuyến mãi bên dưới. Giảm giá khi đơn hàng đạt mức tối thiểu.
                                        </p>
                                    </div>

                                    {/* Voucher input form */}
                                    <div className="flex flex-col sm:flex-row gap-3 mb-4">
                                        <div className="flex-1">
                                            <Input
                                                size="large"
                                                placeholder="Nhập mã voucher (VD: GIAM10K, BAPNUOC20K, VIP50K...)"
                                                value={voucherCodeInput}
                                                onChange={(e) => {
                                                    setVoucherCodeInput(e.target.value.toUpperCase());
                                                    setVoucherError('');
                                                }}
                                                onPressEnter={() => handleApplyVoucher()}
                                                disabled={!!appliedVoucher}
                                                prefix={<TagOutlined className="text-gray-400 mr-1" />}
                                                style={{
                                                    height: '46px',
                                                    textTransform: 'uppercase',
                                                    fontWeight: 600,
                                                    backgroundColor: '#2a2a2a',
                                                    color: '#fff',
                                                    borderColor: '#444',
                                                }}
                                            />
                                        </div>
                                        {appliedVoucher ? (
                                            <Button
                                                size="large"
                                                danger
                                                onClick={handleRemoveVoucher}
                                                style={{ height: '46px', minWidth: '130px' }}
                                                icon={<CloseOutlined />}
                                            >
                                                Hủy áp dụng
                                            </Button>
                                        ) : (
                                            <Button
                                                type="primary"
                                                size="large"
                                                loading={isCheckingVoucher}
                                                onClick={() => handleApplyVoucher()}
                                                style={{
                                                    height: '46px',
                                                    minWidth: '130px',
                                                    backgroundColor: '#e50914',
                                                    borderColor: '#e50914',
                                                    fontWeight: 'bold',
                                                }}
                                                icon={<CheckOutlined />}
                                            >
                                                Áp Dụng
                                            </Button>
                                        )}
                                    </div>

                                    {/* Applied voucher banner */}
                                    {appliedVoucher && (
                                        <div className="p-4 rounded-lg bg-emerald-950/70 border border-emerald-500/60 flex items-start gap-3 mb-4">
                                            <CheckCircleFilled className="text-emerald-400 text-xl mt-0.5" />
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-emerald-300 text-base">
                                                        Đã áp dụng mã: {appliedVoucher.code}
                                                    </span>
                                                    <Tag color="success">
                                                        Giảm -{voucherDiscount.toLocaleString('vi-VN')} VNĐ
                                                    </Tag>
                                                </div>
                                                <p className="text-gray-300 text-xs mt-1">
                                                    {appliedVoucher.description || 'Ưu đãi dành riêng cho bạn'}
                                                    {appliedVoucher.minOrderValue > 0 &&
                                                        ` (Áp dụng cho đơn từ ${(appliedVoucher.minOrderValue || 0).toLocaleString('vi-VN')} đ)`}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Error banner (minOrderValue explanation) */}
                                    {voucherError && (
                                        <div className="p-4 rounded-lg bg-red-950/70 border border-red-500/60 flex items-start gap-3 mb-4">
                                            <ExclamationCircleFilled className="text-red-400 text-xl mt-0.5 flex-shrink-0" />
                                            <div className="flex-1 text-sm text-red-200">
                                                <p className="font-semibold text-red-300">Không thể áp dụng mã này:</p>
                                                <p className="mt-0.5">{voucherError}</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Available vouchers chips */}
                                    {vouchers.length > 0 && !appliedVoucher && (
                                        <div>
                                            <p className="text-xs text-gray-400 font-semibold mb-2 uppercase tracking-wide">
                                                🎁 Mã khuyến mãi khả dụng (Nhấp để chọn mã):
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {vouchers.map((v) => {
                                                    const meetsMin = subtotal >= (v.minOrderValue || 0);
                                                    return (
                                                        <div
                                                            key={v.id}
                                                            onClick={() => {
                                                                setVoucherCodeInput(v.code);
                                                                handleApplyVoucher(v.code);
                                                            }}
                                                            className={`p-2.5 rounded-lg border text-xs cursor-pointer transition flex items-center gap-2 ${
                                                                meetsMin
                                                                    ? 'bg-[#223326] border-green-600/70 hover:border-green-400 text-white'
                                                                    : 'bg-[#292929] border-gray-700/80 hover:border-amber-500/70 text-gray-300'
                                                            }`}
                                                        >
                                                            <span className="font-bold px-2 py-0.5 rounded bg-black/50 text-amber-400 font-mono">
                                                                {v.code}
                                                            </span>
                                                            <span>
                                                                {v.discountType === 'percent'
                                                                    ? `Giảm ${v.discountValue}%`
                                                                    : `Giảm ${(v.discountValue || 0).toLocaleString('vi-VN')}đ`}
                                                            </span>
                                                            <span
                                                                className={`px-1.5 py-0.5 rounded text-[11px] ${
                                                                    meetsMin
                                                                        ? 'bg-green-950 text-green-300 border border-green-700/50'
                                                                        : 'bg-gray-800 text-amber-400 border border-amber-600/40'
                                                                }`}
                                                            >
                                                                Đơn từ {(v.minOrderValue || 0).toLocaleString('vi-VN')}đ
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* 3. PHƯƠNG THỨC THANH TOÁN */}
                                <div className="bg-[#222] p-6 rounded-lg shadow-lg mb-6 border border-gray-800">
                                    <h2 className="text-xl font-semibold mb-4">Phương thức thanh toán</h2>

                                    <Radio.Group onChange={(e) => setPaymentMethod(e.target.value)} value={paymentMethod} className="w-full">
                                        <div className="space-y-3">
                                            {/* 1. VietQR Vietcombank Real Payment */}
                                            <div
                                                className={`
                                                    flex items-center p-3.5 rounded-xl cursor-pointer border-2 transition
                                                    ${paymentMethod === 'vietqr' ? 'border-[#008848] bg-[#008848]/15 shadow-md' : 'border-gray-700 bg-[#262626] hover:border-gray-600'}
                                                `}
                                                onClick={() => setPaymentMethod('vietqr')}
                                            >
                                                <Radio value="vietqr" className="radio-primary" />
                                                <div className="ml-3 flex items-center justify-between flex-grow">
                                                    <div className="flex items-center">
                                                        <div className="h-11 w-11 flex flex-col items-center justify-center mr-3 rounded-lg bg-[#008848] text-white font-bold text-xs shadow-md">
                                                            <span>VCB</span>
                                                            <span className="text-[9px] font-normal">QR</span>
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <p className="font-bold text-white text-base">Chuyển khoản VietQR (Vietcombank)</p>
                                                                <Tag color="green" className="font-semibold text-[11px] m-0">
                                                                    Thanh toán thật 100%
                                                                </Tag>
                                                            </div>
                                                            <p className="text-xs text-emerald-400 font-medium">
                                                                STK: <strong className="font-mono text-white">1336991507</strong> • Tự động điền số tiền & quét bằng mọi App Ngân hàng (VCB, MB, Techcombank, BIDV...) & Ví MoMo
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* 2. MoMo */}
                                            <div
                                                className={`
                                                    flex items-center p-3 rounded-xl cursor-pointer border transition
                                                    ${paymentMethod === 'momo' ? 'border-red-500 bg-[#291e23]' : 'border-gray-700 bg-[#262626] hover:border-gray-600'}
                                                `}
                                                onClick={() => setPaymentMethod('momo')}
                                            >
                                                <Radio value="momo" className="radio-primary" />
                                                <div className="ml-4 flex items-center">
                                                    <div className="h-10 w-10 flex items-center justify-center mr-3 rounded-lg bg-[#d82d8b]">
                                                        <img src={momoLogo} alt="MoMo" className="h-7 w-7 object-contain" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-white">Ví MoMo</p>
                                                        <p className="text-sm text-gray-400">Thanh toán tiện lợi qua ứng dụng MoMo</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* 3. Direct Counter Payment */}
                                            <div
                                                className={`
                                                    flex items-center p-3 rounded-xl cursor-pointer border transition
                                                    ${paymentMethod === 'direct' ? 'border-amber-500 bg-[#29261e]' : 'border-gray-700 bg-[#262626] hover:border-gray-600'}
                                                `}
                                                onClick={() => setPaymentMethod('direct')}
                                            >
                                                <Radio value="direct" className="radio-primary" />
                                                <div className="ml-4 flex items-center">
                                                    <div className="h-10 w-10 flex items-center justify-center mr-3 rounded-lg bg-emerald-600 text-white text-xl">
                                                        <CreditCardOutlined />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-white">Thanh toán trực tiếp tại rạp</p>
                                                        <p className="text-sm text-gray-400">Giữ chỗ và thanh toán tại quầy vé CGV trước giờ chiếu</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Radio.Group>

                                    <div className="mt-6">
                                        <Button
                                            type="primary"
                                            size="large"
                                            block
                                            onClick={handlePayment}
                                            className="h-12 bg-red-600 hover:bg-red-700 border-none font-bold text-base"
                                            disabled={!paymentMethod}
                                        >
                                            Thanh toán {formattedPrice(totalAmount)}
                                        </Button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </main>

            {/* Payment confirmation modal */}
            <Modal
                title={<span className="text-lg font-bold">🎬 Xác nhận đặt vé & thanh toán</span>}
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                footer={[
                    <Button key="back" onClick={() => setIsModalVisible(false)}>
                        Hủy
                    </Button>,
                    <Button key="submit" type="primary" className="bg-red-600 hover:bg-red-700" onClick={handlePaymentConfirm}>
                        Xác nhận đặt vé
                    </Button>,
                ]}
            >
                <div className="space-y-3 pt-3 text-sm">
                    <p>
                        <strong>Phim:</strong> <span className="text-red-600 font-semibold">{movieDetails?.name}</span>
                    </p>
                    <p>
                        <strong>Ngày & Giờ chiếu:</strong>{' '}
                        {selectedDate && `${selectedTime} - ${getViDayName(selectedDate)}, ${selectedDate.format('DD/MM/YYYY')}`}
                    </p>
                    <p>
                        <strong>Ghế đã chọn:</strong>{' '}
                        <span className="font-semibold text-red-600">{selectedSeats.join(', ')}</span> ({selectedSeats.length} vé)
                    </p>
                    <div className="flex justify-between text-gray-600">
                        <span>Tiền vé:</span>
                        <span className="font-semibold text-gray-800">{ticketTotal.toLocaleString('vi-VN')} VNĐ</span>
                    </div>

                    {selectedServicesList.length > 0 && (
                        <div className="p-2 bg-amber-50 rounded border border-amber-200">
                            <p className="font-semibold text-amber-800 text-xs mb-1">🍿 Bắp nước đi kèm:</p>
                            {selectedServicesList.map((item) => (
                                <div key={item.id} className="flex justify-between text-xs text-gray-700 pl-2">
                                    <span>• {item.name} x{item.quantity}</span>
                                    <span>{(item.price * item.quantity).toLocaleString('vi-VN')} VNĐ</span>
                                </div>
                            ))}
                            <div className="flex justify-between text-xs font-bold text-amber-900 pt-1 mt-1 border-t border-amber-200">
                                <span>Tổng bắp nước:</span>
                                <span>+{snackTotal.toLocaleString('vi-VN')} VNĐ</span>
                            </div>
                        </div>
                    )}

                    {appliedVoucher && (
                        <div className="flex justify-between text-emerald-700 font-semibold p-2 bg-emerald-50 rounded border border-emerald-200">
                            <span>🏷️ Mã giảm giá ({appliedVoucher.code}):</span>
                            <span>-{discountAmount.toLocaleString('vi-VN')} VNĐ</span>
                        </div>
                    )}

                    <p>
                        <strong>Phương thức thanh toán:</strong>{' '}
                        {paymentMethod === 'vietqr'
                            ? 'Chuyển khoản VietQR (Vietcombank)'
                            : paymentMethod === 'momo'
                            ? 'Ví MoMo'
                            : 'Thanh toán trực tiếp tại rạp'}
                    </p>

                    <Divider className="my-2" />
                    <div className="flex justify-between items-center text-base">
                        <span className="font-bold">Tổng thanh toán:</span>
                        <span className="font-bold text-xl text-red-600">{formattedPrice(totalAmount)}</span>
                    </div>
                </div>
            </Modal>

            {/* Modal Thanh Toán VietQR Chuyển Tiền Thật (Vietcombank STK: 1336991507) */}
            <Modal
                title={
                    <div className="flex items-center justify-between pr-6">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-[#008848] text-white flex items-center justify-center font-bold text-xs shadow">
                                VCB
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-gray-900 m-0">
                                    Thanh Toán Chuyển Khoản VietQR (Vietcombank)
                                </h3>
                                <p className="text-xs text-gray-500 m-0">Quét bằng mọi App Ngân hàng & Ví điện tử</p>
                            </div>
                        </div>
                        <Tag color="green" className="font-semibold text-xs">
                            Thanh toán thật 100%
                        </Tag>
                    </div>
                }
                open={isVietQrModalVisible}
                onCancel={() => setIsVietQrModalVisible(false)}
                footer={null}
                width={560}
                centered
                destroyOnClose
            >
                <div className="py-2 space-y-4">
                    {/* Countdown & Security Alert */}
                    <div className="flex items-center justify-between p-2.5 bg-emerald-50 rounded-lg border border-emerald-200 text-xs">
                        <div className="flex items-center gap-1.5 text-emerald-800">
                            <SafetyCertificateFilled className="text-emerald-600 text-sm" />
                            <span>Tài khoản chính thức CGV • Chuyển tiền 24/7 tức thì</span>
                        </div>
                        <div className="flex items-center gap-1 text-red-600 font-semibold">
                            <ClockCircleOutlined />
                            <span>Thời gian còn: {formatCountdown(qrCountdown)}</span>
                        </div>
                    </div>

                    {/* Dynamic VietQR Image Container */}
                    <div className="flex flex-col items-center justify-center p-3 bg-gradient-to-b from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                        <div className="relative group">
                            <img
                                src={`https://img.vietqr.io/image/vietcombank-1336991507-compact2.png?amount=${totalAmount}&addInfo=VEPHIM%20${vietQrCode}&accountName=LAI%20VAN%20TU`}
                                alt="Mã VietQR Vietcombank"
                                className="w-64 sm:w-72 h-auto rounded-xl shadow-lg border-2 border-emerald-500 bg-white p-1"
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-2 text-center">
                            Mở <strong>App Ngân hàng bất kỳ (VCB, MB, Techcombank, BIDV...)</strong> hoặc <strong>Ví MoMo</strong> chọn <strong>Quét QR</strong> để chuyển tiền
                        </p>
                    </div>

                    {/* Bank Transfer Details with 1-click Copy */}
                    <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-200 space-y-2 text-sm">
                        <div className="flex justify-between items-center py-1 border-b border-gray-200">
                            <span className="text-gray-500 text-xs">Ngân hàng thụ hưởng:</span>
                            <span className="font-bold text-gray-800 text-xs sm:text-sm">Vietcombank (Ngoại Thương Việt Nam)</span>
                        </div>

                        <div className="flex justify-between items-center py-1 border-b border-gray-200">
                            <span className="text-gray-500 text-xs">Số tài khoản (STK):</span>
                            <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-emerald-700 text-base">1336991507</span>
                                <Button
                                    size="small"
                                    icon={<CopyOutlined />}
                                    onClick={() => handleCopy('1336991507', 'Số tài khoản')}
                                    className="text-xs h-6 px-2"
                                >
                                    Sao chép
                                </Button>
                            </div>
                        </div>

                        <div className="flex justify-between items-center py-1 border-b border-gray-200">
                            <span className="text-gray-500 text-xs">Chủ tài khoản:</span>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-gray-800 text-xs sm:text-sm">LẠI VĂN TÚ</span>
                                <Button
                                    size="small"
                                    icon={<CopyOutlined />}
                                    onClick={() => handleCopy('LAI VAN TU', 'Tên chủ tài khoản')}
                                    className="text-xs h-6 px-2"
                                >
                                    Sao chép
                                </Button>
                            </div>
                        </div>

                        <div className="flex justify-between items-center py-1 border-b border-gray-200">
                            <span className="text-gray-500 text-xs">Số tiền thanh toán:</span>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-red-600 text-base">{totalAmount.toLocaleString('vi-VN')} đ</span>
                                <Button
                                    size="small"
                                    icon={<CopyOutlined />}
                                    onClick={() => handleCopy(totalAmount.toString(), 'Số tiền')}
                                    className="text-xs h-6 px-2"
                                >
                                    Sao chép
                                </Button>
                            </div>
                        </div>

                        <div className="flex justify-between items-center py-1">
                            <span className="text-gray-500 text-xs">Nội dung chuyển khoản:</span>
                            <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-blue-700 text-sm">VEPHIM {vietQrCode}</span>
                                <Button
                                    size="small"
                                    icon={<CopyOutlined />}
                                    onClick={() => handleCopy(`VEPHIM ${vietQrCode}`, 'Nội dung chuyển khoản')}
                                    className="text-xs h-6 px-2"
                                >
                                    Sao chép
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2 pt-1">
                        <Button
                            type="primary"
                            size="large"
                            block
                            icon={<CheckCircleFilled />}
                            loading={isSubmittingPayment}
                            onClick={handlePaymentConfirm}
                            className="h-12 bg-emerald-600 hover:bg-emerald-700 border-none font-bold text-base shadow-lg"
                        >
                            ✅ TÔI ĐÃ CHUYỂN TIỀN THÀNH CÔNG
                        </Button>

                        <div className="flex gap-2">
                            <Button
                                size="middle"
                                className="flex-1"
                                icon={<DownloadOutlined />}
                                onClick={() => {
                                    window.open(
                                        `https://img.vietqr.io/image/vietcombank-1336991507-compact2.png?amount=${totalAmount}&addInfo=VEPHIM%20${vietQrCode}&accountName=LAI%20VAN%20TU`,
                                        '_blank'
                                    );
                                }}
                            >
                                Mở ảnh QR gốc
                            </Button>
                            <Button
                                size="middle"
                                className="flex-1"
                                onClick={() => setIsVietQrModalVisible(false)}
                            >
                                Hủy / Chọn lại
                            </Button>
                        </div>
                    </div>
                </div>
            </Modal>

            <footer>
                <Footer />
            </footer>
        </div>
    );
}

export default BookMovie;
