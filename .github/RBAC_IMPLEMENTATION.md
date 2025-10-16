# Hệ thống Quản lý Vai trò và Phân quyền (RBAC)

## 📋 Tổng quan

Hệ thống RBAC (Role-Based Access Control) cho phép quản lý vai trò và quyền hạn của người dùng trong hệ thống nhà hàng.

---

## 🏗️ Kiến trúc hệ thống

### 1. **Types** (Định nghĩa kiểu dữ liệu)

#### `permissions.type.ts`
```typescript
Permission {
  id: string
  code: string          // VD: "dishes.create", "users.edit"
  name: string          // VD: "Tạo món ăn"
  description: string
  is_active: boolean
  created_at: string
  updated_at: string
}
```

#### `user.type.ts` (Cập nhật)
```typescript
Role {
  id: string
  name: string          // VD: "Quản lý kho"
  description: string
  is_active: boolean
  permissions?: Permission[]  // Danh sách quyền
  created_at: string
  updated_at: string
}
```

### 2. **API Layer**

#### `permissions.api.ts`
- `getList()` - Lấy danh sách quyền (có phân trang, tìm kiếm)
- `getDetail(id)` - Lấy chi tiết quyền
- `getRoles(id)` - Lấy danh sách vai trò có quyền này

#### `roles.api.ts` (Mở rộng)
- `getList()` - Lấy danh sách vai trò (có phân trang, filter)
- `getDetail(id)` - Lấy chi tiết vai trò với danh sách quyền
- `create()` - Tạo vai trò mới
- `update(id)` - Cập nhật thông tin vai trò
- `delete(id)` - Xóa vai trò
- `getPermissions(id)` - Lấy quyền của vai trò
- `assignPermissions(id, permission_ids)` - Gán quyền cho vai trò
- `removePermissions(id, permission_ids)` - Xóa quyền khỏi vai trò
- `syncPermissions(id, permission_ids)` - **Đồng bộ quyền** (thay thế toàn bộ)
- `getUsers(id)` - Lấy danh sách người dùng có vai trò này

### 3. **Components**

#### `PermissionMatrix` - Ma trận Phân quyền ⭐
**Vị trí**: `src/Admin/Components/PermissionMatrix/`

**Chức năng**:
- Hiển thị ma trận quyền: Vai trò (hàng) × Quyền (cột)
- Toggle quyền bằng checkbox
- Nhóm quyền theo module (VD: dishes.*, users.*)
- Loading state cho từng cell khi cập nhật
- Disable checkbox cho vai trò/quyền không hoạt động

**Logic quan trọng**:
```typescript
// 1. Group permissions by module
const groupedPermissions = permissions.reduce((acc, permission) => {
  const module = permission.code.split(".")[0]  // "dishes.create" → "dishes"
  if (!acc[module]) acc[module] = []
  acc[module].push(permission)
  return acc
}, {})

// 2. Toggle permission
const handlePermissionToggle = (role, permissionId, checked) => {
  const currentIds = role.permissions?.map(p => p.id) || []
  const newIds = checked 
    ? [...currentIds, permissionId]      // Add
    : currentIds.filter(id => id !== permissionId)  // Remove
  
  // Sync all permissions
  await syncPermissionsMutation.mutateAsync({
    roleId: role.id,
    permissionIds: newIds
  })
}
```

### 4. **Pages**

#### `ManageRoles` - Quản lý Vai trò
**Vị trí**: `src/Admin/Pages/ManageRoles/`

**Features**:
- ✅ Danh sách vai trò với phân trang
- ✅ Filter theo tên, trạng thái
- ✅ Tạo vai trò mới (với chọn quyền)
- ✅ Chỉnh sửa vai trò (tên, mô tả, trạng thái, quyền)
- ✅ Xóa vai trò (có xác nhận)
- ✅ Xem chi tiết vai trò (thông tin + danh sách quyền)
- ✅ **Toggle hiển thị Ma trận phân quyền**

**UI Components**:
- Table: Hiển thị danh sách vai trò
- Modal Create: Form tạo vai trò mới
- Modal Edit: Form sửa vai trò
- Modal Detail: Hiển thị chi tiết vai trò
- Filter Card: Bộ lọc tìm kiếm
- Button Toggle: Chuyển đổi giữa Table view và Matrix view

#### `ManagePermissions` - Quản lý Quyền
**Vị trí**: `src/Admin/Pages/ManagePermissions/`

**Features**:
- ✅ Danh sách quyền với phân trang
- ✅ Tìm kiếm theo tên/mã quyền
- ✅ Xem chi tiết quyền
- ✅ Xem danh sách vai trò có quyền này

**Lưu ý**: Quyền thường được quản lý ở backend, frontend chỉ xem và assign cho vai trò.

---

## 🔄 Luồng hoạt động

### 1. **Tạo vai trò mới**
```
User nhập form → handleCreate() → rolesAPI.create(data) → 
Invalidate cache → Reload danh sách vai trò
```

### 2. **Cập nhật quyền cho vai trò**

**Cách 1: Qua Form Edit**
```
User chọn permissions → handleUpdate() → 
rolesAPI.update(id, basicInfo) + rolesAPI.syncPermissions(id, permissionIds) →
Invalidate cache
```

**Cách 2: Qua Ma trận (Recommended)**
```
User click checkbox → handlePermissionToggle() →
Tính toán permissionIds mới → rolesAPI.syncPermissions() →
Update UI ngay lập tức
```

### 3. **Xem thông tin vai trò**
```
User click "Xem" → Open modal → rolesAPI.getDetail(id) →
Hiển thị thông tin + danh sách quyền
```

---

## 📊 Tính năng nổi bật

### Ma trận Phân quyền (Permission Matrix)

**Ưu điểm**:
1. **Trực quan**: Nhìn thấy toàn bộ quyền của tất cả vai trò trong 1 view
2. **Nhanh chóng**: Toggle quyền chỉ với 1 click
3. **Nhóm theo module**: Quyền được nhóm theo chức năng (dishes, users, inventory...)
4. **Real-time**: Cập nhật ngay lập tức khi toggle
5. **Loading state**: Hiển thị loading cho từng cell đang cập nhật

**Cấu trúc bảng**:
```
┌─────────────────┬───────────┬───────────┬───────────┐
│ Quyền / Vai trò │ Admin     │ Manager   │ Staff     │
├─────────────────┼───────────┼───────────┼───────────┤
│ DISHES (Module) │           │           │           │
├─────────────────┼───────────┼───────────┼───────────┤
│ Create Dishes   │ ☑         │ ☑         │ ☐         │
│ Edit Dishes     │ ☑         │ ☑         │ ☐         │
│ Delete Dishes   │ ☑         │ ☐         │ ☐         │
├─────────────────┼───────────┼───────────┼───────────┤
│ USERS (Module)  │           │           │           │
├─────────────────┼───────────┼───────────┼───────────┤
│ Create Users    │ ☑         │ ☐         │ ☐         │
│ Edit Users      │ ☑         │ ☐         │ ☐         │
└─────────────────┴───────────┴───────────┴───────────┘
```

---

## 🔧 API Endpoints

### Roles
```
GET    /api/roles                          // List roles
POST   /api/roles                          // Create role
GET    /api/roles/{id}                     // Get role detail
PUT    /api/roles/{id}                     // Update role
DELETE /api/roles/{id}                     // Delete role
GET    /api/roles/{id}/permissions         // Get role permissions
POST   /api/roles/{id}/permissions         // Assign permissions
DELETE /api/roles/{id}/permissions         // Remove permissions
PUT    /api/roles/{id}/permissions/sync    // Sync permissions ⭐
GET    /api/roles/{id}/users               // Get role users
```

### Permissions
```
GET    /api/permissions                    // List permissions
GET    /api/permissions/{id}               // Get permission detail
GET    /api/permissions/{id}/roles         // Get permission roles
```

---

## 🎯 Best Practices

### 1. Sử dụng Sync API cho Ma trận
**Tại sao?**
- Ma trận cần replace toàn bộ permissions, không phải add/remove từng cái
- Đảm bảo consistency
- Đơn giản hơn so với việc tính toán diff

```typescript
// ✅ GOOD: Dùng sync
await rolesAPI.syncPermissions(roleId, newPermissionIds)

// ❌ BAD: Phức tạp và dễ lỗi
const toAdd = newIds.filter(id => !oldIds.includes(id))
const toRemove = oldIds.filter(id => !newIds.includes(id))
await rolesAPI.assignPermissions(roleId, toAdd)
await rolesAPI.removePermissions(roleId, toRemove)
```

### 2. Invalidate Cache đúng cách
```typescript
onSuccess: () => {
  // Invalidate tất cả queries liên quan
  queryClient.invalidateQueries({ queryKey: ["listRoles"] })
  queryClient.invalidateQueries({ queryKey: ["role-detail"] })
  queryClient.invalidateQueries({ queryKey: ["roles-matrix"] })
}
```

### 3. Loading States
```typescript
// Per-cell loading trong matrix
const [loadingCells, setLoadingCells] = useState<Set<string>>(new Set())
const cellKey = `${roleId}-${permissionId}`

// Add to loading
setLoadingCells(prev => new Set(prev).add(cellKey))

// Remove from loading
setLoadingCells(prev => {
  const newSet = new Set(prev)
  newSet.delete(cellKey)
  return newSet
})
```

### 4. Disable Logic
```typescript
// Disable checkbox nếu vai trò hoặc quyền không hoạt động
<Checkbox 
  disabled={!role.is_active || !permission.is_active}
/>
```

---

## 🚀 Navigation

### Sidebar Menu Structure
```
Cấu hình & bảo mật
├── Quản lý người dùng (AdminUsers)
├── Quản lý vai trò (AdminRoles) ⭐ NEW
└── Quản lý quyền hệ thống (AdminPermissions) ⭐ NEW
```

### Routes
```typescript
path.AdminRoles = "/admin/roles"
path.AdminPermissions = "/admin/permissions"
```

---

## 📝 Checklist hoàn thành

- [x] Types: Permission, Role (extended)
- [x] API: permissions.api.ts, roles.api.ts (extended)
- [x] Component: PermissionMatrix
- [x] Page: ManageRoles
- [x] Page: ManagePermissions
- [x] Routes: Thêm routes cho /admin/roles và /admin/permissions
- [x] Sidebar: Menu items đã có sẵn
- [x] Features:
  - [x] CRUD vai trò
  - [x] Xem danh sách quyền
  - [x] Ma trận phân quyền
  - [x] Toggle quyền real-time
  - [x] Filter & pagination
  - [x] Modal detail views

---

## 🎨 UI/UX Features

1. **Table View** (Danh sách vai trò):
   - Pagination
   - Filter theo tên, trạng thái
   - Actions: Xem, Sửa, Xóa

2. **Matrix View** (Ma trận phân quyền):
   - Sticky header (role names)
   - Sticky left column (permission names)
   - Module grouping với header màu xanh
   - Checkbox toggle
   - Loading spinner per cell

3. **Modals**:
   - Create: Form + permission selector
   - Edit: Form + permission selector
   - Detail: Descriptions + permission cards

4. **Responsive**:
   - Grid layout cho filters
   - Horizontal scroll cho table/matrix
   - Mobile-friendly modals

---

## 💡 Tips cho Developer

1. **Debugging**: Check React Query DevTools để xem cache state
2. **Performance**: Matrix load tất cả data, nên limit ở mức ~100 roles/permissions
3. **Backend sync**: Đảm bảo backend trả về đúng structure như API docs
4. **Permission codes**: Nên theo format `module.action` (VD: `dishes.create`)
5. **Testing**: Test với role không có quyền nào, role có tất cả quyền

---

## 🔐 Security Notes

- Frontend chỉ hiển thị UI, backend vẫn cần validate permissions
- Không tin tưởng role/permission từ client side
- Check `is_active` status trước khi cho phép actions
- Log mọi thay đổi về permissions (backend)

---

Hệ thống đã sẵn sàng! 🎉
