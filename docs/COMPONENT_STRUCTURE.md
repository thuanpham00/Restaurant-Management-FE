# 🧩 Component Structure

## 📋 Mục Lục
- [Tổng Quan](#tổng-quan)
- [Component Hierarchy](#component-hierarchy)
- [Shared Components](#shared-components)
- [Admin Components](#admin-components)
- [Client Components](#client-components)
- [Layout Components](#layout-components)
- [Component Patterns](#component-patterns)

---

## Tổng Quan

Hệ thống component được tổ chức theo kiến trúc **Feature-based** với các layer:

```
┌─────────────────────────────────────────────────────┐
│              Pages (Feature Modules)                │
│  - ManageDishes, ManageEmployees, etc.              │
│  - Full-page components                             │
└───────────────────┬─────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────┐
│              Layouts                                │
│  - MainLayoutAdmin, MainLayout                      │
│  - Page structure wrappers                          │
└───────────────────┬─────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────┐
│              Feature Components                     │
│  - DishForm, EmployeeCard, ShiftCalendar            │
│  - Feature-specific reusable components             │
└───────────────────┬─────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────┐
│              Shared Components                      │
│  - Button, Input, Table, Modal                      │
│  - Generic UI components                            │
└─────────────────────────────────────────────────────┘
```

---

## Component Hierarchy

### Directory Structure

```
src/
├── Components/              # 🔧 Shared Components (Global)
│   ├── ui/                 # Radix UI & Shadcn components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── calendar.tsx
│   │   ├── table.tsx
│   │   └── ...
│   ├── Button/             # Custom button variants
│   ├── Input/              # Custom input variants
│   └── InputFileImage/     # File upload component
│
├── Admin/                   # 🔐 Admin Portal
│   ├── Components/         # Admin-specific components
│   │   ├── HeaderAdmin/
│   │   │   └── HeaderAdmin.tsx
│   │   ├── Sidebar/
│   │   │   └── Sidebar.tsx
│   │   ├── SidebarItem/
│   │   │   └── SidebarItem.tsx
│   │   ├── NavigateBack/
│   │   │   └── NavigateBack.tsx
│   │   └── PermissionMatrix/
│   │       └── PermissionMatrix.tsx
│   │
│   ├── Layouts/            # Admin layouts
│   │   ├── MainLayoutAdmin/
│   │   │   └── MainLayoutAdmin.tsx
│   │   └── LayoutAuthAdmin/
│   │       └── LayoutAuthAdmin.tsx
│   │
│   └── Pages/              # Admin feature pages
│       ├── ManageDashboard/
│       ├── ManageTable/
│       ├── ManageDished/
│       ├── ManageEmployee/
│       ├── ManageShift/
│       ├── ManagePayroll/
│       ├── ManageIngredient/
│       └── ...
│
└── Client/                  # 🍽️ Client Portal
    ├── Components/         # Client-specific components
    ├── Layout/            # Client layouts
    └── Pages/             # Client pages
```

---

## Shared Components

### 1. **UI Components (Radix + Shadcn)**

Located in `src/Components/ui/`

```tsx
// Example: Button Component
// src/Components/ui/button.tsx

import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "src/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary text-white hover:bg-primary/90",
        destructive: "bg-red-500 text-white hover:bg-red-600",
        outline: "border border-gray-300 hover:bg-gray-100",
        ghost: "hover:bg-gray-100",
        link: "underline-offset-4 hover:underline"
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
        icon: "h-10 w-10"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)

export { Button, buttonVariants }
```

**Usage:**
```tsx
import { Button } from 'src/Components/ui/button'

<Button variant="default">Save</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline" size="sm">Cancel</Button>
```

### 2. **Custom Shared Components**

```tsx
// Example: InputFileImage Component
// src/Components/InputFileImage/InputFileImage.tsx

interface InputFileImageProps {
  value?: string | File
  onChange: (file: File | null) => void
  placeholder?: string
  accept?: string
}

export default function InputFileImage({
  value,
  onChange,
  placeholder = "Chọn ảnh",
  accept = "image/*"
}: InputFileImageProps) {
  const [preview, setPreview] = useState<string | null>(null)
  
  useEffect(() => {
    if (value instanceof File) {
      const url = URL.createObjectURL(value)
      setPreview(url)
      return () => URL.revokeObjectURL(url)
    } else if (typeof value === 'string') {
      setPreview(value)
    } else {
      setPreview(null)
    }
  }, [value])
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onChange(file)
    }
  }
  
  return (
    <div className="space-y-2">
      {preview && (
        <img 
          src={preview} 
          alt="Preview" 
          className="h-32 w-32 rounded object-cover"
        />
      )}
      <input
        type="file"
        accept={accept}
        onChange={handleChange}
        className="block w-full text-sm"
      />
    </div>
  )
}
```

---

## Admin Components

### 1. **Header Component**

```tsx
// src/Admin/Components/HeaderAdmin/HeaderAdmin.tsx

export default function HeaderAdmin() {
  const { nameUser, avatar, role } = useAppStore()
  const { can } = useAuthorization()
  
  return (
    <header className="flex h-16 items-center justify-between border-b px-6">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold">Restaurant Admin</h1>
      </div>
      
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <NotificationDropdown />
        
        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger>
            <div className="flex items-center gap-2">
              <Avatar>
                <AvatarImage src={avatar} />
                <AvatarFallback>{nameUser?.[0]}</AvatarFallback>
              </Avatar>
              <div className="text-left">
                <p className="text-sm font-medium">{nameUser}</p>
                <p className="text-xs text-gray-500">{role}</p>
              </div>
            </div>
          </DropdownMenuTrigger>
          
          <DropdownMenuContent>
            <DropdownMenuItem>
              <UserIcon className="mr-2 h-4 w-4" />
              Hồ sơ
            </DropdownMenuItem>
            <DropdownMenuItem>
              <SettingsIcon className="mr-2 h-4 w-4" />
              Cài đặt
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOutIcon className="mr-2 h-4 w-4" />
              Đăng xuất
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
```

### 2. **Sidebar Component**

```tsx
// src/Admin/Components/Sidebar/Sidebar.tsx

const menuItems = [
  {
    icon: LayoutDashboard,
    label: "Dashboard",
    path: path.AdminDashboard,
    ability: AppAbility.DASHBOARD_VIEW
  },
  {
    icon: Users,
    label: "Nhân viên",
    path: path.AdminStaff,
    ability: AppAbility.EMPLOYEES_VIEW
  },
  {
    icon: Calendar,
    label: "Ca làm việc",
    path: path.AdminShifts,
    ability: AppAbility.SHIFTS_VIEW
  },
  {
    icon: DollarSign,
    label: "Bảng lương",
    path: path.AdminPayroll,
    ability: AppAbility.PAYROLL_VIEW
  },
  // ... more items
]

export default function Sidebar() {
  const { can } = useAuthorization()
  const location = useLocation()
  
  return (
    <aside className="w-64 border-r bg-gray-50">
      <nav className="space-y-1 p-4">
        {menuItems.map((item) => {
          if (!can(item.ability)) return null
          
          const isActive = location.pathname === item.path
          
          return (
            <SidebarItem
              key={item.path}
              {...item}
              isActive={isActive}
            />
          )
        })}
      </nav>
    </aside>
  )
}
```

### 3. **Permission Gate Component**

```tsx
// src/Authorization/PermissionGate.tsx

interface PermissionGateProps {
  ability?: AppAbility | AppAbility[]
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function PermissionGate({ 
  ability, 
  children, 
  fallback = null 
}: PermissionGateProps) {
  const { can } = useAuthorization()
  
  if (!ability || can(ability)) {
    return <>{children}</>
  }
  
  return <>{fallback}</>
}
```

---

## Layout Components

### 1. **Admin Main Layout**

```tsx
// src/Admin/Layouts/MainLayoutAdmin/MainLayoutAdmin.tsx

export default function MainLayoutAdmin() {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <HeaderAdmin />
        
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-100 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
```

### 2. **Client Main Layout**

```tsx
// src/Client/Layout/MainLayout.tsx

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <ClientHeader />
      
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
      
      {/* Footer */}
      <ClientFooter />
    </div>
  )
}
```

---

## Component Patterns

### 1. **Container/Presenter Pattern**

```tsx
// Container Component (Logic)
function EmployeeListContainer() {
  const { data, isLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: employeesAPI.getList
  })
  
  const handleDelete = async (id: string) => {
    await employeesAPI.delete(id)
    queryClient.invalidateQueries(['employees'])
  }
  
  return (
    <EmployeeListPresenter
      employees={data?.data.data || []}
      isLoading={isLoading}
      onDelete={handleDelete}
    />
  )
}

// Presenter Component (UI)
interface EmployeeListPresenterProps {
  employees: Employee[]
  isLoading: boolean
  onDelete: (id: string) => void
}

function EmployeeListPresenter({
  employees,
  isLoading,
  onDelete
}: EmployeeListPresenterProps) {
  if (isLoading) return <LoadingSpinner />
  
  return (
    <div className="space-y-4">
      {employees.map(employee => (
        <EmployeeCard
          key={employee.id}
          employee={employee}
          onDelete={() => onDelete(employee.id)}
        />
      ))}
    </div>
  )
}
```

### 2. **Compound Component Pattern**

```tsx
// Card component with subcomponents
function Card({ children, className }: CardProps) {
  return (
    <div className={cn("rounded-lg border bg-white shadow", className)}>
      {children}
    </div>
  )
}

function CardHeader({ children, className }: CardHeaderProps) {
  return (
    <div className={cn("border-b p-4", className)}>
      {children}
    </div>
  )
}

function CardContent({ children, className }: CardContentProps) {
  return (
    <div className={cn("p-4", className)}>
      {children}
    </div>
  )
}

// Export as compound component
Card.Header = CardHeader
Card.Content = CardContent

// Usage
<Card>
  <Card.Header>
    <h2>Employee Details</h2>
  </Card.Header>
  <Card.Content>
    <p>Name: John Doe</p>
  </Card.Content>
</Card>
```

### 3. **Render Props Pattern**

```tsx
interface DataTableProps<T> {
  data: T[]
  renderRow: (item: T, index: number) => React.ReactNode
  renderEmpty?: () => React.ReactNode
}

function DataTable<T>({ data, renderRow, renderEmpty }: DataTableProps<T>) {
  if (data.length === 0) {
    return renderEmpty ? <>{renderEmpty()}</> : <EmptyState />
  }
  
  return (
    <table>
      <tbody>
        {data.map((item, index) => renderRow(item, index))}
      </tbody>
    </table>
  )
}

// Usage
<DataTable
  data={employees}
  renderRow={(employee) => (
    <tr key={employee.id}>
      <td>{employee.name}</td>
      <td>{employee.role}</td>
    </tr>
  )}
  renderEmpty={() => <p>Không có nhân viên nào</p>}
/>
```

### 4. **Custom Hook Pattern**

```tsx
// Custom hook for form handling
function useEmployeeForm(employeeId?: string) {
  const queryClient = useQueryClient()
  
  // Fetch existing employee
  const { data: employee } = useQuery({
    queryKey: ['employee', employeeId],
    queryFn: () => employeesAPI.getDetail(employeeId!),
    enabled: !!employeeId
  })
  
  // Form setup
  const form = useForm({
    resolver: yupResolver(employeeSchema),
    values: employee?.data.data
  })
  
  // Create mutation
  const createMutation = useMutation({
    mutationFn: employeesAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['employees'])
      toast.success('Tạo nhân viên thành công')
    }
  })
  
  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data) => employeesAPI.update(employeeId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['employees'])
      queryClient.invalidateQueries(['employee', employeeId])
      toast.success('Cập nhật thành công')
    }
  })
  
  const onSubmit = async (data) => {
    if (employeeId) {
      await updateMutation.mutateAsync(data)
    } else {
      await createMutation.mutateAsync(data)
    }
  }
  
  return {
    form,
    onSubmit: form.handleSubmit(onSubmit),
    isLoading: createMutation.isLoading || updateMutation.isLoading
  }
}

// Usage in component
function EmployeeForm({ employeeId }: { employeeId?: string }) {
  const { form, onSubmit, isLoading } = useEmployeeForm(employeeId)
  
  return (
    <form onSubmit={onSubmit}>
      {/* Form fields */}
      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Đang lưu...' : 'Lưu'}
      </Button>
    </form>
  )
}
```

### 5. **Higher-Order Component (HOC)**

```tsx
// HOC for permission checking
function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  ability: AppAbility
) {
  return function PermissionWrapper(props: P) {
    const { can } = useAuthorization()
    
    if (!can(ability)) {
      return <NoAccessPage />
    }
    
    return <Component {...props} />
  }
}

// Usage
const EmployeeManagementPage = withPermission(
  EmployeeManagement,
  AppAbility.EMPLOYEES_MANAGE
)
```

---

## 🔗 Component Best Practices

### 1. **Component Naming**

✅ **DO**: Use PascalCase and descriptive names
```tsx
EmployeeCard.tsx
DishForm.tsx
ShiftCalendar.tsx
```

❌ **DON'T**: Use vague names
```tsx
Card.tsx
Form.tsx
Calendar.tsx
```

### 2. **Props Interface**

✅ **DO**: Define explicit interface
```tsx
interface EmployeeCardProps {
  employee: Employee
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}
```

### 3. **Component Size**

✅ **DO**: Keep components small and focused
- Single responsibility
- Max 200-300 lines
- Extract reusable logic to hooks

### 4. **TypeScript**

✅ **DO**: Use proper typing
```tsx
const Button: React.FC<ButtonProps> = ({ children, ...props }) => {
  // ...
}
```

---

**Cập nhật lần cuối**: October 21, 2025
