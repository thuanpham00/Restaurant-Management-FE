# 🔄 Data Flow

## 📋 Mục Lục
- [Tổng Quan](#tổng-quan)
- [CRUD Operations Flow](#crud-operations-flow)
- [Real-time Data Flow](#real-time-data-flow)
- [Form Submission Flow](#form-submission-flow)
- [File Upload Flow](#file-upload-flow)
- [Authentication Flow](#authentication-flow)

---

## Tổng Quan

Data flow trong hệ thống tuân theo kiến trúc **Unidirectional Data Flow** (luồng dữ liệu một chiều):

```
┌─────────────────────────────────────────────────────────┐
│                   User Interaction                      │
│  (Click button, Submit form, Type input)                │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│                   Event Handler                         │
│  (onClick, onSubmit, onChange)                          │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│              State Update / API Call                    │
│  - Local State (useState)                               │
│  - Form State (React Hook Form)                         │
│  - Server State (React Query mutation)                  │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│                   API Request                           │
│  HTTP Client → Backend API                              │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│                   API Response                          │
│  Backend → HTTP Client                                  │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│              Cache Update / State Update                │
│  - React Query cache invalidation                       │
│  - Zustand store update                                 │
│  - Form reset                                           │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│                   UI Re-render                          │
│  Component re-renders with new data                     │
└─────────────────────────────────────────────────────────┘
```

---

## CRUD Operations Flow

### 1. **READ (Fetch Data)**

```
User visits page
      │
      ▼
┌─────────────────────────────────────────────────┐
│  Component Mount                                │
│  useQuery hook executes                         │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  Check React Query Cache                        │
│  - Cache Hit → Return cached data               │
│  - Cache Miss → Make API request                │
└────────────────┬────────────────────────────────┘
                 │ (Cache Miss)
                 ▼
┌─────────────────────────────────────────────────┐
│  API Request                                    │
│  GET /api/dishes?page=1&limit=20                │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  HTTP Interceptor                               │
│  - Attach JWT token                             │
│  - Add request timestamp                        │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  Backend Processing                             │
│  - Validate token                               │
│  - Check permissions                            │
│  - Query database                               │
│  - Return response                              │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  Response Interceptor                           │
│  - Handle errors (401, 403, 404)                │
│  - Parse response                               │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  React Query Update                             │
│  - Store in cache                               │
│  - Update query state (isLoading → false)       │
│  - Trigger component re-render                  │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  Component Renders with Data                    │
│  {data.map(dish => <DishCard dish={dish} />)}   │
└─────────────────────────────────────────────────┘
```

**Code Example:**

```tsx
function DishList() {
  // Step 1: useQuery hook
  const { data, isLoading, error } = useQuery({
    queryKey: ['dishes', { page: 1, limit: 20 }],
    queryFn: ({ signal }) => dishesAPI.getList({ page: 1, limit: 20 }, signal)
  })
  
  // Step 2: Loading state
  if (isLoading) return <LoadingSpinner />
  
  // Step 3: Error state
  if (error) return <ErrorMessage error={error} />
  
  // Step 4: Render with data
  return (
    <div className="grid grid-cols-3 gap-4">
      {data?.data.data.map(dish => (
        <DishCard key={dish.id} dish={dish} />
      ))}
    </div>
  )
}
```

---

### 2. **CREATE (Add New Data)**

```
User fills form & clicks "Create"
      │
      ▼
┌─────────────────────────────────────────────────┐
│  Form Validation                                │
│  - Yup schema validation                        │
│  - Check required fields                        │
│  - Validate data types                          │
└────────────────┬────────────────────────────────┘
                 │ ✓ Valid
                 ▼
┌─────────────────────────────────────────────────┐
│  useMutation.mutate(formData)                   │
│  - Trigger mutation                             │
│  - Set isLoading = true                         │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  API Request                                    │
│  POST /api/dishes                               │
│  Body: FormData (with image file)               │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  Backend Processing                             │
│  - Validate input                               │
│  - Upload image to storage                      │
│  - Insert to database                           │
│  - Return created resource                      │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  Success Response                               │
│  {                                              │
│    "message": "Dish created",                   │
│    "data": { "id": "123", "name": "Pizza" }     │
│  }                                              │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  onSuccess Callback                             │
│  - Invalidate queries: ['dishes']               │
│  - Show success toast                           │
│  - Reset form                                   │
│  - Navigate to list page                        │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  React Query Refetch                            │
│  - All components with queryKey: ['dishes']     │
│  - Automatically refetch and update UI          │
└─────────────────────────────────────────────────┘
```

**Code Example:**

```tsx
function CreateDishForm() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  
  // Step 1: Form setup
  const form = useForm({
    resolver: yupResolver(dishSchema),
    defaultValues: {
      name: '',
      price: '',
      category_id: '',
      image: null
    }
  })
  
  // Step 2: Mutation setup
  const createMutation = useMutation({
    mutationFn: (data: DishCreateInput) => dishesAPI.create(data),
    
    // Step 3: Success handler
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['dishes'] })
      toast.success('Tạo món ăn thành công!')
      form.reset()
      navigate('/admin/dishes')
    },
    
    // Step 4: Error handler
    onError: (error: AxiosError<ErrorResponse>) => {
      toast.error(error.response?.data.message || 'Có lỗi xảy ra')
    }
  })
  
  // Step 5: Submit handler
  const onSubmit = (data: DishCreateInput) => {
    createMutation.mutate(data)
  }
  
  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Input {...form.register('name')} placeholder="Tên món ăn" />
      <Input {...form.register('price')} placeholder="Giá" />
      <InputFileImage 
        value={form.watch('image')}
        onChange={(file) => form.setValue('image', file)}
      />
      
      <Button 
        type="submit" 
        disabled={createMutation.isLoading}
      >
        {createMutation.isLoading ? 'Đang tạo...' : 'Tạo món ăn'}
      </Button>
    </form>
  )
}
```

---

### 3. **UPDATE (Edit Data)**

```
User clicks "Edit" → Navigate to edit page
      │
      ▼
┌─────────────────────────────────────────────────┐
│  Fetch Existing Data                            │
│  useQuery(['dish', dishId])                     │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  Populate Form with Existing Data               │
│  form.reset(existingData)                       │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
      User modifies fields
      User clicks "Update"
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  Form Validation                                │
└────────────────┬────────────────────────────────┘
                 │ ✓ Valid
                 ▼
┌─────────────────────────────────────────────────┐
│  Optimistic Update (Optional)                   │
│  - Update UI immediately                        │
│  - Store rollback data                          │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  API Request                                    │
│  PUT /api/dishes/:id                            │
│  (or POST with _method=PUT for Laravel)         │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  Backend Update                                 │
│  - Validate changes                             │
│  - Update database                              │
│  - Return updated resource                      │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  onSuccess Callback                             │
│  - Invalidate: ['dishes']                       │
│  - Invalidate: ['dish', dishId]                 │
│  - Show success message                         │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  UI Update                                      │
│  - List page refreshes                          │
│  - Detail page shows new data                   │
└─────────────────────────────────────────────────┘
```

**Code Example with Optimistic Update:**

```tsx
function EditEmployeeStatus({ employeeId }: { employeeId: string }) {
  const queryClient = useQueryClient()
  
  const updateStatusMutation = useMutation({
    mutationFn: (status: string) => 
      employeesAPI.toggleActive(employeeId, status === 'active'),
    
    // Optimistic update
    onMutate: async (newStatus) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['employees'] })
      
      // Snapshot previous value
      const previousEmployees = queryClient.getQueryData(['employees'])
      
      // Optimistically update to new value
      queryClient.setQueryData(['employees'], (old: any) => ({
        ...old,
        data: old.data.map((emp: Employee) =>
          emp.id === employeeId
            ? { ...emp, status: newStatus }
            : emp
        )
      }))
      
      // Return rollback function
      return { previousEmployees }
    },
    
    // Rollback on error
    onError: (err, variables, context) => {
      queryClient.setQueryData(['employees'], context?.previousEmployees)
      toast.error('Cập nhật thất bại')
    },
    
    // Always refetch after error or success
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
    }
  })
  
  return (
    <Switch
      checked={employee.status === 'active'}
      onCheckedChange={(checked) => 
        updateStatusMutation.mutate(checked ? 'active' : 'inactive')
      }
    />
  )
}
```

---

### 4. **DELETE (Remove Data)**

```
User clicks "Delete" button
      │
      ▼
┌─────────────────────────────────────────────────┐
│  Confirmation Dialog                            │
│  "Bạn có chắc muốn xóa?"                        │
└────────────────┬────────────────────────────────┘
                 │ ✓ Confirm
                 ▼
┌─────────────────────────────────────────────────┐
│  useMutation.mutate(dishId)                     │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  API Request                                    │
│  DELETE /api/dishes/:id                         │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  Backend Processing                             │
│  - Check if resource exists                     │
│  - Check dependencies                           │
│  - Soft/hard delete                             │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  Success Response                               │
│  { "message": "Deleted successfully" }          │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  onSuccess Callback                             │
│  - Remove from React Query cache                │
│  - Invalidate related queries                   │
│  - Show success toast                           │
│  - Update UI (remove from list)                 │
└─────────────────────────────────────────────────┘
```

**Code Example:**

```tsx
function DishCard({ dish }: { dish: Dish }) {
  const queryClient = useQueryClient()
  const [showConfirm, setShowConfirm] = useState(false)
  
  const deleteMutation = useMutation({
    mutationFn: () => dishesAPI.delete(dish.id),
    
    onSuccess: () => {
      // Remove from cache immediately
      queryClient.setQueryData(['dishes'], (old: any) => ({
        ...old,
        data: old.data.filter((d: Dish) => d.id !== dish.id)
      }))
      
      // Then invalidate to refetch with correct pagination
      queryClient.invalidateQueries({ queryKey: ['dishes'] })
      
      toast.success('Xóa món ăn thành công')
      setShowConfirm(false)
    },
    
    onError: (error: AxiosError<ErrorResponse>) => {
      toast.error(error.response?.data.message || 'Xóa thất bại')
    }
  })
  
  return (
    <>
      <Card>
        <CardContent>
          <h3>{dish.name}</h3>
          <p>{dish.price}</p>
          <Button 
            variant="destructive"
            onClick={() => setShowConfirm(true)}
          >
            Xóa
          </Button>
        </CardContent>
      </Card>
      
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa món "{dish.name}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isLoading}
            >
              {deleteMutation.isLoading ? 'Đang xóa...' : 'Xóa'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
```

---

## Real-time Data Flow

### Using Real-time Query Hook

```
┌─────────────────────────────────────────────────┐
│  Component Mount with useRealtimeQuery          │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  Initial Fetch                                  │
│  GET /api/table-sessions/:id                    │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  Render with Data                               │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
      ┌──────────────────────┐
      │  Auto Refetch Loop   │
      │  (Every 10 seconds)  │
      └─────────┬────────────┘
                │
                ▼
┌─────────────────────────────────────────────────┐
│  Background Refetch                             │
│  - Fetch new data                               │
│  - Compare with cached data                     │
│  - Update if changed                            │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  UI Updates Automatically                       │
│  - Show new orders                              │
│  - Update payment status                        │
│  - Show table status changes                    │
└─────────────────────────────────────────────────┘
```

**Code Example:**

```tsx
function TableSessionDetail({ sessionId }: { sessionId: string }) {
  // Auto-refetch every 10 seconds
  const { data, isLoading } = useRealtimeQuery(
    ['tableSession', sessionId],
    () => tableSessionAPI.getById(sessionId),
    { 
      refetchInterval: 10000,
      // Stop refetching when session is closed
      refetchInterval: (data) => {
        return data?.status === 'closed' ? false : 10000
      }
    }
  )
  
  if (isLoading) return <LoadingSpinner />
  
  const session = data?.data.data
  
  return (
    <div>
      <h2>Bàn #{session.table.number}</h2>
      <p>Trạng thái: {session.status}</p>
      
      {/* Orders update in real-time */}
      <OrderList orders={session.orders} />
      
      {/* Total updates in real-time */}
      <Total amount={session.total_amount} />
    </div>
  )
}
```

---

## Form Submission Flow

Complete flow từ khi user nhập liệu đến khi data được lưu:

```
User types in input
      │
      ▼
┌─────────────────────────────────────────────────┐
│  React Hook Form                                │
│  - Track field value                            │
│  - Run field validation (onChange/onBlur)       │
│  - Update form state                            │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
      User clicks "Submit"
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  Form Validation                                │
│  - Yup schema validation                        │
│  - Check all fields                             │
│  - Return errors if any                         │
└────────────────┬────────────────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
    ✗ Invalid        ✓ Valid
        │                 │
        ▼                 ▼
┌──────────────┐  ┌────────────────────────────┐
│ Show Errors  │  │  Call onSubmit handler     │
│ Focus first  │  │  - Transform data          │
│ error field  │  │  - Call mutation           │
└──────────────┘  └──────────┬─────────────────┘
                             │
                             ▼
                  ┌──────────────────────────┐
                  │  API Request             │
                  └──────────┬───────────────┘
                             │
                    ┌────────┴────────┐
                    │                 │
               ✗ Error          ✓ Success
                    │                 │
                    ▼                 ▼
        ┌────────────────┐  ┌──────────────────┐
        │ onError        │  │  onSuccess       │
        │ - Show toast   │  │  - Invalidate    │
        │ - Keep form    │  │  - Reset form    │
        │   data         │  │  - Redirect      │
        └────────────────┘  └──────────────────┘
```

---

## File Upload Flow

```
User selects file
      │
      ▼
┌─────────────────────────────────────────────────┐
│  File Validation (Client-side)                  │
│  - Check file type                              │
│  - Check file size (< 5MB)                      │
│  - Generate preview                             │
└────────────────┬────────────────────────────────┘
                 │ ✓ Valid
                 ▼
┌─────────────────────────────────────────────────┐
│  Store in Form State                            │
│  setValue('image', file)                        │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
      User submits form
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  Create FormData                                │
│  formData.append('name', data.name)             │
│  formData.append('image', file)                 │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  API Request (multipart/form-data)              │
│  POST /api/dishes                               │
│  Headers: Content-Type: multipart/form-data     │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  Backend Processing                             │
│  - Validate file type/size                      │
│  - Generate unique filename                     │
│  - Upload to storage (S3/local)                 │
│  - Save URL to database                         │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  Return Image URL                               │
│  { "image_url": "https://..." }                 │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  UI Updates                                     │
│  - Show uploaded image                          │
│  - Clear file input                             │
└─────────────────────────────────────────────────┘
```

---

## Authentication Flow

Chi tiết về authentication flow đã được mô tả trong [AUTHENTICATION_AUTHORIZATION.md](./AUTHENTICATION_AUTHORIZATION.md), nhưng đây là tóm tắt:

```
Login Form Submit
      │
      ▼
POST /api/auth/login
      │
      ▼
Response: { access_token, user }
      │
      ▼
HTTP Interceptor detects /auth/login
      │
      ▼
Save to LocalStorage & Zustand
      │
      ▼
Redirect to Dashboard
      │
      ▼
All subsequent requests include Bearer token
      │
      ▼
Token expires (401 error)
      │
      ▼
Auto refresh token
      │
      ▼
Retry original request
```

---

## 🔗 Data Flow Best Practices

### 1. **Cache Invalidation**

✅ **DO**: Invalidate related queries after mutations
```tsx
onSuccess: () => {
  queryClient.invalidateQueries(['dishes'])
  queryClient.invalidateQueries(['dish', dishId])
  queryClient.invalidateQueries(['menu']) // If dish is in menu
}
```

### 2. **Optimistic Updates**

✅ **DO**: Use for better UX in non-critical operations
```tsx
// Toggle status, like/unlike, etc.
onMutate: async (newData) => {
  await queryClient.cancelQueries(['data'])
  const previous = queryClient.getQueryData(['data'])
  queryClient.setQueryData(['data'], newData)
  return { previous }
}
```

❌ **DON'T**: Use for critical operations (payments, deletions)

### 3. **Error Handling**

✅ **DO**: Handle errors at multiple levels
```tsx
// API level: HTTP interceptor
// Query level: onError callback
// Component level: error state rendering
```

### 4. **Loading States**

✅ **DO**: Show appropriate loading indicators
```tsx
if (isLoading) return <Skeleton />
if (isFetching) return <RefreshIndicator />
```

---

**Cập nhật lần cuối**: October 21, 2025
