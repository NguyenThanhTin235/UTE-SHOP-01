# UTE-SHOP-01

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" />
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" />
</p>

## 📖 Giới thiệu dự án
**UTE-SHOP-01** là một hệ thống thương mại điện tử Fullstack (MERN stack) được thiết kế nhằm cung cấp trải nghiệm mua sắm trực tuyến mượt mà và quản lý hiệu quả. Dự án bao gồm các chức năng cốt lõi như quản lý sản phẩm, giỏ hàng, thanh toán, xác thực người dùng, tích hợp các công nghệ AI (Google Generative AI/OpenAI), và sử dụng Redis để tối ưu hóa tốc độ.

## 👥 Thông tin thành viên nhóm

Dự án được phát triển bởi các thành viên:

| STT | Họ và Tên | MSSV |
| :---: | :--- | :--- |
| 1 | **Trác Ngọc Đăng Khoa** | 23110243 |
| 2 | **Nguyễn Thành Tin** | 23110340 |
| 3 | **Nguyễn Duy Cường** | 23110189 |
| 4 | **Phan Đình Duẩn** | 23110192 |

## 🚀 Công nghệ sử dụng

### 1. Frontend
- **Framework:** React.js (Vite)
- **Styling:** Tailwind CSS
- **State Management:** Redux Toolkit
- **Routing:** React Router v7
- **Maps:** Leaflet & React Leaflet
- **Charts:** Chart.js & Recharts
- **Khác:** Axios, React Hot Toast, Lucide React, JSPDF

### 2. Backend
- **Platform:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB (Mongoose)
- **Caching:** Redis (ioredis)
- **Authentication:** JSON Web Token (JWT), Google Auth Library, bcryptjs
- **Upload File:** Cloudinary, Multer
- **Mail:** Nodemailer
- **AI Integration:** Google Generative AI, OpenAI

## ⚙️ Hướng dẫn cài đặt và chạy dự án (Local)

### Yêu cầu hệ thống:
- [Node.js](https://nodejs.org/en/) (v18 trở lên)
- [MongoDB](https://www.mongodb.com/) (hoặc kết nối đến MongoDB Atlas)
- [Redis](https://redis.io/) (chạy nền cục bộ hoặc sử dụng Redis Cloud)

### Các bước cài đặt:

**1. Clone dự án về máy**
```bash
git clone <đường-dẫn-repo>
cd UTE-SHOP-01
```

**2. Cài đặt và cấu hình Backend**
```bash
cd backend
npm install
```
- Tạo file `.env` (copy từ nội dung của file `.env.example`) và cấu hình các biến môi trường: MongoDB URI, JWT Secret, thông tin cấu hình Cloudinary, cấu hình Redis, v.v.
- Khởi chạy Backend server (chế độ phát triển):
```bash
npm run dev
```

**3. Cài đặt và cấu hình Frontend**
Mở một terminal (cmd) mới:
```bash
cd frontend
npm install
```
- Khởi chạy Frontend server:
```bash
npm run dev
```
*(Sau đó truy cập vào `http://localhost:5173` trên trình duyệt để sử dụng ứng dụng)*

## 📂 Cấu trúc thư mục tổng quan

```text
UTE-SHOP-01/
├── backend/            # Mã nguồn server và API (Node.js/Express)
│   ├── config/         # Cấu hình DB, Cloudinary, Redis,...
│   ├── controllers/    # Xử lý logic của các API (Req, Res)
│   ├── middleware/     # Các middleware (xác thực, phân quyền, upload,...)
│   ├── models/         # Database schema (Mongoose Models)
│   ├── routes/         # Định nghĩa các route cho API
│   ├── services/       # Nơi tập trung các business logic phức tạp
│   └── utils/          # Các hàm hỗ trợ (tiện ích) dùng chung
├── frontend/           # Mã nguồn giao diện người dùng (React/Vite)
│   ├── src/
│   │   ├── assets/     # Tài nguyên tĩnh (ảnh, font)
│   │   ├── components/ # Các UI Component có thể tái sử dụng
│   │   ├── hooks/      # Các custom React hooks
│   │   ├── pages/      # Chứa các giao diện trang (Home, Cart, Login,...)
│   │   └── redux/      # Cấu hình store và các slice cho Redux
├── DATA/               # Thư mục chứa dữ liệu mẫu hoặc mock data
├── docs/               # Các tài liệu mô tả, phân tích thiết kế dự án
└── template/           # Các mẫu thiết kế hoặc HTML tĩnh nếu có
```

---
*Dự án được thực hiện bởi nhóm sinh viên. Mọi quyền liên quan đến dự án thuộc về các thành viên trong nhóm.*
