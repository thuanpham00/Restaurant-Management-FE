# Bảng Phân quyền (Permission Map)

## Giới thiệu

Permission Map là bảng ánh xạ giữa **Vai trò** (Roles) và **Quyền hạn** (Abilities). Mỗi vai trò có một danh sách quyền mặc định, được sử dụng khi backend không trả về permissions riêng.

## Cấu trúc

```typescript
// src/Authorization/permissionMap.ts
export const ROLE_PERMISSIONS: Record<AppRole, AppAbility[]> = {
  [AppRole.SUPER_ADMIN]: [...],
  [AppRole.ADMINISTRATOR]: [...],
  [AppRole.MANAGER]: [...],
  [AppRole.STAFF]: [...],
  [AppRole.CASHIER]: [...],
  [AppRole.KITCHEN_STAFF]: [...],
  [AppRole.WAITER]: [...],
}
```

## Chi tiết quyền theo vai trò

### 1. Super Administrator

**Mô tả**: Quyền cao nhất, toàn quyền quản lý hệ thống.

**Quyền hạn**: Tất cả abilities (38 quyền)

```typescript
[AppRole.SUPER_ADMIN]: ALL_ABILITIES
```

**Bao gồm**:
- ✅ Tất cả các quyền VIEW
- ✅ Tất cả các quyền MANAGE
- ✅ Quản lý vai trò và phân quyền
- ✅ Truy cập mọi module

**Use case**: CEO, CTO, System Admin

---

### 2. Administrator

**Mô tả**: Quản trị viên, có hầu hết quyền trừ quản lý ma trận phân quyền.

**Quyền hạn**: Tất cả abilities trừ `PERMISSION_MATRIX_MANAGE` (37 quyền)

```typescript
[AppRole.ADMINISTRATOR]: ALL_ABILITIES.filter(
  ability => ability !== AppAbility.PERMISSION_MATRIX_MANAGE
)
```

**Bao gồm**:
- ✅ Tất cả VIEW và MANAGE
- ✅ Quản lý vai trò (`ROLES_MANAGE`)
- ✅ Xem ma trận phân quyền (`PERMISSION_MATRIX_VIEW`)
- ❌ Không được sửa ma trận phân quyền

**Use case**: Admin nhà hàng, IT Manager

---

### 3. Manager

**Mô tả**: Quản lý nhà hàng, có quyền rộng về vận hành.

**Quyền hạn**: 32 quyền

```typescript
[AppRole.MANAGER]: [
  // Dashboard
  AppAbility.DASHBOARD_VIEW,
  
  // Quản lý Bàn & Đặt bàn
  AppAbility.TABLES_VIEW,
  AppAbility.TABLES_MANAGE,
  AppAbility.RESERVATIONS_VIEW,
  AppAbility.RESERVATIONS_MANAGE,
  
  // Khách hàng
  AppAbility.CUSTOMERS_VIEW,
  AppAbility.CUSTOMERS_MANAGE,
  
  // Nhân sự
  AppAbility.EMPLOYEES_VIEW,
  AppAbility.EMPLOYEES_MANAGE,
  AppAbility.SHIFTS_VIEW,
  AppAbility.SHIFTS_MANAGE,
  AppAbility.PAYROLL_VIEW,
  AppAbility.PAYROLL_MANAGE,
  
  // Menu
  AppAbility.MENU_CATEGORY_VIEW,
  AppAbility.MENU_CATEGORY_MANAGE,
  AppAbility.DISH_VIEW,
  AppAbility.DISH_MANAGE,
  AppAbility.MENU_VIEW,
  AppAbility.MENU_MANAGE,
  
  // Nguyên liệu & Kho
  AppAbility.INGREDIENTS_VIEW,
  AppAbility.INGREDIENTS_MANAGE,
  AppAbility.SUPPLIERS_VIEW,
  AppAbility.SUPPLIERS_MANAGE,
  AppAbility.WAREHOUSE_IMPORT_VIEW,
  AppAbility.WAREHOUSE_IMPORT_MANAGE,
  AppAbility.WAREHOUSE_EXPORT_VIEW,
  AppAbility.WAREHOUSE_EXPORT_MANAGE,
  AppAbility.WAREHOUSE_LOSS_VIEW,
  AppAbility.WAREHOUSE_LOSS_MANAGE,
  
  // Tài chính
  AppAbility.INVOICES_VIEW,
  AppAbility.INVOICES_MANAGE,
  AppAbility.PROMOTIONS_VIEW,
  AppAbility.PROMOTIONS_MANAGE,
]
```

**Bao gồm**:
- ✅ Toàn quyền về vận hành nhà hàng
- ✅ Quản lý nhân sự và lương
- ✅ Quản lý menu và kho
- ✅ Quản lý tài chính
- ❌ Không quản lý vai trò và phân quyền

**Use case**: Quản lý nhà hàng, General Manager

---

### 4. Staff

**Mô tả**: Nhân viên thông thường, chỉ xem thông tin.

**Quyền hạn**: 16 quyền (chỉ VIEW)

```typescript
[AppRole.STAFF]: [
  AppAbility.DASHBOARD_VIEW,
  AppAbility.TABLES_VIEW,
  AppAbility.RESERVATIONS_VIEW,
  AppAbility.CUSTOMERS_VIEW,
  AppAbility.EMPLOYEES_VIEW,
  AppAbility.SHIFTS_VIEW,
  AppAbility.MENU_CATEGORY_VIEW,
  AppAbility.DISH_VIEW,
  AppAbility.MENU_VIEW,
  AppAbility.INGREDIENTS_VIEW,
  AppAbility.SUPPLIERS_VIEW,
  AppAbility.WAREHOUSE_IMPORT_VIEW,
  AppAbility.WAREHOUSE_EXPORT_VIEW,
  AppAbility.WAREHOUSE_LOSS_VIEW,
  AppAbility.INVOICES_VIEW,
  AppAbility.PROMOTIONS_VIEW,
]
```

**Bao gồm**:
- ✅ Xem hầu hết thông tin
- ❌ Không quản lý gì cả

**Use case**: Nhân viên part-time, Thực tập sinh

---

### 5. Cashier (Thu ngân)

**Mô tả**: Quản lý khách hàng, hóa đơn, khuyến mãi.

**Quyền hạn**: 8 quyền

```typescript
[AppRole.CASHIER]: [
  AppAbility.DASHBOARD_VIEW,
  
  // Khách hàng
  AppAbility.CUSTOMERS_VIEW,
  AppAbility.CUSTOMERS_MANAGE,
  
  // Đặt bàn (chỉ xem)
  AppAbility.RESERVATIONS_VIEW,
  
  // Tài chính
  AppAbility.INVOICES_VIEW,
  AppAbility.INVOICES_MANAGE,
  AppAbility.PROMOTIONS_VIEW,
  AppAbility.PROMOTIONS_MANAGE,
]
```

**Bao gồm**:
- ✅ Quản lý khách hàng
- ✅ Tạo và quản lý hóa đơn
- ✅ Áp dụng khuyến mãi
- ✅ Xem đặt bàn
- ❌ Không quản lý menu, kho, nhân sự

**Use case**: Thu ngân, Front desk

---

### 6. Kitchen Staff (Nhân viên bếp)

**Mô tả**: Quản lý menu, nguyên liệu, kho.

**Quyền hạn**: 16 quyền

```typescript
[AppRole.KITCHEN_STAFF]: [
  AppAbility.DASHBOARD_VIEW,
  
  // Menu
  AppAbility.MENU_CATEGORY_VIEW,
  AppAbility.MENU_CATEGORY_MANAGE,
  AppAbility.DISH_VIEW,
  AppAbility.DISH_MANAGE,
  AppAbility.MENU_VIEW,
  AppAbility.MENU_MANAGE,
  
  // Nguyên liệu & Kho
  AppAbility.INGREDIENTS_VIEW,
  AppAbility.INGREDIENTS_MANAGE,
  AppAbility.SUPPLIERS_VIEW,
  AppAbility.WAREHOUSE_IMPORT_VIEW,
  AppAbility.WAREHOUSE_IMPORT_MANAGE,
  AppAbility.WAREHOUSE_EXPORT_VIEW,
  AppAbility.WAREHOUSE_EXPORT_MANAGE,
  AppAbility.WAREHOUSE_LOSS_VIEW,
  AppAbility.WAREHOUSE_LOSS_MANAGE,
]
```

**Bao gồm**:
- ✅ Quản lý menu và món ăn
- ✅ Quản lý nguyên liệu
- ✅ Nhập/xuất kho
- ✅ Ghi nhận hao hụt
- ✅ Xem nhà cung cấp
- ❌ Không quản lý nhân sự, tài chính

**Use case**: Chef, Inventory manager, Nhân viên kho

---

### 7. Waiter (Phục vụ)

**Mô tả**: Quản lý bàn, đặt bàn, xem menu.

**Quyền hạn**: 8 quyền

```typescript
[AppRole.WAITER]: [
  AppAbility.DASHBOARD_VIEW,
  
  // Bàn
  AppAbility.TABLES_VIEW,
  AppAbility.TABLES_MANAGE,
  
  // Đặt bàn
  AppAbility.RESERVATIONS_VIEW,
  AppAbility.RESERVATIONS_MANAGE,
  
  // Khách hàng (chỉ xem)
  AppAbility.CUSTOMERS_VIEW,
  
  // Menu (chỉ xem)
  AppAbility.MENU_VIEW,
  AppAbility.DISH_VIEW,
]
```

**Bao gồm**:
- ✅ Quản lý bàn (đổi trạng thái, ghép bàn)
- ✅ Quản lý đặt bàn
- ✅ Xem thông tin khách hàng
- ✅ Xem menu và món
- ❌ Không quản lý kho, tài chính, nhân sự

**Use case**: Phục vụ bàn, Tiếp tân

---

## Ma trận phân quyền đầy đủ

| Feature | Super Admin | Administrator | Manager | Staff | Cashier | Kitchen | Waiter |
|---------|:-----------:|:-------------:|:-------:|:-----:|:-------:|:-------:|:------:|
| **Dashboard** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Tables (View)** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| **Tables (Manage)** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| **Reservations (View)** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| **Reservations (Manage)** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| **Customers (View)** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| **Customers (Manage)** | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| **Employees (View)** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Employees (Manage)** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Shifts (View)** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Shifts (Manage)** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Payroll (View)** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Payroll (Manage)** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Menu Category (View)** | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| **Menu Category (Manage)** | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| **Dishes (View)** | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| **Dishes (Manage)** | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| **Menu (View)** | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| **Menu (Manage)** | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| **Ingredients (View)** | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| **Ingredients (Manage)** | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| **Suppliers (View)** | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| **Suppliers (Manage)** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Warehouse Import (View)** | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| **Warehouse Import (Manage)** | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| **Warehouse Export (View)** | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| **Warehouse Export (Manage)** | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| **Warehouse Loss (View)** | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| **Warehouse Loss (Manage)** | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| **Invoices (View)** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Invoices (Manage)** | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| **Promotions (View)** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Promotions (Manage)** | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| **Roles (View)** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Roles (Manage)** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Permission Matrix (View)** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Permission Matrix (Manage)** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

## Sử dụng Permission Map

### Lấy quyền mặc định

```typescript
import { getDefaultPermissionsForRole, AppRole } from "src/Authorization"

const managerPermissions = getDefaultPermissionsForRole(AppRole.MANAGER)
// Returns: AppAbility[]
```

### Trong useAuthorization hook

```typescript
// src/Authorization/useAuthorization.ts
const effectiveAbilities = useMemo(() => {
  // Nếu backend trả về permissions → dùng
  if (normalizedExplicitAbilities.length > 0) {
    return normalizedExplicitAbilities
  }
  // Nếu không → fallback về quyền mặc định
  return getDefaultPermissionsForRole(role)
}, [normalizedExplicitAbilities, role])
```

### Trong login flow

```typescript
// src/Admin/Pages/AdminLogin/AdminLogin.tsx
const resolvedRole = resolveRole(roleName)
const backendPermissions = user.role?.permissions?.map(p => p.code) ?? []
const fallbackPermissions = resolvedRole 
  ? getDefaultPermissionsForRole(resolvedRole) 
  : []

setPermissions(
  backendPermissions.length > 0 
    ? backendPermissions 
    : fallbackPermissions
)
```

## Override từ Backend

### Backend có permissions riêng

```json
{
  "user": {
    "role": { "name": "manager" },
    "permissions": [
      { "code": "dashboard:view" },
      { "code": "tables:view" },
      { "code": "tables:manage" }
    ]
  }
}
```

→ Hệ thống sẽ dùng 3 quyền từ backend, không dùng quyền mặc định của Manager.

### Backend không có permissions

```json
{
  "user": {
    "role": { "name": "manager" },
    "permissions": []
  }
}
```

→ Hệ thống sẽ fallback về 32 quyền mặc định của Manager.

## Thêm/Sửa Permission Map

### Thêm quyền cho role có sẵn

```typescript
export const ROLE_PERMISSIONS: Record<AppRole, AppAbility[]> = {
  [AppRole.WAITER]: [
    // ... existing
    AppAbility.INVOICES_VIEW,  // ✨ Cho phép Waiter xem hóa đơn
  ],
}
```

### Thêm role mới

```typescript
export const ROLE_PERMISSIONS: Record<AppRole, AppAbility[]> = {
  // ... existing roles
  
  [AppRole.DELIVERY]: [  // ✨ New role
    AppAbility.DASHBOARD_VIEW,
    AppAbility.INVOICES_VIEW,
    AppAbility.CUSTOMERS_VIEW,
  ],
}
```

### Sử dụng helper để giảm trùng lặp

```typescript
const COMMON_VIEW_ABILITIES = [
  AppAbility.DASHBOARD_VIEW,
  AppAbility.TABLES_VIEW,
  AppAbility.CUSTOMERS_VIEW,
]

export const ROLE_PERMISSIONS: Record<AppRole, AppAbility[]> = {
  [AppRole.STAFF]: unique([
    ...COMMON_VIEW_ABILITIES,
    AppAbility.EMPLOYEES_VIEW,
    // ...
  ]),
}
```

## Best Practices

### ✅ Nên làm

```typescript
// Dùng hàm helper
const permissions = getDefaultPermissionsForRole(role)

// Dùng unique() để tránh duplicate
const abilities = unique([...base, ...additional])

// Cho MANAGE → luôn có VIEW
[AppRole.CASHIER]: [
  AppAbility.INVOICES_VIEW,    // ✅ VIEW trước
  AppAbility.INVOICES_MANAGE,  // ✅ MANAGE sau
]
```

### ❌ Không nên làm

```typescript
// Không hard-code permission map trong component
const permissions = {
  manager: ["tables:view", "tables:manage"]  // ❌
}

// Không có MANAGE mà không có VIEW
[AppRole.WAITER]: [
  AppAbility.TABLES_MANAGE,  // ❌ Thiếu TABLES_VIEW
]

// Không duplicate abilities
[AppRole.STAFF]: [
  AppAbility.DASHBOARD_VIEW,
  AppAbility.DASHBOARD_VIEW,  // ❌ Duplicate
]
```

## FAQ

**Q: Tại sao cần permission map nếu backend đã trả về permissions?**  
A: Fallback cho trường hợp backend chưa cấu hình, hoặc đang dev/test.

**Q: Có thể override permission map cho từng user không?**  
A: Có, bằng cách backend trả về permissions riêng cho user đó.

**Q: Làm sao biết role nào cần ability nào?**  
A: Dựa vào business logic và quy trình làm việc thực tế của nhà hàng.

**Q: Có cần test permission map không?**  
A: Nên test ít nhất các role chính (Super Admin, Manager, Staff) để đảm bảo đúng logic.

---

**Xem thêm**:
- [Vai trò](./01-ROLES.md)
- [Quyền hạn](./02-ABILITIES.md)
- [Ví dụ](./07-EXAMPLES.md)
