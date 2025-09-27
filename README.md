# 🍽️ Restaurant Management System

Dự án **Restaurant Management System** được xây dựng bằng **React +
TypeScript + Vite**, hỗ trợ quản lý nhà hàng với nhiều vai trò (Admin,
Client).

## 📂 Cấu trúc thư mục

```bash
RestaurantManagementSystem/
│── dist/                  # Thư mục build sau khi chạy production
│── media/                 # Lưu trữ media (ảnh, video...)
│── node_modules/          # Thư viện cài đặt bởi npm/yarn
│── public/                # Static files (favicon, images, ...)
│── src/                   # Code chính của dự án
│   ├── Admin/             # Phần dành riêng cho quản trị viên
│   │   ├── Components/    # Các component tái sử dụng trong admin
│   │   ├── Layouts/       # Giao diện layout admin
│   │   ├── Pages/         # Trang của admin (Dashboard, Quản lý...)
│   │   └── Routes/        # Định nghĩa route cho admin
│   │
│   ├── Apis/              # Gọi API backend
│   │   ├── admin.api.ts   # API cho admin
│   │   └── client.api.ts  # API cho client
│   │
│   ├── Assets/            # Tài nguyên (ảnh, logo, ...)
│   │   ├── img/
│   │   └── logo/
│   │
│   ├── Client/            # Phần dành cho khách hàng
│   │   ├── Components/    # Component tái sử dụng cho client
│   │   ├── Constants/     # Các hằng số client
│   │   ├── Layout/        # Layout client
│   │   ├── Pages/         # Các trang của client (Menu, Order...)
│   │   └── Routes/        # Định nghĩa route cho client
│   │
│   ├── Utils/             # Hàm tiện ích (helper functions)
│   ├── Components/        # Component chung (dùng cho cả Admin & Client)
│   ├── Constants/         # Hằng số toàn cục
│   ├── Context/           # React Context API (quản lý state)
│   │   └── authContext.tsx # Quản lý trạng thái đăng nhập
│   ├── Helpers/           # Các hàm helper
│   ├── Hook/              # Custom React hooks
│   ├── lib/               # Thư viện tự viết/tích hợp
│   ├── Types/             # Định nghĩa TypeScript types & interfaces
│   ├── App.tsx            # File gốc React App
│   ├── index.css          # CSS global
│   ├── main.tsx           # Điểm vào ứng dụng
│   └── vite-env.d.ts      # TypeScript cho Vite
│
├── .editorconfig          # Quy tắc format code
├── .env                   # File môi trường (API keys, config)
├── .eslintrc.js/cjs       # ESLint config
├── .gitignore             # Bỏ qua file/thư mục khi push git
├── .prettierrc            # Prettier config (format code)
```

## 🚀 Cách chạy dự án

### 1. Clone và Cài Đặt

```bash
git clone <repository-url>
cd RestaurantManagement

# cài package thư viện trên dự án
yarn

# Copy file cấu hình
cp .env.example .env
```

```bash

# Chạy môi trường development
yarn dev

# Build production
yarn build

# Preview build
yarn preview
```

## 👥 Roles trong hệ thống

- **Admin**: Quản lý nhà hàng, món ăn, người dùng...
- **Client**: Xem menu, đặt bàn, đặt món ăn, thanh toán...

---
