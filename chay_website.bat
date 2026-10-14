@echo off
title Khoi Dong Website Xem Phim
chcp 65001 >nul
echo ================================================================
echo        ĐANG KHỞI ĐỘNG HỆ THỐNG WEBSITE XEM PHIM...
echo ================================================================
echo.

echo [1/3] Đang khởi động Backend Server (Port 3000)...
start "1. BACKEND SERVER" cmd /k "cd server && npm run dev"
timeout /t 3 /nobreak >nul

echo [2/3] Đang khởi động Frontend Vite (Port 5173)...
start "2. FRONTEND VITE" cmd /k "cd client && npm run dev"
timeout /t 3 /nobreak >nul

echo [3/3] Đang tạo đường Link mở trên Điện Thoại (Cloudflare)...
start "3. LINK DIEN THOAI" cmd /k "start_public_link.bat"

echo.
echo ================================================================
echo   ĐÃ KHỞI ĐỘNG XONG TẤT CẢ CÁC THÀNH PHẦN!
echo.
echo   - Trên máy tính (Local):      http://localhost:5173
echo   - Điện thoại (Cùng Wi-Fi):    http://172.31.99.235:5173
echo   - Điện thoại (4G/Từ xa):      Xem link .trycloudflare.com ở cửa sổ 3
echo ================================================================
pause
