# Tổng quan Hệ thống Phân quyền

## Giới thiệu

Hệ thống phân quyền (Authorization System) được xây dựng để kiểm soát quyền truy cập vào các tính năng và dữ liệu trong ứng dụng quản lý nhà hàng. Hệ thống cho phép:

- Phân quyền dựa trên **vai trò** (Role-Based Access Control - RBAC)
- Kiểm soát chi tiết đến từng **hành động** trên từng **tính năng**
- Bảo vệ **routes**, **components** và **UI elements**
- Xây dựng giao diện động dựa trên quyền hạn

## Kiến trúc

```
┌─────────────────────────────────────────────────────────┐
│                     Application Layer                    │
│  (Pages, Components, Routes)                            │
└───────────────────────┬─────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────┐
│              Authorization Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ PermissionGate│  │PermissionBnd │  │useAuthorization│
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└───────────────────────┬─────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────┐
│              Permission Logic Layer                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Roles      │  │  Abilities   │  │PermissionMap │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└───────────────────────┬─────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────┐
│                    Data Layer                            │
│              (Zustand Store + API)                       │
└─────────────────────────────────────────────────────────┘
```

## Các thành phần chính

### 1. **Roles (Vai trò)**
Định nghĩa các vai trò trong hệ thống:
- Super Administrator
- Administrator
- Manager
- Staff
- Cashier
- Kitchen Staff
- Waiter

📄 Chi tiết: [01-ROLES.md](./01-ROLES.md)

### 2. **Abilities (Quyền hạn)**
Định nghĩa các quyền hạn chi tiết theo định dạng `feature:action`:
- `dashboard:view`
- `tables:view`, `tables:manage`
- `employees:view`, `employees:manage`
- ...

📄 Chi tiết: [02-ABILITIES.md](./02-ABILITIES.md)

### 3. **Permission Map**
Ánh xạ mỗi vai trò với danh sách quyền mặc định của nó.

📄 Chi tiết: [03-PERMISSION-MAP.md](./03-PERMISSION-MAP.md)

### 4. **Components**
- `PermissionGate`: Ẩn/hiện UI elements
- `PermissionBoundary`: Bảo vệ routes/pages

📄 Chi tiết: [04-COMPONENTS.md](./04-COMPONENTS.md)

### 5. **Hooks**
- `useAuthorization()`: Hook chính để kiểm tra quyền

📄 Chi tiết: [05-HOOKS.md](./05-HOOKS.md)

## Luồng hoạt động

```
1. Đăng nhập
   └─> API trả về: { user: { role, permissions } }
       └─> Store lưu vào Zustand
           └─> resolveRole(rawRole) → AppRole
           └─> permissions code → AppAbility[]

2. Render UI
   └─> useAuthorization() đọc từ store
       └─> Tính toán effectiveAbilities
           ├─> Nếu có backend permissions → dùng
           └─> Nếu không → dùng default của role

3. Kiểm tra quyền
   └─> can(ability) → true/false
       └─> PermissionGate/PermissionBoundary quyết định render

4. Đăng xuất
   └─> Store.reset() → xóa permissions
```

## Vị trí trong source code

```
src/
├── Authorization/              # Core authorization system
│   ├── abilities.ts           # Định nghĩa abilities
│   ├── roles.ts               # Định nghĩa roles
│   ├── permissionMap.ts       # Mapping role → abilities
│   ├── featurePermissions.ts  # Mapping UI features → abilities
│   ├── useAuthorization.ts    # Hook chính
│   ├── PermissionGate.tsx     # Component ẩn/hiện
│   ├── PermissionBoundary.tsx # Component bảo vệ route
│   └── index.ts               # Export tất cả
│
├── StateGlobal/
│   └── zustand.tsx            # Store lưu role + permissions
│
├── Admin/
│   ├── Routes/
│   │   └── useRouterAdmin.tsx # Routes được bảo vệ
│   └── Components/
│       └── Sidebar/
│           └── Sidebar.tsx    # Menu động theo quyền
│
└── Client/
    └── Routes/
        └── useRouterClient.tsx # Block admin vào client
```

## Nguyên tắc thiết kế

1. **Tách biệt concerns**: Logic phân quyền tách biệt khỏi business logic
2. **Declarative**: Khai báo quyền cần thiết, không cần logic phức tạp
3. **Type-safe**: Sử dụng TypeScript enum để tránh lỗi chính tả
4. **Flexible**: Hỗ trợ override permissions từ backend
5. **Maintainable**: Dễ dàng thêm role/ability mới

## Lợi ích

✅ **Bảo mật**: Kiểm soát chặt chẽ quyền truy cập  
✅ **Linh hoạt**: Dễ dàng thay đổi quyền mà không sửa code  
✅ **Trải nghiệm tốt**: UI tự động điều chỉnh theo quyền  
✅ **Dễ bảo trì**: Code rõ ràng, dễ hiểu  
✅ **Scalable**: Dễ dàng mở rộng khi thêm tính năng mới  

## Tài liệu chi tiết

1. [Vai trò (Roles)](./01-ROLES.md)
2. [Quyền hạn (Abilities)](./02-ABILITIES.md)
3. [Bảng phân quyền (Permission Map)](./03-PERMISSION-MAP.md)
4. [Components](./04-COMPONENTS.md)
5. [Hooks](./05-HOOKS.md)
6. [Tích hợp (Integration)](./06-INTEGRATION.md)
7. [Ví dụ (Examples)](./07-EXAMPLES.md)
8. [Mở rộng (Extension)](./08-EXTENSION.md)

---

**Cập nhật lần cuối**: 19/10/2025  
**Version**: 1.0.0
