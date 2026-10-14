import React, { useState, useEffect } from 'react';
import {
    Card,
    Select,
    DatePicker,
    Button,
    Row,
    Col,
    Tag,
    Input,
    Radio,
    message,
    Spin,
    Divider,
    Space,
    InputNumber,
} from 'antd';
import {
    ShoppingOutlined,
    CoffeeOutlined,
    UserOutlined,
    PhoneOutlined,
    CheckCircleOutlined,
    PrinterOutlined,
    DollarCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
    requestGetAllMovie,
    requestStaffGetSeats,
    requestGetActiveServices,
    requestStaffSellTicket,
} from '../../../../config/request';
import TicketModal from '../TicketModal/TicketModal';
import styles from './PosTicket.module.scss';

const DEFAULT_SHOWTIMES = ['09:00', '11:30', '14:15', '17:00', '19:30', '21:45', '23:15'];
const SEAT_ROWS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const SEATS_PER_ROW = 12;

const PosTicket = () => {
    const [movies, setMovies] = useState([]);
    const [services, setServices] = useState([]);
    const [selectedMovie, setSelectedMovie] = useState(null);
    const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
    const [selectedTime, setSelectedTime] = useState(DEFAULT_SHOWTIMES[2]);
    const [existingSeats, setExistingSeats] = useState([]);
    const [selectedSeatCodes, setSelectedSeatCodes] = useState([]);
    const [selectedServices, setSelectedServices] = useState({});
    const [customerName, setCustomerName] = useState('Khách tại quầy');
    const [customerPhone, setCustomerPhone] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [cashGiven, setCashGiven] = useState(0);

    const [loadingMovies, setLoadingMovies] = useState(false);
    const [loadingSeats, setLoadingSeats] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Printable ticket modal state
    const [createdTicket, setCreatedTicket] = useState(null);
    const [ticketModalVisible, setTicketModalVisible] = useState(false);

    // Fetch movies and services on mount
    useEffect(() => {
        fetchMovies();
        fetchServices();
    }, []);

    // Fetch seats whenever movie, date, or time changes
    useEffect(() => {
        if (selectedMovie) {
            fetchSeats();
        }
    }, [selectedMovie, selectedDate, selectedTime]);

    const fetchMovies = async () => {
        setLoadingMovies(true);
        try {
            const res = await requestGetAllMovie();
            const list = res?.metadata || res || [];
            setMovies(list);
            if (list.length > 0) {
                setSelectedMovie(list[0]);
            }
        } catch (error) {
            message.error('Lỗi khi tải danh sách phim');
        } finally {
            setLoadingMovies(false);
        }
    };

    const fetchServices = async () => {
        try {
            const res = await requestGetActiveServices();
            setServices(res?.metadata || []);
        } catch (error) {
            console.log('Services load notice:', error);
        }
    };

    const fetchSeats = async () => {
        if (!selectedMovie) return;
        setLoadingSeats(true);
        setSelectedSeatCodes([]);
        try {
            const res = await requestStaffGetSeats({
                movieId: selectedMovie.id,
                date: selectedDate,
                time: selectedTime,
            });
            setExistingSeats(res?.metadata || []);
        } catch (error) {
            console.log('Error fetching seats', error);
        } finally {
            setLoadingSeats(false);
        }
    };

    // Toggle seat selection
    const handleSeatClick = (seatCode, status) => {
        if (status === 'booked') {
            message.warning(`Ghế ${seatCode} đã có người đặt`);
            return;
        }
        if (status === 'maintenance' || status === 'broken') {
            message.error(`Ghế ${seatCode} đang trong tình trạng BẢO TRÌ/HỎNG, không thể bán!`);
            return;
        }

        if (selectedSeatCodes.includes(seatCode)) {
            setSelectedSeatCodes(selectedSeatCodes.filter((c) => c !== seatCode));
        } else {
            setSelectedSeatCodes([...selectedSeatCodes, seatCode]);
        }
    };

    // Handle snack quantity changes
    const handleServiceChange = (service, delta) => {
        const currentQty = selectedServices[service.id]?.quantity || 0;
        const newQty = Math.max(0, currentQty + delta);

        if (newQty === 0) {
            const next = { ...selectedServices };
            delete next[service.id];
            setSelectedServices(next);
        } else {
            setSelectedServices({
                ...selectedServices,
                [service.id]: {
                    id: service.id,
                    name: service.name,
                    price: service.price,
                    quantity: newQty,
                },
            });
        }
    };

    // Calculations
    const ticketPrice = parseInt(selectedMovie?.price || 95000, 10);
    const totalTicketPrice = ticketPrice * selectedSeatCodes.length;

    const totalServicePrice = Object.values(selectedServices).reduce(
        (sum, item) => sum + parseInt(item.price || 0, 10) * item.quantity,
        0
    );

    const totalAmount = totalTicketPrice + totalServicePrice;
    const changeToReturn = Math.max(0, cashGiven - totalAmount);

    // Submit sale
    const handleSellTicket = async () => {
        if (!selectedMovie) {
            message.warning('Vui lòng chọn phim');
            return;
        }
        if (selectedSeatCodes.length === 0) {
            message.warning('Vui lòng chọn ít nhất 1 ghế xem phim');
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                movieId: selectedMovie.id,
                date: selectedDate,
                time: selectedTime,
                seatCodes: selectedSeatCodes,
                services: Object.values(selectedServices),
                paymentMethod,
                customerName: customerName.trim() || 'Khách tại quầy',
                customerPhone: customerPhone.trim(),
            };

            const res = await requestStaffSellTicket(payload);
            message.success('Bán vé tại quầy thành công!');

            // Open printable ticket modal
            const ticketInfo = {
                id: res?.metadata?.payment?.id,
                ticketCode: res?.metadata?.payment?.id?.substring(0, 8).toUpperCase(),
                movie: selectedMovie,
                seats: selectedSeatCodes,
                room: 'Phòng chiếu 1 (StreamPhim Cinema)',
                date: dayjs(selectedDate).format('DD/MM/YYYY'),
                time: selectedTime,
                totalPrice: totalAmount,
                paymentMethod,
                isCheckIn: false,
                customerName: customerName || 'Khách tại quầy',
                customerPhone: customerPhone || '',
                services: Object.values(selectedServices),
            };

            setCreatedTicket(ticketInfo);
            setTicketModalVisible(true);

            // Refresh seats map
            fetchSeats();
            setSelectedSeatCodes([]);
            setSelectedServices({});
            setCashGiven(0);
        } catch (error) {
            message.error(error.response?.data?.message || 'Lỗi khi bán vé tại quầy');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className={styles.container}>
            <Row gutter={[20, 20]}>
                {/* Left Section: Movie, Showtime & Seat Grid */}
                <Col xs={24} lg={16}>
                    <Card className={styles.posCard}>
                        {/* Movie & Showtime Filters */}
                        <div className={styles.filtersBar}>
                            <Row gutter={[12, 12]}>
                                <Col xs={24} md={12}>
                                    <label className={styles.filterLabel}>1. Chọn phim đang chiếu:</label>
                                    <Select
                                        size="large"
                                        style={{ width: '100%' }}
                                        value={selectedMovie?.id}
                                        loading={loadingMovies}
                                        onChange={(val) => {
                                            const found = movies.find((m) => m.id === val);
                                            setSelectedMovie(found);
                                        }}
                                        options={movies.map((m) => ({
                                            value: m.id,
                                            label: `${m.name} - ${Number(m.price || 0).toLocaleString()}đ (${m.quality || '2D'})`,
                                        }))}
                                    />
                                </Col>
                                <Col xs={12} md={6}>
                                    <label className={styles.filterLabel}>2. Ngày chiếu:</label>
                                    <DatePicker
                                        size="large"
                                        style={{ width: '100%' }}
                                        value={dayjs(selectedDate)}
                                        format="DD/MM/YYYY"
                                        onChange={(d) => setSelectedDate(d ? d.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'))}
                                    />
                                </Col>
                                <Col xs={12} md={6}>
                                    <label className={styles.filterLabel}>3. Suất chiếu:</label>
                                    <Select
                                        size="large"
                                        style={{ width: '100%' }}
                                        value={selectedTime}
                                        onChange={(val) => setSelectedTime(val)}
                                        options={DEFAULT_SHOWTIMES.map((t) => ({ value: t, label: t }))}
                                    />
                                </Col>
                            </Row>
                        </div>

                        {/* Interactive Seat Map */}
                        <div className={styles.seatSection}>
                            <div className={styles.screenBar}>
                                <div className={styles.screenCurve}>MÀN HÌNH CHIẾU / SCREEN</div>
                            </div>

                            {loadingSeats ? (
                                <div className={styles.seatLoading}>
                                    <Spin tip="Đang tải sơ đồ ghế..." />
                                </div>
                            ) : (
                                <div className={styles.seatGrid}>
                                    {SEAT_ROWS.map((row) => (
                                        <div key={row} className={styles.seatRow}>
                                            <span className={styles.rowLabel}>{row}</span>
                                            <div className={styles.seatCells}>
                                                {Array.from({ length: SEATS_PER_ROW }).map((_, i) => {
                                                    const seatNum = i + 1;
                                                    const seatCode = `${row}${seatNum}`;
                                                    const existing = existingSeats.find((s) => s.seat_code === seatCode);
                                                    const status = existing ? existing.status : 'available';
                                                    const isSelected = selectedSeatCodes.includes(seatCode);

                                                    let seatClass = styles.available;
                                                    if (status === 'booked') seatClass = styles.booked;
                                                    else if (status === 'maintenance' || status === 'broken') seatClass = styles.maintenance;
                                                    else if (isSelected) seatClass = styles.selected;

                                                    return (
                                                        <button
                                                            key={seatCode}
                                                            type="button"
                                                            className={`${styles.seatBtn} ${seatClass}`}
                                                            onClick={() => handleSeatClick(seatCode, status)}
                                                            title={`Ghế ${seatCode}: ${status === 'booked' ? 'Đã đặt' : status === 'maintenance' ? 'Đang bảo trì' : 'Còn trống'}`}
                                                        >
                                                            {seatNum}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            <span className={styles.rowLabel}>{row}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Seat Legends */}
                            <div className={styles.legendRow}>
                                <div className={styles.legendItem}>
                                    <span className={`${styles.legendBox} ${styles.availBox}`}></span>
                                    <span>Ghế trống</span>
                                </div>
                                <div className={styles.legendItem}>
                                    <span className={`${styles.legendBox} ${styles.selectedBox}`}></span>
                                    <span>Đang chọn ({selectedSeatCodes.length})</span>
                                </div>
                                <div className={styles.legendItem}>
                                    <span className={`${styles.legendBox} ${styles.bookedBox}`}></span>
                                    <span>Đã bán</span>
                                </div>
                                <div className={styles.legendItem}>
                                    <span className={`${styles.legendBox} ${styles.maintBox}`}></span>
                                    <span>Bảo trì/Hỏng</span>
                                </div>
                            </div>
                        </div>

                        {/* Snacks & Drinks Section */}
                        <div className={styles.servicesSection}>
                            <h3 className={styles.sectionTitle}>
                                <CoffeeOutlined /> Thêm Dịch Vụ Bắp Nước:
                            </h3>
                            <div className={styles.servicesGrid}>
                                {services.map((svc) => {
                                    const qty = selectedServices[svc.id]?.quantity || 0;
                                    return (
                                        <div key={svc.id} className={styles.serviceCard}>
                                            <div className={styles.svcInfo}>
                                                <div className={styles.svcName}>{svc.name}</div>
                                                <div className={styles.svcPrice}>
                                                    {Number(svc.price || 0).toLocaleString()}đ
                                                </div>
                                            </div>
                                            <div className={styles.svcQtyControl}>
                                                <button
                                                    type="button"
                                                    disabled={qty <= 0}
                                                    onClick={() => handleServiceChange(svc, -1)}
                                                >
                                                    -
                                                </button>
                                                <span className={styles.qtyNumber}>{qty}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleServiceChange(svc, 1)}
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </Card>
                </Col>

                {/* Right Section: Order Summary & Checkout */}
                <Col xs={24} lg={8}>
                    <Card className={styles.checkoutCard}>
                        <h3 className={styles.checkoutTitle}>🧾 Hóa Đơn Bán Vé Tại Quầy</h3>

                        {/* Movie preview */}
                        {selectedMovie && (
                            <div className={styles.orderMovieSummary}>
                                <h4 className={styles.omTitle}>{selectedMovie.name}</h4>
                                <div className={styles.omMeta}>
                                    📅 {dayjs(selectedDate).format('DD/MM/YYYY')} • ⏰ {selectedTime}
                                </div>
                            </div>
                        )}

                        <Divider style={{ margin: '14px 0', borderColor: 'rgba(255,255,255,0.1)' }} />

                        {/* Selected Seats */}
                        <div className={styles.lineItem}>
                            <span className={styles.lineLabel}>Ghế đã chọn ({selectedSeatCodes.length}):</span>
                            <span className={styles.lineSeats}>
                                {selectedSeatCodes.length > 0 ? selectedSeatCodes.join(', ') : 'Chưa chọn ghế'}
                            </span>
                        </div>
                        <div className={styles.lineItem}>
                            <span className={styles.lineLabel}>Tiền vé:</span>
                            <span className={styles.lineValue}>{totalTicketPrice.toLocaleString()}đ</span>
                        </div>

                        {/* Selected Snacks */}
                        {Object.values(selectedServices).length > 0 && (
                            <div className={styles.snackSummaryList}>
                                <div className={styles.snackSubheader}>Bắp nước đã chọn:</div>
                                {Object.values(selectedServices).map((item) => (
                                    <div key={item.id} className={styles.snackSubitem}>
                                        <span>{item.name} x {item.quantity}</span>
                                        <span>{(parseInt(item.price, 10) * item.quantity).toLocaleString()}đ</span>
                                    </div>
                                ))}
                                <div className={styles.lineItem} style={{ marginTop: 6 }}>
                                    <span className={styles.lineLabel}>Tiền bắp nước:</span>
                                    <span className={styles.lineValue}>{totalServicePrice.toLocaleString()}đ</span>
                                </div>
                            </div>
                        )}

                        <Divider style={{ margin: '14px 0', borderColor: 'rgba(255,255,255,0.1)' }} />

                        {/* Total Due */}
                        <div className={styles.totalRow}>
                            <span className={styles.totalLabel}>TỔNG THANH TOÁN:</span>
                            <span className={styles.totalAmount}>{totalAmount.toLocaleString()} VNĐ</span>
                        </div>

                        {/* Customer Info Form */}
                        <div className={styles.customerForm}>
                            <div className={styles.formGroup}>
                                <label>Tên khách hàng:</label>
                                <Input
                                    prefix={<UserOutlined />}
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    placeholder="Khách tại quầy"
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Số điện thoại (tùy chọn):</label>
                                <Input
                                    prefix={<PhoneOutlined />}
                                    value={customerPhone}
                                    onChange={(e) => setCustomerPhone(e.target.value)}
                                    placeholder="09xxxxxxxx"
                                />
                            </div>

                            {/* Payment Method Selector */}
                            <div className={styles.formGroup}>
                                <label>Phương thức thanh toán:</label>
                                <Radio.Group
                                    value={paymentMethod}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                    className={styles.paymentRadioGroup}
                                >
                                    <Radio.Button value="cash">💵 Tiền mặt</Radio.Button>
                                    <Radio.Button value="banking">💳 Chuyển khoản QR</Radio.Button>
                                    <Radio.Button value="momo">📲 MoMo</Radio.Button>
                                </Radio.Group>
                            </div>

                            {/* Cash Calculator if Cash selected */}
                            {paymentMethod === 'cash' && (
                                <div className={styles.cashCalc}>
                                    <div className={styles.calcRow}>
                                        <span>Tiền khách đưa:</span>
                                        <InputNumber
                                            style={{ width: 140 }}
                                            value={cashGiven}
                                            onChange={(val) => setCashGiven(val || 0)}
                                            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                            parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                                            placeholder="0"
                                        />
                                    </div>
                                    <div className={styles.calcRow}>
                                        <span>Tiền thừa trả khách:</span>
                                        <strong className={styles.changeAmount}>
                                            {changeToReturn.toLocaleString()}đ
                                        </strong>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Submit Button */}
                        <Button
                            type="primary"
                            size="large"
                            block
                            icon={<PrinterOutlined />}
                            disabled={selectedSeatCodes.length === 0}
                            loading={submitting}
                            onClick={handleSellTicket}
                            className={styles.btnCheckout}
                        >
                            🎟️ XUẤT VÉ & IN VÉ NGAY
                        </Button>
                    </Card>
                </Col>
            </Row>

            {/* Printable Ticket Receipt Modal */}
            <TicketModal
                visible={ticketModalVisible}
                onClose={() => setTicketModalVisible(false)}
                ticketData={createdTicket}
            />
        </div>
    );
};

export default PosTicket;
