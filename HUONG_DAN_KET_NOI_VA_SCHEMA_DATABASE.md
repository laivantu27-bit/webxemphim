# HƯỚNG DẪN KẾT NỐI VÀ TOÀN BỘ CẤU TRÚC 13 BẢNG DATABASE (POSTGRESQL)

> **Dự án**: Website Đặt Vé & Quản Lý Rạp Chiếu Phim (StreamPhim)  
> **Hệ quản trị CSDL**: PostgreSQL (Khuyến nghị phiên bản 14, 15, 16, 17 hoặc 18)  
> **File sao lưu dữ liệu toàn diện kèm theo**: `database_backup.sql` (1.29 MB - chứa toàn bộ bảng, dữ liệu mẫu, tài khoản admin/staff và 15 phim rạp).

---

## 1. THÔNG TIN KẾT NỐI DATABASE (CONNECTION PARAMETERS)

Khi gửi cho người khác kết nối hoặc cấu hình backend, cung cấp các thông số sau:

| Thông số | Giá trị mặc định trên máy chủ | Ghi chú |
| :--- | :--- | :--- |
| **Host / Server** | `localhost` hoặc `127.0.0.1` | *(Nếu kết nối từ xa trong mạng LAN, điền IP máy chủ ví dụ: `192.168.1.x`)* |
| **Port** | `5432` | Cổng mặc định của PostgreSQL |
| **Database Name** | `movie` | Tên cơ sở dữ liệu của dự án |
| **Username** | `postgres` | Tài khoản superuser PostgreSQL |
| **Password** | `tu154207` | *(Hoặc mật khẩu do người cài đặt đặt khi cài PostgreSQL)* |
| **Connection URL** | `postgres://postgres:tu154207@localhost:5432/movie` | Dùng cho Prisma, TypeORM, DBeaver, Sequelize |

### Cấu hình file `.env` cho Backend NodeJS (`server/.env`):
```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=movie
DB_USER=postgres
DB_PASSWORD=tu154207
JWT_SECRET=your_secret_key_here
```

---

## 2. HƯỚNG DẪN 1-CLICK KHÔI PHỤC DATABASE TỪ FILE `database_backup.sql`

Người nhận chỉ cần file `database_backup.sql` là có thể tạo lập toàn bộ database với đầy đủ 13 bảng và dữ liệu chỉ trong **1 phút**.

### Cách 1: Sử dụng Command Line (Terminal / CMD / PowerShell) - Nhanh nhất

```bash
# Bước 1: Tạo database mới tên là 'movie' (nếu chưa có)
psql -U postgres -c "CREATE DATABASE movie;"

# Bước 2: Import toàn bộ bảng và dữ liệu từ file backup
psql -U postgres -d movie -f database_backup.sql
```
*(Hệ thống sẽ hỏi mật khẩu postgres của máy người nhận, nhập mật khẩu và nhấn Enter).*

---

### Cách 2: Sử dụng công cụ trực quan pgAdmin 4

1. Mở **pgAdmin 4** và kết nối tới PostgreSQL Server.
2. Tại cây danh mục bên trái, chuột phải vào **Databases** -> Chọn **Create** -> **Database...**
3. Đặt Database name là `movie` rồi nhấn **Save**.
4. Chuột phải vào database `movie` vừa tạo -> Chọn **Query Tool**.
5. Nhấn vào biểu tượng thư mục **Open File** trên thanh công cụ (hoặc nhấn `Ctrl + O`), chọn đường dẫn đến file `database_backup.sql`.
6. Nhấn nút **Execute (F5)** (biểu tượng hình tam giác Run).
7. Thông báo *"Query returned successfully"* hiện ra -> Nhấn chuột phải vào `movie` chọn **Refresh** để thấy đầy đủ 13 bảng.

---

### Cách 3: Sử dụng DBeaver

1. Mở DBeaver -> Menu **Database** -> **New Database Connection** -> Chọn **PostgreSQL**.
2. Nhập Host: `localhost`, Database: `postgres`, Username: `postgres`, Password của bạn -> Nhấn **Finish**.
3. Tạo database `movie` (nếu chưa có).
4. Chuột phải vào database `movie` -> Chọn **Tools** -> **Execute script** -> Chọn file `database_backup.sql` -> Nhấn **Start**.

---

## 3. SƠ ĐỒ QUAN HỆ CÁC BẢNG (ENTITY RELATIONSHIP DIAGRAM)

```mermaid
erDiagram
    users ||--o{ payments : "đặt vé / thanh toán"
    users ||--o{ previewMovie : "viết đánh giá"
    users ||--o{ apiKeys : "sở hữu khóa API"
    movies ||--o{ payments : "thuộc phim"
    movies ||--o{ seats : "suất chiếu ghế"
    movies ||--o{ previewMovie : "nhận đánh giá"
    category ||--o{ movies : "phân loại thể loại"
    cinemaBranches ||--o{ rooms : "chứa phòng chiếu"
    cinemaBranches ||--o{ payments : "chi nhánh đặt vé"
    rooms ||--o{ seats : "chứa sơ đồ ghế"
    vouchers ||--o{ payments : "áp dụng giảm giá"
    bank_config ||--o{ payments : "tài khoản nhận tiền VietQR/MoMo"
```

---

## 4. CHI TIẾT CẤU TRÚC TOÀN BỘ 13 BẢNG DATABASE (DATA DICTIONARY)

### Bảng 1: `users` (Quản lý người dùng, nhân viên, quản trị viên & VIP)
*Chức năng*: Lưu trữ thông tin tài khoản, phân quyền hệ thống, điểm tích lũy thành viên (XP), hạng thẻ (Bronze, Silver, Gold, Diamond) và thông tin sinh viên nhận ưu đãi.

| Tên Cột | Kiểu Dữ Liệu | Nullable | Khóa / Mặc định | Ý Nghĩa / Chức Năng |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `uuid` | NOT NULL | **Primary Key** | Định danh duy nhất người dùng |
| `email` | `varchar(255)` | NOT NULL | Unique | Email đăng nhập & nhận vé |
| `password` | `varchar(255)` | YES | | Mật khẩu mã hóa bcrypt |
| `fullName` | `varchar(255)` | NOT NULL | | Họ và tên khách hàng/nhân viên |
| `phone` | `varchar(255)` | YES | | Số điện thoại liên hệ |
| `avatar` | `varchar(255)` | YES | | Đường dẫn ảnh đại diện |
| `role` | `enum_users_role` | NOT NULL | `'customer'` | Phân quyền: `customer`, `staff`, `admin` |
| `isAdmin` | `varchar(255)` | NOT NULL | `'false'` | Cờ quản trị viên hệ thống |
| `typeLogin` | `enum_users_typeLogin` | NOT NULL | `'local'` | Phương thức: `local`, `google`, `facebook` |
| `xpPoints` | `integer` | NOT NULL | `0` | Điểm tích lũy nâng hạng |
| `level` | `varchar(255)` | NOT NULL | `'Bronze'` | Hạng thẻ: `Bronze`, `Silver`, `Gold`, `Diamond` |
| `studentVerified`| `boolean` | NOT NULL | `false` | Cờ đã duyệt ưu đãi học sinh/sinh viên |
| `studentSchool` | `varchar(255)` | YES | | Tên trường đại học/cao đẳng/THPT |
| `studentIdImage` | `text` | YES | | Ảnh chụp thẻ sinh viên xác thực |
| `rewardsHistory` | `text` | YES | | Lịch sử đổi quà & tích điểm (JSON) |
| `createdAt` | `timestamptz` | NOT NULL | `NOW()` | Ngày tạo tài khoản |
| `updatedAt` | `timestamptz` | NOT NULL | `NOW()` | Ngày cập nhật gần nhất |

---

### Bảng 2: `movies` (Quản lý phim chiếu rạp)
*Chức năng*: Lưu thông tin chi tiết từng bộ phim đang chiếu/sắp chiếu, trailer YouTube, giá vé cơ bản, thời lượng, đạo diễn, diễn viên.

| Tên Cột | Kiểu Dữ Liệu | Nullable | Khóa / Mặc định | Ý Nghĩa / Chức Năng |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `uuid` | NOT NULL | **Primary Key** | Mã định danh phim |
| `name` | `varchar(255)` | NOT NULL | | Tên phim tiếng Việt/quốc tế |
| `category` | `uuid` | NOT NULL | FK `category.id` | Mã thể loại phim |
| `actor` | `varchar(255)` | NOT NULL | | Danh sách diễn viên chính |
| `director` | `varchar(255)` | NOT NULL | | Tên đạo diễn |
| `country` | `varchar(255)` | NOT NULL | | Quốc gia sản xuất (Việt Nam, Mỹ, Hàn Quốc...) |
| `description` | `text` | NOT NULL | | Tóm tắt nội dung kịch bản phim |
| `thumb_url` | `varchar(255)` | YES | | Ảnh banner ngang hiển thị nổi bật |
| `poster_url` | `varchar(255)` | YES | | Ảnh poster dọc chính thức |
| `trailer_url` | `varchar(255)` | YES | | Link trailer YouTube (đã tối ưu embed chuẩn) |
| `time` | `varchar(255)` | NOT NULL | | Thời lượng phim (ví dụ: `120 phút`) |
| `price` | `varchar(255)` | YES | | Giá vé cơ bản áp dụng (ví dụ: `75000`) |
| `quality` | `varchar(255)` | NOT NULL | | Định dạng chiếu: `2D`, `3D`, `IMAX`, `4DX` |
| `year` | `varchar(255)` | NOT NULL | | Năm phát hành |
| `dateStart` | `timestamptz` | NOT NULL | | Ngày bắt đầu công chiếu tại rạp |
| `dateEnd` | `timestamptz` | YES | | Ngày kết thúc suất chiếu |
| `createdAt` | `timestamptz` | NOT NULL | `NOW()` | Thời gian khởi tạo bản ghi |
| `updatedAt` | `timestamptz` | NOT NULL | `NOW()` | Thời gian cập nhật gần nhất |

---

### Bảng 3: `cinemaBranches` (Cụm rạp & Chi nhánh toàn quốc)
*Chức năng*: Lưu danh sách cụm rạp CGV toàn quốc, định vị GPS (Kinh độ/Vĩ độ) để khách hàng tìm rạp gần nhất qua bản đồ vệ tinh/Leaflet.

| Tên Cột | Kiểu Dữ Liệu | Nullable | Khóa / Mặc định | Ý Nghĩa / Chức Năng |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `uuid` | NOT NULL | **Primary Key** | Mã định danh cụm rạp |
| `name` | `varchar(255)` | NOT NULL | | Tên cụm rạp (ví dụ: `CGV Vincom Đồng Khởi`) |
| `brand` | `varchar(255)` | YES | | Thương hiệu rạp (`CGV`, `BHD`, `Lotte`) |
| `address` | `varchar(255)` | NOT NULL | | Địa chỉ đường/tòa nhà chi tiết |
| `province` | `varchar(255)` | NOT NULL | | Tỉnh/Thành phố (Hà Nội, TP.HCM, Đà Nẵng...) |
| `city` | `varchar(255)` | YES | | Quận/Huyện |
| `lat` | `float8` | NOT NULL | | Tọa độ Vĩ độ (Latitude) trên Google Maps |
| `lng` | `float8` | NOT NULL | | Tọa độ Kinh độ (Longitude) trên Google Maps |
| `phone` | `varchar(255)` | YES | | Hotline hỗ trợ khách hàng rạp |
| `totalRooms` | `integer` | YES | | Tổng số phòng chiếu tại chi nhánh này |
| `imageUrl` | `varchar(255)` | YES | | Ảnh chụp sảnh & không gian rạp |
| `openHours` | `varchar(255)` | YES | | Giờ mở cửa hoạt động (ví dụ: `08:00 - 24:00`) |
| `status` | `varchar(255)` | YES | `'active'` | Trạng thái hoạt động |
| `createdAt` | `timestamptz` | NOT NULL | `NOW()` | Ngày thêm cụm rạp |
| `updatedAt` | `timestamptz` | NOT NULL | `NOW()` | Ngày cập nhật thông tin |

---

### Bảng 4: `rooms` (Phòng chiếu phim)
*Chức năng*: Quản lý danh sách phòng chiếu thuộc từng cụm rạp, số lượng ghế, hàng ghế và công nghệ phòng chiếu.

| Tên Cột | Kiểu Dữ Liệu | Nullable | Khóa / Mặc định | Ý Nghĩa / Chức Năng |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `uuid` | NOT NULL | **Primary Key** | Mã định danh phòng chiếu |
| `name` | `varchar(255)` | NOT NULL | | Tên phòng (ví dụ: `Phòng 01 - IMAX Laser`) |
| `cinema` | `varchar(255)` | NOT NULL | | Tên chi nhánh rạp trực thuộc |
| `cinemaBranchId` | `uuid` | YES | FK `cinemaBranches.id` | Khóa ngoại liên kết bảng chi nhánh rạp |
| `type` | `varchar(255)` | NOT NULL | | Loại phòng (`Standard`, `VIP`, `IMAX`, `4DX`) |
| `totalRows` | `integer` | NOT NULL | | Tổng số hàng ghế (ví dụ: `8` hàng A -> H) |
| `seatsPerRow` | `integer` | NOT NULL | | Số ghế trong mỗi hàng (ví dụ: `10` ghế) |
| `status` | `enum_rooms_status`| NOT NULL | `'active'` | Trạng thái phòng: `active`, `maintenance` |
| `createdAt` | `timestamptz` | NOT NULL | `NOW()` | Thời gian tạo phòng |
| `updatedAt` | `timestamptz` | NOT NULL | `NOW()` | Thời gian cập nhật phòng |

---

### Bảng 5: `seats` (Ghế ngồi & Trạng thái đặt theo suất chiếu)
*Chức năng*: Quản lý thời gian thực trạng thái từng ghế ngồi (Trống, Đã đặt, Đang chọn) cho từng suất chiếu cụ thể.

| Tên Cột | Kiểu Dữ Liệu | Nullable | Khóa / Mặc định | Ý Nghĩa / Chức Năng |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `uuid` | NOT NULL | **Primary Key** | Mã định danh bản ghi ghế |
| `row` | `varchar(255)` | NOT NULL | | Ký tự hàng ghế (`A`, `B`, `C`, `D`, `E`, `F`, `G`, `H`) |
| `number` | `integer` | NOT NULL | | Số thứ tự ghế trong hàng (`1`, `2`, `3`... `10`) |
| `seat_code` | `varchar(255)` | NOT NULL | | Mã ghế hoàn chỉnh (`A1`, `B5`, `H10`...) |
| `movieId` | `uuid` | NOT NULL | FK `movies.id` | Khóa ngoại liên kết phim đang chiếu |
| `date` | `varchar(255)` | NOT NULL | | Ngày chiếu của suất |
| `time` | `varchar(255)` | NOT NULL | | Khung giờ chiếu (ví dụ: `19:30`) |
| `status` | `varchar(255)` | NOT NULL | `'available'` | Trạng thái: `available` (trống), `booked` (đã đặt) |
| `createdAt` | `timestamptz` | NOT NULL | `NOW()` | Thời gian tạo bản ghi |
| `updatedAt` | `timestamptz` | NOT NULL | `NOW()` | Thời gian cập nhật |

---

### Bảng 6: `payments` (Đơn đặt vé, Hóa đơn thanh toán & Check-in soát vé)
*Chức năng*: Bảng trọng tâm quản lý toàn bộ giao dịch đặt vé, mã QR vé điện tử, thanh toán chuyển khoản VietQR / MoMo / Tiền mặt, bắp nước đi kèm và hỗ trợ nhân viên soát vé quét QR check-in tại rạp.

| Tên Cột | Kiểu Dữ Liệu | Nullable | Khóa / Mặc định | Ý Nghĩa / Chức Năng |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `uuid` | NOT NULL | **Primary Key** | Mã hóa đơn / Mã đặt vé định danh duy nhất |
| `movieId` | `uuid` | NOT NULL | FK `movies.id` | Mã phim được đặt |
| `userId` | `uuid` | YES | FK `users.id` | Mã người dùng đặt vé |
| `customerName` | `varchar(255)` | YES | | Tên khách hàng (áp dụng cho cả khách vãng lai) |
| `customerPhone` | `varchar(255)` | YES | | SĐT khách hàng nhận mã vé SMS/Zalo |
| `seatId` | `varchar(255)` | NOT NULL | | Danh sách mã ghế đã đặt (ví dụ: `A1, A2`) |
| `totalPrice` | `integer` | NOT NULL | | Tổng số tiền thanh toán thực tế (VND) |
| `date` | `timestamptz` | NOT NULL | | Ngày diễn ra suất chiếu |
| `time` | `varchar(255)` | NOT NULL | | Giờ diễn ra suất chiếu |
| `cinemaBranchId` | `uuid` | YES | FK `cinemaBranches.id` | Mã chi nhánh cụm rạp đã chọn |
| `branchName` | `varchar(255)` | YES | | Tên chi nhánh rạp chiếu |
| `paymentMethod` | `varchar(255)` | NOT NULL | | Hình thức: `vietqr`, `momo`, `cash`, `banking` |
| `status` | `varchar(255)` | YES | `'pending'` | Trạng thái vé: `pending`, `completed`, `cancelled` |
| `services` | `text` | YES | | Chi tiết combo bắp nước đi kèm (chuỗi JSON) |
| `voucherCode` | `varchar(255)` | YES | | Mã voucher giảm giá đã áp dụng |
| `discountAmount` | `integer` | YES | `0` | Số tiền được giảm giá qua voucher |
| `isCheckIn` | `boolean` | YES | `false` | Cờ đã soát vé vào rạp (`true`/`false`) |
| `checkInAt` | `timestamptz` | YES | | Thời điểm nhân viên quét mã QR soát vé |
| `staffId` | `uuid` | YES | FK `users.id` | Mã nhân viên thực hiện soát vé |
| `createdAt` | `timestamptz` | NOT NULL | `NOW()` | Thời gian tạo đơn đặt vé |
| `updatedAt` | `timestamptz` | NOT NULL | `NOW()` | Thời gian thanh toán/cập nhật vé |

---

### Bảng 7: `bank_config` (Cấu hình tài khoản nhận tiền thực tế - VietQR & MoMo)
*Chức năng*: Cấu hình thông tin tài khoản ngân hàng và ví điện tử nhận tiền thanh toán trực tiếp từ khách hàng khi quét mã QR chuẩn Napas247 VietQR & MoMo.

| Tên Cột | Kiểu Dữ Liệu | Nullable | Khóa / Mặc định | Ý Nghĩa / Chức Năng |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `uuid` | NOT NULL | **Primary Key** | Mã định danh bản ghi ngân hàng |
| `bankId` | `varchar(255)` | NOT NULL | | Mã ngân hàng nhận diện: `VCB`, `MOMO`, `ICB`... |
| `bankName` | `varchar(255)` | NOT NULL | | Tên ngân hàng (ví dụ: `Vietcombank`, `MoMo`) |
| `accountNo` | `varchar(255)` | NOT NULL | | **Số tài khoản nhận tiền thật** (VCB: `1336991507`, MoMo: `PSP2626913300000151`) |
| `accountName` | `varchar(255)` | NOT NULL | | **Tên chủ tài khoản thụ hưởng** (ví dụ: `LAI VAN TU`) |
| `template` | `varchar(255)` | YES | `'compact'` | Giao diện mẫu mã QR (compact, qr_only...) |
| `isActive` | `boolean` | YES | `true` | Cờ kích hoạt phương thức thanh toán |
| `createdAt` | `timestamptz` | NOT NULL | `NOW()` | Ngày thêm cấu hình |
| `updatedAt` | `timestamptz` | NOT NULL | `NOW()` | Ngày cập nhật cấu hình |

---

### Bảng 8: `services` (Bắp nước & Combo ăn uống kèm vé)
*Chức năng*: Quản lý danh mục đồ ăn thức uống (Bắp phô mai, Caramel, Pepsi, Combo đôi...) để khách mua cùng khi đặt vé.

| Tên Cột | Kiểu Dữ Liệu | Nullable | Khóa / Mặc định | Ý Nghĩa / Chức Năng |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `uuid` | NOT NULL | **Primary Key** | Mã định danh sản phẩm |
| `name` | `varchar(255)` | NOT NULL | | Tên món (ví dụ: `Combo Solo Bắp Nước`) |
| `description` | `text` | YES | | Mô tả chi tiết thành phần combo |
| `price` | `integer` | NOT NULL | | Giá bán lẻ niêm yết (VND) |
| `image` | `varchar(255)` | YES | | Đường dẫn ảnh minh họa món |
| `category` | `varchar(255)` | NOT NULL | | Phân loại: `food`, `drink`, `combo` |
| `status` | `varchar(255)` | NOT NULL | `'active'` | Trạng thái: `active` (đang bán), `disabled` |
| `createdAt` | `timestamptz` | NOT NULL | `NOW()` | Ngày thêm sản phẩm |
| `updatedAt` | `timestamptz` | NOT NULL | `NOW()` | Ngày chỉnh sửa thông tin |

---

### Bảng 9: `vouchers` (Mã giảm giá & Khuyến mãi)
*Chức năng*: Quản lý các voucher khuyến mãi, tỷ lệ giảm giá (% hoặc tiền mặt), giá trị đơn hàng tối thiểu và hạn sử dụng.

| Tên Cột | Kiểu Dữ Liệu | Nullable | Khóa / Mặc định | Ý Nghĩa / Chức Năng |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `uuid` | NOT NULL | **Primary Key** | Mã định danh voucher |
| `code` | `varchar(255)` | NOT NULL | Unique | Mã khuyến mãi nhập vào (ví dụ: `CHAOBANMOI`, `CGV20K`) |
| `description` | `text` | YES | | Mô tả điều kiện áp dụng |
| `discountType` | `varchar(255)` | NOT NULL | | Loại giảm giá: `percentage` (%) hoặc `fixed` (tiền mặt) |
| `discountValue` | `integer` | NOT NULL | | Giá trị giảm (ví dụ: `20` cho 20% hoặc `50000` cho 50.000đ) |
| `minOrderValue` | `integer` | NOT NULL | `0` | Giá trị đơn hàng tối thiểu để được áp dụng |
| `maxDiscount` | `integer` | YES | | Số tiền giảm tối đa (nếu là dạng %) |
| `quantity` | `integer` | NOT NULL | | Tổng số lượng voucher phát hành |
| `usedCount` | `integer` | NOT NULL | `0` | Số lần khách đã nhập mã này thành công |
| `startDate` | `timestamptz` | YES | | Ngày bắt đầu áp dụng |
| `endDate` | `timestamptz` | YES | | Ngày hết hạn khuyến mãi |
| `status` | `varchar(255)` | NOT NULL | `'active'` | Trạng thái: `active` hoặc `expired` |
| `createdAt` | `timestamptz` | NOT NULL | `NOW()` | Ngày tạo voucher |
| `updatedAt` | `timestamptz` | NOT NULL | `NOW()` | Ngày sửa thông tin |

---

### Bảng 10: `previewMovie` (Đánh giá, Chấm điểm sao & Bình luận phim)
*Chức năng*: Lưu trữ phản hồi thực tế của khán giả sau khi xem phim, số sao xếp hạng (1 - 5 sao) và nhận xét.

| Tên Cột | Kiểu Dữ Liệu | Nullable | Khóa / Mặc định | Ý Nghĩa / Chức Năng |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `uuid` | NOT NULL | **Primary Key** | Mã định danh đánh giá |
| `movieId` | `uuid` | NOT NULL | FK `movies.id` | Mã bộ phim được đánh giá |
| `userId` | `uuid` | NOT NULL | FK `users.id` | Mã người dùng viết đánh giá |
| `rating` | `integer` | NOT NULL | | Số điểm sao đánh giá (từ 1 đến 5 sao) |
| `comment` | `text` | YES | | Nội dung bình luận chi tiết của khán giả |
| `createdAt` | `timestamptz` | NOT NULL | `NOW()` | Thời điểm gửi bình luận |
| `updatedAt` | `timestamptz` | NOT NULL | `NOW()` | Thời điểm chỉnh sửa bình luận |

---

### Bảng 11: `category` (Thể loại phim)
*Chức năng*: Danh mục phân loại thể loại phim phục vụ tìm kiếm và lọc trên website.

| Tên Cột | Kiểu Dữ Liệu | Nullable | Khóa / Mặc định | Ý Nghĩa / Chức Năng |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `uuid` | NOT NULL | **Primary Key** | Mã thể loại |
| `nameCategory` | `varchar(255)` | NOT NULL | | Tên thể loại (Hành động, Hài kịch, Kinh dị, Hoạt hình, Tình cảm...) |
| `createdAt` | `timestamptz` | NOT NULL | `NOW()` | Ngày thêm thể loại |
| `updatedAt` | `timestamptz` | NOT NULL | `NOW()` | Ngày cập nhật |

---

### Bảng 12: `otps` (Mã xác thực Email OTP)
*Chức năng*: Lưu trữ mã OTP 6 số ngẫu nhiên có thời hạn dùng để kích hoạt tài khoản hoặc đặt lại mật khẩu.

| Tên Cột | Kiểu Dữ Liệu | Nullable | Khóa / Mặc định | Ý Nghĩa / Chức Năng |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `uuid` | NOT NULL | **Primary Key** | Mã định danh OTP |
| `email` | `varchar(255)` | NOT NULL | | Địa chỉ email người nhận mã |
| `otp` | `varchar(255)` | NOT NULL | | Mã xác thực 6 chữ số |
| `createdAt` | `timestamptz` | NOT NULL | `NOW()` | Thời điểm mã được phát hành |
| `updatedAt` | `timestamptz` | NOT NULL | `NOW()` | Thời gian cập nhật trạng thái |

---

### Bảng 13: `apiKeys` (Khóa bảo mật phiên xác thực hệ thống)
*Chức năng*: Quản lý cặp khóa mã hóa bảo mật PublicKey và PrivateKey giữa máy chủ và client nhằm chống giả mạo token.

| Tên Cột | Kiểu Dữ Liệu | Nullable | Khóa / Mặc định | Ý Nghĩa / Chức Năng |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `uuid` | NOT NULL | **Primary Key** | Mã định danh khóa API |
| `userId` | `uuid` | NOT NULL | FK `users.id` | Mã người dùng sở hữu phiên làm việc |
| `publicKey` | `text` | NOT NULL | | Khóa công khai của phiên |
| `privateKey` | `text` | NOT NULL | | Khóa bí mật mã hóa chữ ký số |
| `createdAt` | `timestamptz` | NOT NULL | `NOW()` | Thời điểm sinh cặp khóa |
| `updatedAt` | `timestamptz` | NOT NULL | `NOW()` | Thời điểm làm mới khóa |

---

## 5. DANH SÁCH TÀI KHOẢN MẪU ĐỂ TEST HỆ THỐNG

Sau khi import file `database_backup.sql`, bạn có thể sử dụng ngay các tài khoản sẵn có sau:

| Vai trò | Email đăng nhập | Mật khẩu mẫu | Quyền hạn trong hệ thống |
| :--- | :--- | :--- | :--- |
| **Quản trị viên (Admin)** | `admin@gmail.com` | `123456` | Quản trị toàn quyền: Thêm/Sửa/Xóa phim, quản lý rạp, phòng chiếu, xem doanh thu, cấu hình STK ngân hàng, duyệt sinh viên. |
| **Quản trị viên (Admin)** | `laivantu27@gmail.com` | `123456` | Tài khoản Admin chính chủ của tác giả. |
| **Nhân viên (Staff)** | `staff@gmail.com` | `123456` | Giao diện nhân viên rạp: Quét mã QR vé để check-in khách vào rạp, kiểm tra vé hợp lệ. |
| **Khách hàng (Customer)** | Đăng ký trực tiếp trên web | Tự đặt | Xem phim, chọn ghế, mua bắp nước, áp mã giảm giá, quét QR thanh toán VietQR / MoMo nhận vé tức thì. |

---

## 6. DANH SÁCH FILE LIÊN QUAN TRONG THƯ MỤC DỰ ÁN

- `database_backup.sql`: File chứa toàn bộ mã SQL và dữ liệu dump chuẩn của PostgreSQL 18.
- `HUONG_DAN_KET_NOI_VA_SCHEMA_DATABASE.md`: Tài liệu này.
- `BAO_CAO_HE_THONG_STREAMPHIM.md`: Báo cáo chi tiết toàn bộ chức năng hệ thống.
- `server/.env`: File cấu hình biến môi trường kết nối database trên backend.
