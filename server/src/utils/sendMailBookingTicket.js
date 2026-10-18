const { google } = require('googleapis');
const nodemailer = require('nodemailer');
require('dotenv').config();

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;

let oAuth2Client = null;
if (CLIENT_ID && CLIENT_SECRET && REFRESH_TOKEN) {
    try {
        oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
        oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });
    } catch (e) {
        console.error('Failed to initialize Google OAuth2 Client:', e.message);
    }
}

/**
 * Gửi email xác nhận đặt vé thành công kèm mã QR & thông tin chi tiết
 */
const sendMailBookingTicket = async ({
    email,
    customerName,
    movieName,
    moviePoster,
    branchName,
    date,
    time,
    seats,
    services,
    totalPrice,
    ticketId,
}) => {
    if (!email) {
        console.warn('[Mail Ticket] Không có email người nhận, bỏ qua gửi mail.');
        return false;
    }

    try {
        let transport = null;

        if (oAuth2Client) {
            try {
                const accessToken = await oAuth2Client.getAccessToken();
                transport = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        type: 'OAuth2',
                        user: process.env.USER_EMAIL,
                        clientId: CLIENT_ID,
                        clientSecret: CLIENT_SECRET,
                        refreshToken: REFRESH_TOKEN,
                        accessToken: accessToken ? accessToken.token || accessToken : '',
                    },
                });
            } catch (authErr) {
                console.warn('[Mail Ticket] OAuth2 failed, trying direct transport:', authErr.message);
            }
        }

        // Fallback to standard transport if OAuth2 wasn't initialized or failed
        if (!transport) {
            transport = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.USER_EMAIL,
                    pass: process.env.GMAIL_APP_PASSWORD || process.env.USER_PASSWORD || '',
                },
            });
        }

        const ticketCode = (ticketId || 'TICKET').substring(0, 8).toUpperCase();
        const formattedPrice = Number(totalPrice || 0).toLocaleString('vi-VN');
        const seatListStr = Array.isArray(seats) ? seats.join(', ') : (seats || 'Đang cập nhật');

        let servicesHtml = '';
        if (Array.isArray(services) && services.length > 0) {
            servicesHtml = `
                <div style="margin-top: 15px; padding: 12px; background: #262626; border-radius: 8px; border: 1px dashed #444;">
                    <p style="margin: 0 0 6px 0; color: #fbbf24; font-weight: bold; font-size: 13px;">🍿 Combo Bắp Nước Kèm Theo:</p>
                    <ul style="margin: 0; padding-left: 20px; color: #ddd; font-size: 13px;">
                        ${services.map((s) => `<li>${s.name} x${s.quantity || 1} (${Number((s.price || 0) * (s.quantity || 1)).toLocaleString('vi-VN')} đ)</li>`).join('')}
                    </ul>
                </div>
            `;
        }

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Vé Xem Phim - StreamPhim</title>
            </head>
            <body style="margin: 0; padding: 0; background-color: #0d0d0d; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #ffffff;">
                <div style="max-width: 600px; margin: 30px auto; background-color: #1a1a1a; border-radius: 16px; overflow: hidden; border: 1px solid #333; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
                    
                    <!-- Header Banner -->
                    <div style="background: linear-gradient(135deg, #e50914 0%, #b81d24 100%); padding: 30px 20px; text-align: center;">
                        <h1 style="margin: 0; font-size: 26px; color: #ffffff; letter-spacing: 1px; font-weight: 800;">
                            🎉 ĐẶT VÉ THÀNH CÔNG!
                        </h1>
                        <p style="margin: 8px 0 0 0; color: #ffe6e6; font-size: 14px;">
                            Cảm ơn bạn đã lựa chọn rạp chiếu phim StreamPhim
                        </p>
                    </div>

                    <!-- Ticket Main Body -->
                    <div style="padding: 25px 30px;">
                        <p style="font-size: 16px; color: #cccccc; margin-top: 0;">
                            Xin chào <strong style="color: #ffffff;">${customerName || 'Quý khách'}</strong>,
                        </p>
                        <p style="font-size: 14px; color: #aaaaaa; line-height: 1.6;">
                            Giao dịch đặt vé xem phim của bạn đã được xác nhận thành công. Dưới đây là thông tin chi tiết vé điện tử của bạn:
                        </p>

                        <!-- Ticket Card -->
                        <div style="background-color: #222222; border-radius: 12px; border: 1px solid #3d3d3d; padding: 20px; margin: 20px 0;">
                            <div style="border-bottom: 2px dashed #444; padding-bottom: 15px; margin-bottom: 15px;">
                                <span style="font-size: 11px; text-transform: uppercase; color: #e50914; font-weight: bold; letter-spacing: 1px;">BỘ PHIM</span>
                                <h2 style="margin: 5px 0 0 0; font-size: 22px; color: #ffffff; font-weight: 700;">
                                    ${movieName || 'Phim Chiếu Rạp'}
                                </h2>
                            </div>

                            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                                <tr>
                                    <td style="padding: 8px 0; color: #888888; width: 40%;">📍 Rạp chiếu:</td>
                                    <td style="padding: 8px 0; color: #facc15; font-weight: bold;">${branchName || 'CGV Cinema'}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #888888;">📅 Ngày chiếu:</td>
                                    <td style="padding: 8px 0; color: #ffffff; font-weight: 600;">${date || 'Hôm nay'}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #888888;">⏰ Suất chiếu:</td>
                                    <td style="padding: 8px 0; color: #ffffff; font-weight: 600;">${time || 'Chưa cập nhật'}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #888888;">💺 Ghế đã chọn:</td>
                                    <td style="padding: 8px 0; color: #ef4444; font-size: 16px; font-weight: 800;">${seatListStr}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #888888;">💵 Tổng thanh toán:</td>
                                    <td style="padding: 8px 0; color: #10b981; font-size: 18px; font-weight: 800;">${formattedPrice} VNĐ</td>
                                </tr>
                            </table>

                            ${servicesHtml}

                            <!-- Ticket Code Box -->
                            <div style="margin-top: 20px; padding: 15px; background: #161616; border-radius: 8px; text-align: center; border: 1px solid #444;">
                                <div style="font-size: 12px; color: #999; text-transform: uppercase; letter-spacing: 1px;">MÃ VÉ ĐIỆN TỬ</div>
                                <div style="font-size: 24px; font-weight: 900; color: #ffffff; letter-spacing: 4px; margin-top: 5px; font-family: monospace;">
                                    ${ticketCode}
                                </div>
                                <div style="font-size: 11px; color: #777; margin-top: 6px;">
                                    (Vui lòng cung cấp mã vé này cho nhân viên soát vé tại rạp)
                                </div>
                            </div>
                        </div>

                        <!-- Instructions -->
                        <div style="background-color: #172554; border-left: 4px solid #3b82f6; padding: 12px 16px; border-radius: 4px; font-size: 13px; color: #93c5fd; line-height: 1.5; margin: 20px 0;">
                            📌 <strong>Lưu ý:</strong> Vui lòng có mặt tại rạp trước giờ chiếu ít nhất 15 phút để làm thủ tục vào phòng chiếu.
                        </div>

                        <p style="font-size: 13px; color: #777777; text-align: center; margin-top: 25px;">
                            Nếu có bất kỳ thắc mắc nào, vui lòng liên hệ hotline hỗ trợ hoặc phản hồi trực tiếp qua email này.<br>
                            Chúc bạn có một buổi xem phim vui vẻ và trọn vẹn! 🍿🥤
                        </p>
                    </div>

                    <!-- Footer -->
                    <div style="background-color: #111111; padding: 15px 20px; text-align: center; border-top: 1px solid #282828;">
                        <p style="margin: 0; font-size: 12px; color: #555555;">
                            © 2026 StreamPhim Entertainment. All rights reserved.
                        </p>
                    </div>
                </div>
            </body>
            </html>
        `;

        await transport.sendMail({
            from: `"StreamPhim Cinema" <${process.env.USER_EMAIL || 'noreply@streamphim.com'}>`,
            to: email,
            subject: `🎬 Chúc mừng bạn đã đặt vé thành công: "${movieName || 'Phim Rạp'}" [Mã vé: ${ticketCode}]`,
            html: htmlContent,
        });

        console.log(`[Mail Ticket] Đã gửi email xác nhận đặt vé thành công tới: ${email}`);
        return true;
    } catch (error) {
        console.error('[Mail Ticket] Lỗi khi gửi email xác nhận vé:', error.message);
        return false;
    }
};

module.exports = sendMailBookingTicket;
