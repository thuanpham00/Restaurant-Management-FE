# Ví dụ Thực tế

## 1. Quản lý Nguyên liệu (Ingredients)

### Scenario

Restaurant có các vai trò:
- **Manager**: Xem và quản lý nguyên liệu
- **Kitchen Staff**: Xem và quản lý nguyên liệu
- **Staff**: Chỉ xem nguyên liệu
- **Waiter**: Không có quyền

### Route Protection

```tsx
// src/Admin/Routes/useRouterAdmin.tsx
{
  path: path.AdminIngredients,
  element: (
    <Suspense>
      <PermissionBoundary ability={FEATURE_VIEW_ABILITY.ingredients}>
        <ManageIngredient />
      </PermissionBoundary>
    </Suspense>
  )
}
```

**Kết quả**:
- ✅ Manager, Kitchen Staff, Staff: Truy cập được
- ❌ Waiter: Redirect về dashboard

### Page Component

```tsx
// src/Admin/Pages/ManageIngredient/index.tsx
import { PermissionGate, FEATURE_MANAGE_ABILITY } from "src/Authorization"

export default function ManageIngredient() {
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Quản lý Nguyên liệu</h1>
        
        {/* Button "Thêm" chỉ hiện cho Manager và Kitchen Staff */}
        <PermissionGate ability={FEATURE_MANAGE_ABILITY.ingredients}>
          <button className="btn-primary">
            Thêm nguyên liệu
          </button>
        </PermissionGate>
      </div>
      
      {/* Danh sách luôn hiện (đã được bảo vệ ở route) */}
      <IngredientList />
    </div>
  )
}
```

**Kết quả**:
- ✅ Manager, Kitchen Staff: Thấy button "Thêm"
- ❌ Staff: Không thấy button

### List Component với Actions

```tsx
// components/IngredientList.tsx
import { useAuthorization, AppAbility } from "src/Authorization"

function IngredientList() {
  const { can } = useAuthorization()
  const canManage = can(AppAbility.INGREDIENTS_MANAGE)
  
  const columns = [
    { key: 'name', label: 'Tên nguyên liệu' },
    { key: 'quantity', label: 'Số lượng' },
    { key: 'unit', label: 'Đơn vị' },
    
    // Cột actions chỉ hiện khi có quyền
    ...(canManage ? [{
      key: 'actions',
      label: 'Thao tác',
      render: (item) => (
        <div className="flex gap-2">
          <button onClick={() => handleEdit(item)}>Sửa</button>
          <button onClick={() => handleDelete(item)}>Xóa</button>
        </div>
      )
    }] : [])
  ]
  
  return <Table columns={columns} data={ingredients} />
}
```

**Kết quả**:
- ✅ Manager, Kitchen Staff: Thấy cột "Thao tác" với buttons Sửa/Xóa
- ❌ Staff: Không thấy cột "Thao tác"

### Modal Create/Edit

```tsx
// components/IngredientModal.tsx
import { useAuthorization, AppAbility } from "src/Authorization"

function IngredientModal({ mode, item, onClose }) {
  const { can } = useAuthorization()
  const canManage = can(AppAbility.INGREDIENTS_MANAGE)
  
  const handleSubmit = () => {
    if (!canManage) {
      toast.error("Bạn không có quyền thực hiện hành động này")
      return
    }
    
    if (mode === 'create') {
      createIngredient(formData)
    } else {
      updateIngredient(item.id, formData)
    }
  }
  
  return (
    <Modal>
      <form onSubmit={handleSubmit}>
        <Input name="name" disabled={!canManage} />
        <Input name="quantity" disabled={!canManage} />
        <Input name="unit" disabled={!canManage} />
        
        {canManage && (
          <button type="submit">Lưu</button>
        )}
      </form>
    </Modal>
  )
}
```

---

## 2. Quản lý Menu

### Scenario

- **Manager**: Toàn quyền menu
- **Kitchen Staff**: Toàn quyền menu
- **Waiter**: Chỉ xem menu
- **Cashier**: Không truy cập

### Sidebar Menu

```tsx
// src/Admin/Components/Sidebar/Sidebar.tsx
const menuConfig = {
  menu: { 
    name: "Menu", 
    icon: BookOpen, 
    path: path.AdminMenu, 
    feature: "menu" 
  },
  dish: { 
    name: "Danh sách món", 
    icon: Ham, 
    path: path.AdminDish, 
    feature: "dishes" 
  },
  categoryDish: { 
    name: "Thể loại món", 
    icon: ClipboardList, 
    path: path.AdminCategoryDish, 
    feature: "menuCategory" 
  }
}

// Build menu "Quản lý Menu"
const menuChildren = buildMenuChildren(["categoryDish", "dish", "menu"])

if (menuChildren.length > 0) {
  items.push({
    key: "sub3",
    label: "Quản lý Menu",
    children: menuChildren
  })
}
```

**Kết quả**:
- ✅ Manager, Kitchen Staff, Waiter: Thấy section "Quản lý Menu"
- ❌ Cashier: Không thấy section

### Menu Page

```tsx
// src/Admin/Pages/ManageDished/Pages/ManageMenu.tsx
export default function ManageMenu() {
  const { can } = useAuthorization()
  
  return (
    <div>
      <h1>Quản lý Menu</h1>
      
      {/* List luôn hiện */}
      <MenuList />
      
      {/* Actions chỉ cho Manager và Kitchen Staff */}
      <PermissionGate ability={AppAbility.MENU_MANAGE}>
        <div className="flex gap-2 mt-4">
          <button>Thêm menu</button>
          <button>Import menu</button>
          <button>Export menu</button>
        </div>
      </PermissionGate>
    </div>
  )
}
```

**Kết quả**:
- ✅ Manager, Kitchen Staff: Thấy buttons thêm/import/export
- ❌ Waiter: Chỉ thấy danh sách, không có buttons

---

## 3. Quản lý Nhân viên

### Scenario

- **Super Admin**: Toàn quyền
- **Administrator**: Toàn quyền
- **Manager**: Toàn quyền
- **Staff**: Chỉ xem
- **Others**: Không truy cập

### Route

```tsx
{
  path: path.AdminStaff,
  element: (
    <Suspense>
      <PermissionBoundary ability={FEATURE_VIEW_ABILITY.staff}>
        <ManageEmployee />
      </PermissionBoundary>
    </Suspense>
  )
}
```

### Page với nhiều tabs

```tsx
// src/Admin/Pages/ManageEmployee/index.tsx
export default function ManageEmployee() {
  const { can } = useAuthorization()
  const canManage = can(AppAbility.EMPLOYEES_MANAGE)
  
  return (
    <div>
      <Tabs>
        {/* Tab danh sách */}
        <TabPanel value="list">
          <EmployeeList />
          
          {canManage && (
            <button>Thêm nhân viên</button>
          )}
        </TabPanel>
        
        {/* Tab lịch làm việc - chỉ xem */}
        <TabPanel value="schedule">
          <ScheduleView />
        </TabPanel>
        
        {/* Tab thống kê - chỉ manage */}
        {canManage && (
          <TabPanel value="statistics">
            <EmployeeStatistics />
          </TabPanel>
        )}
      </Tabs>
    </div>
  )
}
```

---

## 4. Dashboard

### Scenario

Tất cả roles đều xem được dashboard, nhưng nội dung khác nhau.

### Dashboard Component

```tsx
// src/Admin/Pages/ManageDashboard/index.tsx
export default function ManageDashboard() {
  const { can, canSome } = useAuthorization()
  
  return (
    <div className="grid grid-cols-12 gap-4">
      {/* Thống kê tổng quan - tất cả đều thấy */}
      <div className="col-span-12">
        <OverviewStats />
      </div>
      
      {/* Doanh thu - chỉ những người có quyền xem invoices */}
      <PermissionGate ability={AppAbility.INVOICES_VIEW}>
        <div className="col-span-6">
          <RevenueChart />
        </div>
      </PermissionGate>
      
      {/* Nhân sự - chỉ manager-level */}
      <PermissionGate anyAbility={[
        AppAbility.EMPLOYEES_VIEW,
        AppAbility.PAYROLL_VIEW
      ]}>
        <div className="col-span-6">
          <EmployeeStats />
        </div>
      </PermissionGate>
      
      {/* Kho - chỉ kitchen/manager */}
      <PermissionGate anyAbility={[
        AppAbility.INGREDIENTS_VIEW,
        AppAbility.WAREHOUSE_IMPORT_VIEW
      ]}>
        <div className="col-span-4">
          <InventoryAlert />
        </div>
      </PermissionGate>
      
      {/* Bàn - waiter/manager */}
      <PermissionGate ability={AppAbility.TABLES_VIEW}>
        <div className="col-span-4">
          <TableStatus />
        </div>
      </PermissionGate>
    </div>
  )
}
```

**Kết quả**:
- **Manager**: Thấy tất cả widgets
- **Cashier**: Thấy overview + doanh thu
- **Kitchen Staff**: Thấy overview + kho
- **Waiter**: Thấy overview + bàn
- **Staff**: Chỉ thấy overview

---

## 5. Bảng lương (Payroll)

### Scenario

- **Manager**: Xem và quản lý lương
- **Staff**: Chỉ xem lương của chính mình
- **Others**: Không truy cập

### Custom Permission Logic

```tsx
// src/Admin/Pages/ManagePayroll/index.tsx
export default function ManagePayroll() {
  const { can } = useAuthorization()
  const { employeeId } = useAppStore()
  
  const canView = can(AppAbility.PAYROLL_VIEW)
  const canManage = can(AppAbility.PAYROLL_MANAGE)
  
  // Query: Manager thấy tất cả, Staff chỉ thấy của mình
  const { data: payrolls } = useQuery({
    queryKey: ['payrolls'],
    queryFn: () => {
      if (canManage) {
        return payrollAPI.getAll()
      }
      if (canView && employeeId) {
        return payrollAPI.getByEmployee(employeeId)
      }
      return []
    }
  })
  
  return (
    <div>
      <h1>Bảng lương</h1>
      
      {/* Filters - chỉ cho Manager */}
      <PermissionGate ability={AppAbility.PAYROLL_MANAGE}>
        <PayrollFilters />
      </PermissionGate>
      
      <PayrollTable data={payrolls} />
      
      {/* Export - chỉ cho Manager */}
      <PermissionGate ability={AppAbility.PAYROLL_MANAGE}>
        <button>Export Excel</button>
      </PermissionGate>
    </div>
  )
}
```

---

## 6. Quản lý Vai trò & Phân quyền

### Scenario

- **Super Admin**: Toàn quyền, kể cả Permission Matrix
- **Administrator**: Quản lý roles, xem Permission Matrix
- **Others**: Không truy cập

### Routes

```tsx
// Roles
{
  path: path.AdminRoles,
  element: (
    <Suspense>
      <PermissionBoundary ability={FEATURE_VIEW_ABILITY.roles}>
        <ManageRoles />
      </PermissionBoundary>
    </Suspense>
  )
}

// Permission Matrix
{
  path: path.AdminPermissionMatrix,
  element: (
    <Suspense>
      <PermissionBoundary ability={FEATURE_VIEW_ABILITY.permissionMatrix}>
        <ManagePermissionMatrix />
      </PermissionBoundary>
    </Suspense>
  )
}
```

### ManageRoles Page

```tsx
export default function ManageRoles() {
  const { can } = useAuthorization()
  const canManage = can(AppAbility.ROLES_MANAGE)
  
  return (
    <div>
      <h1>Quản lý Vai trò</h1>
      
      {/* Danh sách vai trò */}
      <RolesList />
      
      {/* Actions - chỉ Super Admin và Administrator */}
      <PermissionGate ability={AppAbility.ROLES_MANAGE}>
        <div>
          <button>Thêm vai trò</button>
          <button>Import vai trò</button>
        </div>
      </PermissionGate>
    </div>
  )
}
```

### ManagePermissionMatrix Page

```tsx
export default function ManagePermissionMatrix() {
  const { can } = useAuthorization()
  const canManage = can(AppAbility.PERMISSION_MATRIX_MANAGE)
  
  return (
    <div>
      <h1>Ma trận Phân quyền</h1>
      
      {/* Matrix - read-only */}
      <PermissionMatrix editable={canManage} />
      
      {/* Save button - chỉ Super Admin */}
      <PermissionGate ability={AppAbility.PERMISSION_MATRIX_MANAGE}>
        <button>Lưu thay đổi</button>
      </PermissionGate>
    </div>
  )
}
```

**Kết quả**:
- ✅ Super Admin: Sửa được matrix
- ✅ Administrator: Chỉ xem matrix
- ❌ Others: Không truy cập

---

## 7. Multi-level Permissions

### Scenario: Warehouse

- **Manager**: Import, Export, Loss (toàn quyền)
- **Kitchen Staff**: Import, Export, Loss (toàn quyền)
- **Staff**: Chỉ xem
- **Others**: Không truy cập

### Sidebar

```tsx
const inventoryChildren = buildMenuChildren([
  "ingredients",
  "suppliers",
  "warehouseIn",
  "warehouseOut",
  "inventoryLoss"
])

if (inventoryChildren.length > 0) {
  items.push({
    key: "sub4",
    label: "Quản lý Nguyên liệu & kho",
    children: inventoryChildren
  })
}
```

### Warehouse Import Page

```tsx
export default function ManageStockImport() {
  const { can } = useAuthorization()
  
  return (
    <div>
      <h1>Nhập kho</h1>
      
      {/* Danh sách phiếu nhập */}
      <StockImportList />
      
      {/* Tạo phiếu nhập - chỉ Manager và Kitchen Staff */}
      <PermissionGate ability={AppAbility.WAREHOUSE_IMPORT_MANAGE}>
        <button>Tạo phiếu nhập</button>
      </PermissionGate>
    </div>
  )
}
```

---

## 8. Complex Conditional Rendering

### Scenario: Invoice Detail

- **Manager**: Toàn quyền
- **Cashier**: Tạo và chỉnh sửa invoice
- **Waiter**: Chỉ xem invoice của bàn mình phục vụ
- **Others**: Không truy cập

```tsx
export default function InvoiceDetail({ id }) {
  const { can, hasAnyRole } = useAuthorization()
  const { employeeId } = useAppStore()
  
  const { data: invoice } = useQuery(['invoice', id])
  
  // Check quyền phức tạp
  const canView = can(AppAbility.INVOICES_VIEW)
  const canManage = can(AppAbility.INVOICES_MANAGE)
  const isWaiter = hasAnyRole(AppRole.WAITER)
  const isOwnTable = invoice?.waiter_id === employeeId
  
  // Waiter chỉ xem invoice của bàn mình
  if (isWaiter && !isOwnTable) {
    return <div>Bạn không có quyền xem hóa đơn này</div>
  }
  
  if (!canView) {
    return <div>Không có quyền</div>
  }
  
  return (
    <div>
      <h1>Hóa đơn #{invoice.id}</h1>
      
      {/* Nội dung invoice */}
      <InvoiceContent data={invoice} />
      
      {/* Actions - chỉ Manager và Cashier */}
      <PermissionGate ability={AppAbility.INVOICES_MANAGE}>
        <div>
          <button>Chỉnh sửa</button>
          <button>In hóa đơn</button>
          <button>Gửi email</button>
        </div>
      </PermissionGate>
      
      {/* Refund - chỉ Manager */}
      <PermissionGate 
        ability={AppAbility.INVOICES_MANAGE}
        roles={AppRole.MANAGER}
      >
        <button>Hoàn tiền</button>
      </PermissionGate>
    </div>
  )
}
```

---

## 9. Form với Dynamic Fields

### Scenario: Employee Form

- **Manager**: Điền đầy đủ form, bao gồm salary
- **Staff**: Chỉ xem thông tin cơ bản

```tsx
export default function EmployeeForm({ mode, employee }) {
  const { can } = useAuthorization()
  const canManage = can(AppAbility.EMPLOYEES_MANAGE)
  
  return (
    <form>
      {/* Thông tin cơ bản - tất cả xem được */}
      <Input name="name" disabled={!canManage} />
      <Input name="email" disabled={!canManage} />
      <Input name="phone" disabled={!canManage} />
      
      {/* Lương - chỉ Manager xem và sửa */}
      <PermissionGate 
        ability={[AppAbility.EMPLOYEES_MANAGE, AppAbility.PAYROLL_VIEW]}
      >
        <Input 
          name="salary" 
          type="number"
          disabled={!canManage}
        />
      </PermissionGate>
      
      {/* Vai trò - chỉ Manager */}
      <PermissionGate ability={AppAbility.ROLES_VIEW}>
        <Select name="role" disabled={!canManage}>
          <option value="staff">Nhân viên</option>
          <option value="cashier">Thu ngân</option>
          <option value="kitchen_staff">Bếp</option>
          <option value="waiter">Phục vụ</option>
        </Select>
      </PermissionGate>
      
      {/* Submit */}
      {canManage && (
        <button type="submit">Lưu</button>
      )}
    </form>
  )
}
```

---

## 10. Real-world Sidebar

### Full Implementation

```tsx
export default function Sidebar() {
  const { can } = useAuthorization()
  
  const items: MenuItems = []
  
  // 1. Dashboard (tất cả)
  if (can(FEATURE_VIEW_ABILITY.dashboard)) {
    items.push({
      key: 'dashboard',
      label: <Link to={path.AdminDashboard}>Dashboard</Link>
    })
  }
  
  // 2. Quản lý bàn (Manager, Waiter)
  const tableItems = buildMenuChildren(['tables', 'reservations'])
  if (tableItems.length > 0) {
    items.push({
      key: 'tables',
      label: 'Quản lý Bàn',
      children: tableItems
    })
  }
  
  // 3. Khách hàng (Manager, Cashier, Waiter)
  if (can(FEATURE_VIEW_ABILITY.customers)) {
    items.push({
      key: 'customers',
      label: <Link to={path.AdminCustomers}>Khách hàng</Link>
    })
  }
  
  // 4. Nhân sự (Manager, Admin, Super Admin)
  const hrItems = buildMenuChildren(['staff', 'shifts', 'payroll'])
  if (hrItems.length > 0) {
    items.push({
      key: 'hr',
      label: 'Quản lý Nhân sự',
      children: hrItems
    })
  }
  
  // 5. Menu (Manager, Kitchen Staff, Waiter)
  const menuItems = buildMenuChildren(['categoryDish', 'dish', 'menu'])
  if (menuItems.length > 0) {
    items.push({
      key: 'menu',
      label: 'Quản lý Menu',
      children: menuItems
    })
  }
  
  // 6. Kho (Manager, Kitchen Staff)
  const warehouseItems = buildMenuChildren([
    'ingredients',
    'suppliers',
    'warehouseIn',
    'warehouseOut',
    'inventoryLoss'
  ])
  if (warehouseItems.length > 0) {
    items.push({
      key: 'warehouse',
      label: 'Nguyên liệu & Kho',
      children: warehouseItems
    })
  }
  
  // 7. Tài chính (Manager, Cashier)
  const financeItems = buildMenuChildren(['invoices', 'promotions'])
  if (financeItems.length > 0) {
    items.push({
      key: 'finance',
      label: 'Tài chính',
      children: financeItems
    })
  }
  
  // 8. Bảo mật (Super Admin, Admin)
  const securityItems = buildMenuChildren(['roles', 'permissionMatrix'])
  if (securityItems.length > 0) {
    items.push({
      key: 'security',
      label: 'Cấu hình & Bảo mật',
      children: securityItems
    })
  }
  
  return <Menu items={items} />
}
```

**Kết quả**:
- **Super Admin**: 8/8 sections
- **Manager**: 7/8 sections (trừ Permission Matrix manage)
- **Cashier**: 3/8 sections (Dashboard, Khách hàng, Tài chính)
- **Kitchen Staff**: 4/8 sections (Dashboard, Menu, Kho)
- **Waiter**: 3/8 sections (Dashboard, Bàn, Menu view)
- **Staff**: 1/8 sections (Dashboard)

---

## Summary

Các ví dụ trên minh họa:

✅ **Route protection** với PermissionBoundary  
✅ **Button/Action hiding** với PermissionGate  
✅ **Conditional rendering** với useAuthorization  
✅ **Dynamic menu** dựa trên quyền  
✅ **Form fields** hiển thị theo quyền  
✅ **Complex logic** kết hợp nhiều điều kiện  
✅ **Multi-level permissions** trong các section lớn  

**Nguyên tắc chung**:
- View = Xem được page/section
- Manage = Thêm/Sửa/Xóa actions
- Luôn guard API calls
- UI tự động điều chỉnh theo quyền

---

**Xem thêm**:
- [Components](./04-COMPONENTS.md)
- [Hooks](./05-HOOKS.md)
- [Tích hợp](./06-INTEGRATION.md)
