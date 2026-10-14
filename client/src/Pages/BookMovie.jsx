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

function BookMovie() {
    const [selectedDate, setSelectedDate] = useState(moment()); // Default to today's date
    const [selectedTime, setSelectedTime] = useState(null);
    const [selectedSeats, setSelectedSeats] = useState([]);
    const [paymentMethod, setPaymentMethod] = useState(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
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

        setIsModalVisible(true);
    };

    // Price calculations
    const ticketPrice = movieDetails?.price ? parseInt(movieDetails.price, 10) : 0;
    const ticketTotal = selectedSeats.length * ticketPrice;

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
                }
            } else if (paymentMethod === 'vnpay') {
                if (typeof res.metadata === 'string') {
                    window.open(res.metadata);
                } else {
                    message.success('Đã chuyển tiếp VNPay');
                }
            } else {
                // Direct / Cash / Test
                message.success('Đặt vé thành công!');
                window.location.href = `/payment-success/${res.metadata.id}`;
            }
            setIsModalVisible(false);
        } catch (error) {
            console.error(error);
            message.error(error.response?.data?.message || 'Có lỗi xảy ra khi tạo thanh toán');
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

    // Render seat by seat status
    const renderSeat = (seat) => {
        const status = getSeatStatus(seat.seat_code);
        let colorClass = '';

        switch (status) {
            case 'available':
                colorClass = 'bg-[#444] text-white hover:bg-[#555] cursor-pointer';
                break;
            case 'selected':
                colorClass = 'bg-red-600 text-white cursor-pointer';
                break;
            case 'booked':
                colorClass = 'bg-gray-700 text-gray-500 cursor-not-allowed';
                break;
            default:
                colorClass = 'bg-gray-700 text-gray-500 cursor-not-allowed';
        }

        return (
            <div
                key={seat.seat_code}
                className={`h-10 flex items-center justify-center rounded text-sm ${colorClass}`}
                onClick={() => handleSeatClick(seat.seat_code)}
            >
                {seat.seat_code}
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
                                        <p className="text-gray-300">
                                            Ghế đã chọn: <span className="text-red-400 font-semibold">{selectedSeats.join(', ')}</span>
                                        </p>
                                        <div className="flex justify-between text-gray-300">
                                            <span>Tiền vé ({selectedSeats.length} vé):</span>
                                            <span className="text-white font-medium">{ticketTotal.toLocaleString('vi-VN')} đ</span>
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
                                    <div className="mb-8">
                                        {/* Seat layout by rows */}
                                        {Object.entries(seatsByRow).map(([row, rowSeats]) => (
                                            <div key={row} className="mb-2">
                                                <div className="flex items-center mb-1">
                                                    <div className="w-6 h-6 flex items-center justify-center bg-gray-700 text-white rounded mr-2">
                                                        {row}
                                                    </div>
                                                    <div className="h-px flex-1 bg-gray-700"></div>
                                                </div>
                                                <div className="grid grid-cols-12 gap-2">
                                                    {rowSeats.map((seat) => renderSeat(seat))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-gray-400">
                                        Không có thông tin ghế ngồi cho suất chiếu này
                                    </div>
                                )}

                                <div className="flex flex-wrap gap-6 justify-center mb-6">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 bg-[#444] rounded"></div>
                                        <span className="text-sm">Ghế trống</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 bg-red-600 rounded"></div>
                                        <span className="text-sm">Ghế đã chọn</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 bg-gray-700 rounded"></div>
                                        <span className="text-sm">Ghế đã bán</span>
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
                                            <div
                                                className={`
                                                    flex items-center p-3 rounded-lg cursor-pointer border transition
                                                    ${paymentMethod === 'momo' ? 'border-red-500 bg-[#291e23]' : 'border-gray-700 bg-[#262626] hover:border-gray-600'}
                                                `}
                                                onClick={() => setPaymentMethod('momo')}
                                            >
                                                <Radio value="momo" className="radio-primary" />
                                                <div className="ml-4 flex items-center">
                                                    <div className="h-10 w-10 flex items-center justify-center mr-3 rounded bg-[#d82d8b]">
                                                        <img src={momoLogo} alt="MoMo" className="h-7 w-7 object-contain" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-white">Ví MoMo</p>
                                                        <p className="text-sm text-gray-400">Thanh toán tiện lợi qua ứng dụng MoMo</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div
                                                className={`
                                                    flex items-center p-3 rounded-lg cursor-pointer border transition
                                                    ${paymentMethod === 'vnpay' ? 'border-red-500 bg-[#1e2329]' : 'border-gray-700 bg-[#262626] hover:border-gray-600'}
                                                `}
                                                onClick={() => setPaymentMethod('vnpay')}
                                            >
                                                <Radio value="vnpay" className="radio-primary" />
                                                <div className="ml-4 flex items-center">
                                                    <div className="h-10 w-10 flex items-center justify-center mr-3 rounded bg-white">
                                                        <img src={vnpayLogo} alt="VNPay" className="h-7 w-7 object-contain" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-white">VNPay QR / Thẻ ngân hàng</p>
                                                        <p className="text-sm text-gray-400">Thanh toán qua quét mã VNPay hoặc thẻ ATM/Visa</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div
                                                className={`
                                                    flex items-center p-3 rounded-lg cursor-pointer border transition
                                                    ${paymentMethod === 'direct' ? 'border-red-500 bg-[#29261e]' : 'border-gray-700 bg-[#262626] hover:border-gray-600'}
                                                `}
                                                onClick={() => setPaymentMethod('direct')}
                                            >
                                                <Radio value="direct" className="radio-primary" />
                                                <div className="ml-4 flex items-center">
                                                    <div className="h-10 w-10 flex items-center justify-center mr-3 rounded bg-emerald-600 text-white text-xl">
                                                        <CreditCardOutlined />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-white">Thanh toán trực tiếp / Test đặt vé nhanh</p>
                                                        <p className="text-sm text-gray-400">Xác nhận vé thành công ngay lập tức để nhận vé tại rạp</p>
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
                        {paymentMethod === 'momo'
                            ? 'Ví MoMo'
                            : paymentMethod === 'vnpay'
                            ? 'VNPay QR'
                            : 'Thanh toán trực tiếp'}
                    </p>

                    <Divider className="my-2" />
                    <div className="flex justify-between items-center text-base">
                        <span className="font-bold">Tổng thanh toán:</span>
                        <span className="font-bold text-xl text-red-600">{formattedPrice(totalAmount)}</span>
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
