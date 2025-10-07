# Module Quản lý Bảng tính lương (Payroll Management)

## 📋 Tổng quan

Module này cung cấp chức năng quản lý bảng lương nhân viên hoàn chỉnh cho hệ thống nhà hàng, bao gồm:
- ✅ Tạo bảng lương tự động theo tháng/năm
- ✅ Quản lý chi tiết các khoản thu nhập và khấu trừ
- ✅ Theo dõi trạng thái thanh toán
- ✅ Tích hợp với hệ thống chấm công (Employee Shifts)
- ✅ Báo cáo và lọc dữ liệu linh hoạt

## 🗂️ Cấu trúc File

```
src/
├── Types/
│   └── payroll.type.ts                 # Type definitions và constants
├── Apis/Admin/
│   ├── payroll.api.ts                  # API functions cho payroll
│   ├── payrollItems.api.ts             # API functions cho payroll items
│   └── index.ts                        # Export tổng hợp
└── Admin/Pages/ManagePayroll/
    ├── ManagePayroll.tsx               # Main page component
    ├── index.ts                        # Export
    └── components/
        ├── PayrollListTab.tsx          # Danh sách bảng lương
        ├── PayrollDetailModal.tsx      # Chi tiết & chỉnh sửa
        ├── PaymentModal.tsx            # Thanh toán lương
        └── PayrollItemModal.tsx        # Thêm/sửa khoản mục
```

## 📊 Data Model

### Payroll (Bảng lương)
```typescript
{
  id: string                    // ID bảng lương
  month: number                 // Tháng (1-12)
  year: number                  // Năm
  base_salary: string           // Lương cơ bản
  bonus: string                 // Thưởng tổng
  deductions: string            // Khấu trừ tổng
  final_salary: string          // Thực lĩnh = base + bonus - deductions + items
  status: number                // 0=Nháp, 1=Đã thanh toán
  payment_method: number        // 0=Tiền mặt, 1=Chuyển khoản, 3=Ví điện tử
  payment_ref: string | null    // Mã giao dịch
  paid_at: string | null        // Thời gian thanh toán
  notes: string | null          // Ghi chú
  employee_id: string           // ID nhân viên
  employee: Employee            // Thông tin nhân viên
  items: PayrollItem[]          // Chi tiết các khoản
}
```

### PayrollItem (Khoản mục)
```typescript
{
  id: string                    // ID khoản mục
  payroll_id: string            // ID bảng lương
  item_type: number             // 0=Thu nhập, 1=Khấu trừ
  code: string                  // Mã khoản mục
  description: string           // Mô tả
  amount: string                // Số tiền
  signed_amount: string         // Số tiền có dấu (+/-)
}
```

## 🎨 UI Components

### 1. PayrollListTab - Danh sách Bảng lương
**Features:**
- Table hiển thị danh sách với các cột:
  - Nhân viên
  - Tháng/Năm
  - Lương cơ bản
  - Thưởng
  - Khấu trừ
  - Thực lĩnh (highlighted)
  - Trạng thái (Tag với màu)
  - Thông tin thanh toán
  - Actions: Chi tiết, Thanh toán

- **Filters:**
  - Nhân viên (Select với search)
  - Trạng thái (Select: Nháp/Đã thanh toán)
  - Tháng (Select 1-12)
  - Năm (Select 5 năm gần nhất)

- **Actions:**
  - Button "Tạo bảng lương" → Mở Generate Modal
  - Button "Chi tiết" → Mở Detail Modal
  - Button "Thanh toán" (chỉ hiện với status=Draft)

### 2. Generate Payroll Modal
**Features:**
- DatePicker chọn Month/Year
- Tự động tạo bảng lương cho TẤT CẢ nhân viên active
- Default: Tháng/năm hiện tại
- Lưu ý: Có thể chỉnh sửa sau khi tạo

### 3. PayrollDetailModal - Chi tiết Bảng lương
**Features:**
- **Thông tin nhân viên:**
  - Tên nhân viên
  - Tháng/Năm

- **Form chỉnh sửa lương:**
  - Lương cơ bản (InputNumber có format)
  - Thưởng (InputNumber có format)
  - Khấu trừ (InputNumber có format)
  - Ghi chú (TextArea)

- **Bảng chi tiết khoản mục (Items):**
  - Loại (Tag: Thu nhập/Khấu trừ)
  - Mã
  - Mô tả
  - Số tiền (có màu: xanh=thu nhập, đỏ=khấu trừ)
  - Actions: Sửa, Xóa
  - Button "Thêm khoản mục"

- **Tổng kết:**
  - Hiển thị công thức tính
  - Tổng thực lĩnh (highlighted lớn)

### 4. PaymentModal - Thanh toán lương
**Features:**
- Hiển thị thông tin nhân viên & số tiền
- Form thanh toán:
  - Phương thức (Select: Tiền mặt/Chuyển khoản/Ví điện tử)
  - Mã giao dịch (Input, optional)
  - Ghi chú (TextArea)
- Warning: Không thể chỉnh sửa sau khi thanh toán

### 5. PayrollItemModal - Thêm/Sửa khoản mục
**Features:**
- Radio: Loại (Thu nhập/Khấu trừ)
- Select: Mã khoản mục (có gợi ý common codes)
- TextArea: Mô tả (auto-fill từ common codes)
- InputNumber: Số tiền (có format)
- Common codes:
  - OVERTIME: Làm thêm giờ
  - PERFORMANCE: Thưởng hiệu suất
  - BONUS: Thưởng
  - ALLOWANCE: Phụ cấp
  - TAX: Thuế thu nhập
  - INSURANCE: Bảo hiểm
  - UNIFORM: Đồng phục
  - LATE_PENALTY: Phạt đi trễ

## 🔄 Workflows

### Flow 1: Tạo bảng lương mới
```
1. Click "Tạo bảng lương"
2. Chọn tháng/năm
3. Confirm → API generate
4. Hệ thống tạo bảng lương cho TẤT CẢ nhân viên active
5. Trạng thái mặc định: Nháp
6. Có thể xem chi tiết và chỉnh sửa
```

### Flow 2: Chỉnh sửa bảng lương
```
1. Click "Chi tiết" trên row
2. Modal hiển thị thông tin chi tiết
3. Chỉnh sửa base_salary, bonus, deductions
4. Thêm/sửa/xóa items (earnings/deductions)
5. Click "Cập nhật"
6. Tổng lương tự động tính lại
```

### Flow 3: Thanh toán lương
```
1. Click "Thanh toán" (chỉ với status=Draft)
2. Chọn phương thức thanh toán
3. Nhập mã giao dịch (optional)
4. Thêm ghi chú (optional)
5. Confirm → Status chuyển sang "Đã thanh toán"
6. Không thể chỉnh sửa sau đó
```

### Flow 4: Lọc và tìm kiếm
```
1. Chọn filters: Nhân viên, Status, Tháng, Năm
2. Click "Lọc"
3. URL params được update
4. Table tự động refetch data
5. Click "Reset" để xóa filters
```

## 🔧 API Endpoints

### Payroll APIs
```typescript
GET    /api/payrolls              // List với filters
GET    /api/payrolls/{id}         // Chi tiết với items
PUT    /api/payrolls/{id}         // Update
POST   /api/payrolls/generate     // Generate cho month/year
PATCH  /api/payrolls/{id}/status  // Update status
PATCH  /api/payrolls/{id}/pay     // Mark as paid
```

### PayrollItem APIs
```typescript
GET    /api/payroll-items         // List với filters
GET    /api/payroll-items/{id}    // Chi tiết
POST   /api/payroll-items         // Create
PUT    /api/payroll-items/{id}    // Update
DELETE /api/payroll-items/{id}    // Delete (auto recalculate)
```

## 📝 Query Parameters

### Payroll List
```typescript
{
  page?: string           // Page number
  per_page?: string       // Items per page (default: 15)
  employee_id?: string    // Filter by employee
  status?: string         // Filter by status (0=Draft, 1=Paid)
  month?: string          // Filter by month (1-12)
  year?: string           // Filter by year
}
```

## 🎯 Features Highlights

### ✅ Đã triển khai:
1. **CRUD đầy đủ cho Payroll**
   - Generate tự động
   - Update base/bonus/deductions
   - Update status
   - Mark as paid

2. **CRUD đầy đủ cho PayrollItems**
   - Add earnings/deductions
   - Edit amount/description
   - Delete và auto recalculate

3. **Filters & Search**
   - Filter theo employee, status, month, year
   - Pagination
   - URL params integration

4. **UI/UX**
   - Responsive table với scroll
   - Color coding (xanh=thu nhập, đỏ=khấu trừ)
   - Currency formatting (VND)
   - Status tags với màu
   - Icons rõ ràng
   - Loading states
   - Error handling

5. **Business Logic**
   - Auto calculate final_salary
   - Items recalculate khi CRUD
   - Status protection (không sửa khi đã paid)
   - Common payroll codes

### 🚀 Tính năng nâng cao có thể thêm:

1. **Tích hợp chấm công:**
   ```typescript
   // Tính lương tự động từ employee shifts
   - Fetch shifts của employee trong tháng
   - Tính tổng giờ làm từ check_in/check_out
   - Tính overtime hours
   - Auto generate bonus/deductions items
   ```

2. **Báo cáo & Analytics:**
   - Tổng lương theo tháng/năm
   - So sánh giữa các tháng
   - Top nhân viên theo lương
   - Export PDF/Excel

3. **Approval Workflow:**
   - Multi-level approval
   - Manager review trước khi thanh toán
   - Notification system

4. **Bulk Operations:**
   - Generate cho nhiều tháng
   - Bulk update lương cơ bản
   - Bulk payment

## 🧪 Testing Checklist

- [x] Generate payroll cho tháng/năm
- [x] View detail payroll
- [x] Update base_salary, bonus, deductions
- [x] Add/Edit/Delete payroll items
- [x] Mark as paid với payment details
- [x] Filter by employee, status, month, year
- [x] Pagination works
- [x] URL params sync
- [ ] Test với nhiều employees
- [ ] Test calculation accuracy
- [ ] Test permission/role-based access

## 🎨 Color Scheme

```typescript
Status Colors:
- Draft (Nháp): orange
- Paid (Đã thanh toán): green

Item Type Colors:
- Earning (Thu nhập): green
- Deduction (Khấu trừ): red

UI Colors:
- Primary action: blue-500
- Success/Payment: green-500
- Danger/Delete: red-500
- Neutral: gray-500
```

## 📞 Integration Points

### 1. Employee Module
```typescript
// Fetch active employees cho filters và generate
employeesAPI.getList({ is_active: "true", per_page: "1000" })
```

### 2. Employee Shifts Module (Future)
```typescript
// Tính lương từ chấm công
employeeShiftsAPI.getList({
  employee_id: "EMP123",
  date_from: "2025-10-01",
  date_to: "2025-10-31"
})
// → Calculate total hours
// → Calculate overtime
// → Auto generate items
```

## 🔐 Permissions (Future)

```typescript
Roles phù hợp:
- ADMIN: Full access
- MANAGER: View, Generate, Update, Mark as Paid
- HR: View, Generate, Update
- ACCOUNTANT: View, Mark as Paid
- EMPLOYEE: View own payroll only (read-only)
```

## 🐛 Known Issues & Solutions

1. **TypeScript import errors:**
   - Solution: Reload VS Code window hoặc restart TS server
   - File đã được tạo đúng nhưng TS chưa index

2. **InputNumber parser type error:**
   - Solution: Đã loại bỏ parser, chỉ dùng formatter
   - Ant Design InputNumber tự handle parsing

3. **Currency display:**
   - Solution: Dùng Intl.NumberFormat cho VND
   - Format: 1.000.000 ₫

## 📚 Documentation

API Documentation: `.github/PayrollAPI.txt`
Type Definitions: `src/Types/payroll.type.ts`
Constants: `PAYROLL_STATUS`, `PAYMENT_METHOD`, `ITEM_TYPE`, `COMMON_ITEM_CODES`

---

**Phát triển bởi:** Restaurant Management System  
**Ngày hoàn thành:** 2025-10-07  
**Version:** 1.0.0
