# 🗄️ State Management

## 📋 Mục Lục
- [Tổng Quan](#tổng-quan)
- [Zustand Store](#zustand-store)
- [React Query](#react-query)
- [Form State](#form-state)
- [Best Practices](#best-practices)

---

## Tổng Quan

Hệ thống sử dụng **hybrid state management** approach với 3 layers:

```
┌─────────────────────────────────────────────────────┐
│              Application State                      │
│  ┌───────────────────────────────────────────┐     │
│  │  Zustand Store (Global Client State)      │     │
│  │  - Authentication                         │     │
│  │  - User Profile                           │     │
│  │  - UI State (sidebar, modals)             │     │
│  └───────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│              Server State                           │
│  ┌───────────────────────────────────────────┐     │
│  │  React Query (Server Cache)               │     │
│  │  - API Data Fetching                      │     │
│  │  - Caching & Synchronization              │     │
│  │  - Optimistic Updates                     │     │
│  │  - Real-time Queries                      │     │
│  └───────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│              Form State                             │
│  ┌───────────────────────────────────────────┐     │
│  │  React Hook Form                          │     │
│  │  - Form Data                              │     │
│  │  - Validation                             │     │
│  │  - Field State                            │     │
│  └───────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────┘
```

---

## Zustand Store

### 1. **Store Structure**

```typescript
// src/StateGlobal/zustand.tsx

type State = {
  // Authentication State
  isAuthenticated: boolean
  nameUser: string | null
  role: string | null
  avatar: string | null
  userId: string | null
  employeeId: string | null
  
  // UI State
  isShowCategory: boolean
}

type Actions = {
  setIsAuthenticated: (value: boolean) => void
  setNameUser: (value: string | null) => void
  setRole: (value: string | null) => void
  setAvatar: (value: string | null) => void
  setUserId: (value: string | null) => void
  setEmployeeId: (value: string | null) => void
  setIsShowCategory: (value: boolean) => void
  reset: () => void
}

export const useAppStore = create<State & Actions>((set) => ({
  // Initial State from LocalStorage
  isAuthenticated: Boolean(getAccessTokenFromLS()),
  nameUser: getNameUserFromLS(),
  role: getRoleFromLS(),
  avatar: getAvatarImageFromLS(),
  userId: getUserIdFromLS(),
  employeeId: getEmployeeIdFromLS(),
  isShowCategory: false,
  
  // Actions
  setIsAuthenticated: (value) => set({ isAuthenticated: value }),
  setNameUser: (value) => set({ nameUser: value }),
  setRole: (value) => set({ role: value }),
  setAvatar: (value) => set({ avatar: value }),
  setUserId: (value) => set({ userId: value }),
  setEmployeeId: (value) => set({ employeeId: value }),
  setIsShowCategory: (value) => set({ isShowCategory: value }),
  
  // Reset all state (on logout)
  reset: () => set({
    isAuthenticated: false,
    nameUser: null,
    role: null,
    avatar: null,
    userId: null,
    employeeId: null,
    isShowCategory: false
  })
}))
```

### 2. **Usage Patterns**

#### Access State

```tsx
import { useAppStore } from 'src/StateGlobal/zustand'

function Header() {
  // Subscribe to specific state slices
  const { isAuthenticated, nameUser, avatar } = useAppStore()
  
  // Or use selector for better performance
  const nameUser = useAppStore((state) => state.nameUser)
  
  return (
    <div>
      {isAuthenticated && (
        <div>
          <img src={avatar} alt={nameUser} />
          <span>{nameUser}</span>
        </div>
      )}
    </div>
  )
}
```

#### Update State

```tsx
function LoginForm() {
  const { setIsAuthenticated, setNameUser, setRole } = useAppStore()
  
  const handleLoginSuccess = (userData) => {
    setIsAuthenticated(true)
    setNameUser(userData.name)
    setRole(userData.role.name)
    setAvatar(userData.avatar)
    setUserId(userData.id)
  }
}
```

#### Reset State on Logout

```tsx
function LogoutButton() {
  const reset = useAppStore((state) => state.reset)
  
  const handleLogout = async () => {
    await authAPI.logout()
    reset() // Clear all Zustand state
    clearLS() // Clear localStorage
  }
}
```

### 3. **State Synchronization**

Zustand store được đồng bộ với LocalStorage:

```
┌─────────────────────────────────────────────────┐
│              Initial Load                       │
│  localStorage → Zustand Store → UI              │
└─────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────┐
│              Login Success                      │
│  API Response → localStorage & Zustand → UI     │
└─────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────┐
│              Cross-Tab Sync                     │
│  Tab 1 Logout → Event → Tab 2 Reset Store       │
└─────────────────────────────────────────────────┘
```

```tsx
// src/App.tsx - Listen to cross-tab logout events
useEffect(() => {
  LocalStorageEventTarget.addEventListener('ClearLS', reset)
  return () => {
    LocalStorageEventTarget.removeEventListener('ClearLS', reset)
  }
}, [reset])
```

---

## React Query

### 1. **Configuration**

```tsx
// src/main.tsx
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,  // Don't refetch on window focus
      retry: 0                      // Don't retry failed requests
    }
  }
})

// Wrap app
<QueryClientProvider client={queryClient}>
  <App />
</QueryClientProvider>
```

### 2. **Query Patterns**

#### Basic Query

```tsx
import { useQuery } from '@tanstack/react-query'
import { dishesAPI } from 'src/Apis/Admin'

function DishList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dishes'],
    queryFn: () => dishesAPI.getAll()
  })
  
  if (isLoading) return <Loading />
  if (error) return <Error message={error.message} />
  
  return (
    <div>
      {data?.data.data.map(dish => (
        <DishCard key={dish.id} dish={dish} />
      ))}
    </div>
  )
}
```

#### Query with Parameters

```tsx
function EmployeeDetail({ employeeId }: { employeeId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['employee', employeeId],
    queryFn: () => employeesAPI.getById(employeeId),
    enabled: !!employeeId  // Only run if employeeId exists
  })
  
  return <div>{data?.data.data.name}</div>
}
```

#### Paginated Query

```tsx
function IngredientList() {
  const [page, setPage] = useState(1)
  
  const { data, isLoading } = useQuery({
    queryKey: ['ingredients', { page }],
    queryFn: () => ingredientsAPI.getAll({ page, limit: 20 }),
    keepPreviousData: true  // Keep old data while fetching new
  })
  
  return (
    <div>
      <Table data={data?.data.data} />
      <Pagination 
        current={page} 
        total={data?.data.total}
        onChange={setPage}
      />
    </div>
  )
}
```

### 3. **Mutation Patterns**

#### Basic Mutation

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query'

function CreateDishForm() {
  const queryClient = useQueryClient()
  
  const createMutation = useMutation({
    mutationFn: (newDish) => dishesAPI.create(newDish),
    onSuccess: () => {
      // Invalidate and refetch dishes list
      queryClient.invalidateQueries({ queryKey: ['dishes'] })
      toast.success('Tạo món ăn thành công!')
    },
    onError: (error) => {
      toast.error(error.message)
    }
  })
  
  const handleSubmit = (formData) => {
    createMutation.mutate(formData)
  }
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button 
        type="submit" 
        disabled={createMutation.isLoading}
      >
        {createMutation.isLoading ? 'Đang tạo...' : 'Tạo món ăn'}
      </button>
    </form>
  )
}
```

#### Optimistic Update

```tsx
function UpdateEmployeeStatus() {
  const queryClient = useQueryClient()
  
  const updateMutation = useMutation({
    mutationFn: ({ id, status }) => employeesAPI.updateStatus(id, status),
    
    // Optimistic update
    onMutate: async ({ id, status }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['employees'] })
      
      // Snapshot previous value
      const previousEmployees = queryClient.getQueryData(['employees'])
      
      // Optimistically update
      queryClient.setQueryData(['employees'], (old) => {
        return {
          ...old,
          data: old.data.map(emp => 
            emp.id === id ? { ...emp, status } : emp
          )
        }
      })
      
      // Return rollback function
      return { previousEmployees }
    },
    
    // Rollback on error
    onError: (err, variables, context) => {
      queryClient.setQueryData(['employees'], context.previousEmployees)
      toast.error('Cập nhật thất bại')
    },
    
    // Always refetch after error or success
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
    }
  })
}
```

### 4. **Real-time Query Hook**

Custom hook cho dữ liệu cần cập nhật real-time:

```tsx
// src/Hook/useRealtimeQuery.tsx
export function useRealtimeQuery(queryKey, queryFn, options) {
  return useQuery({
    queryKey,
    queryFn,
    
    // Real-time configuration
    staleTime: 0,                    // Always stale
    gcTime: 0,                       // Don't cache
    refetchOnMount: "always",        // Always refetch on mount
    refetchOnReconnect: true,        // Refetch on network reconnect
    refetchInterval: options?.refetchInterval,
    
    ...options
  })
}

// Usage
function TableSessionDetail({ sessionId }) {
  const { data } = useRealtimeQuery(
    ['tableSession', sessionId],
    () => tableSessionAPI.getById(sessionId),
    { refetchInterval: 10000 }  // Refetch every 10s
  )
  
  return <SessionInfo session={data?.data.data} />
}
```

### 5. **Query Invalidation Strategies**

```tsx
// 1. Invalidate specific query
queryClient.invalidateQueries({ queryKey: ['dishes'] })

// 2. Invalidate with parameters
queryClient.invalidateQueries({ queryKey: ['dish', dishId] })

// 3. Invalidate multiple related queries
queryClient.invalidateQueries({ queryKey: ['dishes'] })
queryClient.invalidateQueries({ queryKey: ['menu'] })

// 4. Invalidate with predicate
queryClient.invalidateQueries({
  predicate: (query) => query.queryKey[0] === 'dishes'
})

// 5. Remove query from cache
queryClient.removeQueries({ queryKey: ['dish', dishId] })

// 6. Reset all queries
queryClient.resetQueries()
```

---

## Form State

### 1. **React Hook Form Setup**

```tsx
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'

const schema = yup.object({
  name: yup.string().required('Tên là bắt buộc'),
  email: yup.string().email('Email không hợp lệ').required('Email là bắt buộc'),
  phone: yup.string().matches(/^[0-9]+$/, 'Số điện thoại không hợp lệ'),
  role_id: yup.string().required('Vui lòng chọn vai trò')
})

function EmployeeForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      role_id: ''
    }
  })
  
  const onSubmit = async (data) => {
    try {
      await employeesAPI.create(data)
      toast.success('Tạo nhân viên thành công')
      reset()
    } catch (error) {
      toast.error(error.message)
    }
  }
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name')} />
      {errors.name && <span>{errors.name.message}</span>}
      
      <input {...register('email')} />
      {errors.email && <span>{errors.email.message}</span>}
      
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Đang lưu...' : 'Lưu'}
      </button>
    </form>
  )
}
```

### 2. **Form + React Query Integration**

```tsx
function EditDishForm({ dishId }: { dishId: string }) {
  const queryClient = useQueryClient()
  
  // Fetch existing data
  const { data: dish } = useQuery({
    queryKey: ['dish', dishId],
    queryFn: () => dishesAPI.getById(dishId)
  })
  
  const form = useForm({
    resolver: yupResolver(schema),
    values: dish?.data.data  // Auto-populate when data loads
  })
  
  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data) => dishesAPI.update(dishId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dishes'] })
      queryClient.invalidateQueries({ queryKey: ['dish', dishId] })
      toast.success('Cập nhật thành công')
    }
  })
  
  const onSubmit = (data) => {
    updateMutation.mutate(data)
  }
  
  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Form fields */}
    </form>
  )
}
```

---

## Best Practices

### 1. **State Selection**

✅ **DO**: Select only needed state

```tsx
// Good - Only re-renders when nameUser changes
const nameUser = useAppStore((state) => state.nameUser)
```

❌ **DON'T**: Select entire store

```tsx
// Bad - Re-renders on any state change
const store = useAppStore()
```

### 2. **Query Keys**

✅ **DO**: Use descriptive, hierarchical keys

```tsx
// Good
['employees', { status: 'active', page: 1 }]
['employee', employeeId]
['employee', employeeId, 'shifts']
```

❌ **DON'T**: Use generic keys

```tsx
// Bad
['data']
['list']
```

### 3. **Mutations**

✅ **DO**: Handle loading, error, success states

```tsx
const mutation = useMutation({
  mutationFn: createDish,
  onSuccess: () => {
    queryClient.invalidateQueries(['dishes'])
    toast.success('Success')
  },
  onError: (error) => {
    toast.error(error.message)
  }
})

<Button loading={mutation.isLoading} />
```

### 4. **Form Validation**

✅ **DO**: Use Yup schema for validation

```tsx
const schema = yup.object({
  price: yup.number()
    .positive('Giá phải lớn hơn 0')
    .required('Giá là bắt buộc'),
  quantity: yup.number()
    .integer('Số lượng phải là số nguyên')
    .min(1, 'Số lượng tối thiểu là 1')
})
```

---

**Cập nhật lần cuối**: October 21, 2025
