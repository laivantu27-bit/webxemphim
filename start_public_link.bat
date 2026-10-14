@echo off
title StreamPhim - Mo Cong Khai Ra Internet
echo ===================================================
echo     DANG TAO DUONG LINK CONG KHAI CHO WEBSITE...
echo ===================================================
echo.
echo Vui long giu cua so nay de duy tri link cong khai.
echo.
.\cloudflared.exe tunnel --url http://localhost:5173
pause

