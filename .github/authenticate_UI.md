# 🧩 Ma Trận Phân Quyền Giao Diện (UI Permission Matrix)

## 1. Giới thiệu
Tài liệu này xác định quyền truy cập giao diện cho từng **vai trò (Role)** trong hệ thống **Quản lý Nhà hàng**.  
Mục tiêu:
- Xác định rõ trang nào mỗi vai trò được phép truy cập.
- Làm cơ sở cho việc ẩn/hiện menu Sidebar hoặc chặn truy cập route ở frontend.
- Dễ dàng đồng bộ với backend (Policies / Middleware).
- Xây dựng phân quyền chi tiết ở BE theo role

---

## 2. Danh sách Vai trò (Role)
| Role Code | Tên vai trò | Mô tả |
|------------|--------------|-------|
| `SUPER_ADMIN` | Super Administrator | Toàn quyền hệ thống, bao gồm cài đặt, cấu hình và phân quyền. |
| `ADMIN` | Administrator | Quản lý tổng thể nhà hàng, nhân sự, menu, tài chính. |
| `MANAGER` | Manager | Quản lý hoạt động vận hành: ca làm, bàn ăn, đơn hàng, kho. |
| `STAFF` | Staff | Nhân viên hành chính hỗ trợ các hoạt động như thực hiện thao tác order và hỗ trợ khách hàng. |
| `CASHIER` | Cashier | Nhân viên thu ngân: xử lý thanh toán, hóa đơn, khuyến mãi. |
| `KITCHEN` | Kitchen Staff | Nhân viên bếp: xem danh sách món, cập nhật trạng thái chế biến. |
| `WAITER` | Waiter | Nhân viên phục vụ bàn: nhận order, cập nhật trạng thái món, bàn. |

---

## 3. Phân quyền theo Module / Menu

### 🏠 3.1. Dashboard (Thống kê)
| Trang | SUPER_ADMIN | ADMIN | MANAGER | STAFF | CASHIER | KITCHEN | WAITER |
|--------|:------------:|:------:|:--------:|:------:|:--------:|:--------:|:-------:|
| Thống kê hệ thống (`/dashboard`) | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

---

### 🍽️ 3.2. Quản lý Bàn & Đặt bàn
| Trang | SUPER_ADMIN | ADMIN | MANAGER | STAFF | CASHIER | KITCHEN | WAITER |
|--------|:------------:|:------:|:--------:|:------:|:--------:|:--------:|:-------:|
| Danh sách bàn (`/tables`) | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Đặt bàn (`/reservations`) | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |

  Các trạng thái order: 
    Đã gọi món
    Đang chế biến
    Đã chế biến
    Đã phục vụ
    Đã Hủy

- Trước tiên cần chỉnh lại update trạng thái cho order:
  - Chỉ có role KITCHEN mới có thể update trạng thái món ăn từ đã gọi món thành đang chế biến và đã chế biến. 
  - Các role còn lại sẽ thực hiện cập nhật từ 
    - Đã chế biến -> đã phục vụ : SUPER_ADMIN, ADMIN, MANAGER, STAFF, CASHIER, WAITER
    - Đã chế biến, Đã gọi món -> đã huỷ: SUPER_ADMIN, ADMIN, MANAGER, CASHIER

- Ở trang quản lý bàn sẽ có sự phân quyền chi tiết như sau:
  - SUPER_ADMIN, ADMIN, MANAGER, CASHIER sẽ chịu trách nhiệm: duyệt bàn, tạo order, tạo phiên bàn, gộp bàn, tách bàn, tạo hoá đơn, thanh toán.
  - SUPER_ADMIN, ADMIN, MANAGER, STAFF, CASHIER, WAITER, KITCHEN: xem danh sách bàn, thông tin bàn, thông tin order, thông tin hoá đơn

---

### 👥 3.3. Quản lý Khách hàng
| Trang | SUPER_ADMIN | ADMIN | MANAGER | STAFF | CASHIER | KITCHEN | WAITER |
|--------|:------------:|:------:|:--------:|:------:|:--------:|:--------:|:-------:|
| Quản lý khách hàng (`/customers`) | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |

---

### 🧑‍🍳 3.4. Quản lý Nhân sự
| Trang | SUPER_ADMIN | ADMIN | MANAGER | STAFF | CASHIER | KITCHEN | WAITER |
|--------|:------------:|:------:|:--------:|:------:|:--------:|:--------:|:-------:|
| Danh sách nhân viên (`/staff`) | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Ca làm việc (`/shifts`) | ✅ | ✅ | ✅ | ✅ (xem ca của mình) | ✅ (xem ca) | ✅ (xem ca) | ✅ (xem ca) |
| Bảng lương (`/payroll`) | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

- Đối với STAFF | CASHIER | KITCHEN | WAITER  sẽ giới hạn xem chỉ xem chi tiết thông tin của chính mình và ẩn đi các nút hành động liên quan đến cập nhật ca làm việc.

---

### 🍔 3.5. Quản lý Menu & Món ăn
| Trang | SUPER_ADMIN | ADMIN | MANAGER | STAFF | CASHIER | KITCHEN | WAITER |
|--------|:------------:|:------:|:--------:|:------:|:--------:|:--------:|:-------:|
| Thể loại món (`/category-dish`) | ✅ | ✅ | ✅ (xem) | ✅ | ✅ (xem) | ✅ (xem) | ✅ (xem) |
| Danh sách món (`/dish`) | ✅ | ✅ | ✅ | ✅ (xem) | ✅ (xem) | ✅ (chế biến) | ✅ (gọi món) |
| Menu (`/menu`) | ✅ | ✅ | ✅ | ✅ (xem) | ✅ (xem) | ✅ (xem món chế biến) | ✅ (xem món phục vụ) |

- Đối với các role chỉ quyền xem đảm bảo ẩn đi các nút thao tác chỉnh sửa data (vẫn cho filter)

---

### 🧺 3.6. Quản lý Nguyên liệu & Kho
| Trang | SUPER_ADMIN | ADMIN | MANAGER | STAFF | CASHIER | KITCHEN | WAITER |
|--------|:------------:|:------:|:--------:|:------:|:--------:|:--------:|:-------:|
| Nguyên liệu (`/ingredients`) | ✅ | ✅ | ✅ | ✅ (chỉ xem) | ❌ | ✅ (xem tồn kho) | ❌ |
| Nhà cung cấp (`/suppliers`) | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Nhập kho (`/warehouse-in`) | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ (xem tồn) | ❌ |
| Xuất kho (`/warehouse-out`) | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| Hao hụt kiểm kê (`/inventory-loss`) | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ (ghi nhận) | ❌ |

---

### 💰 3.7. Quản lý Tài chính
| Trang | SUPER_ADMIN | ADMIN | MANAGER | STAFF | CASHIER | KITCHEN | WAITER |
|--------|:------------:|:------:|:--------:|:------:|:--------:|:--------:|:-------:|
| Quản lý hóa đơn (`/invoices`) | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Quản lý khuyến mãi (`/promotions`) | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ (xem) |

---

### ⚙️ 3.8. Cấu hình & Bảo mật
| Trang | SUPER_ADMIN | ADMIN | MANAGER | STAFF | CASHIER | KITCHEN | WAITER |
|--------|:------------:|:------:|:--------:|:------:|:--------:|:--------:|:-------:|
| Quản lý vai trò (`/roles`) | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Ma trận phân quyền (`/permission-matrix`) | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

### 👤 3.9. Cá nhân & Phiên đăng nhập
| Trang | SUPER_ADMIN | ADMIN | MANAGER | STAFF | CASHIER | KITCHEN | WAITER |
|--------|:------------:|:------:|:--------:|:------:|:--------:|:--------:|:-------:|
| Hồ sơ cá nhân (`/profile`) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Đăng xuất | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

---
