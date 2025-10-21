# 📡 API Architecture

## 📋 Mục Lục
- [Tổng Quan](#tổng-quan)
- [HTTP Client](#http-client)
- [API Module Structure](#api-module-structure)
- [Request Interceptors](#request-interceptors)
- [Response Interceptors](#response-interceptors)
- [Error Handling](#error-handling)
- [API Usage Patterns](#api-usage-patterns)

---

## Tổng Quan

Hệ thống API được tổ chức theo **modular architecture** với HTTP client tùy chỉnh dựa trên Axios:

```
┌─────────────────────────────────────────────────────┐
│              Application Layer                      │
│  Components / Pages                                 │
└───────────────────┬─────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────┐
│              React Query Layer                      │
│  useQuery / useMutation                             │
└───────────────────┬─────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────┐
│              API Module Layer                       │
│  dishesAPI, employeesAPI, shiftsAPI, etc.           │
└───────────────────┬─────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────┐
│              HTTP Client Layer                      │
│  Axios + Request/Response Interceptors              │
│  - Auto attach JWT token                            │
│  - Auto refresh expired token                       │
│  - Error handling                                   │
└───────────────────┬─────────────────────────────────┘
                    │
                    ▼
            ┌───────────────┐
            │  Backend API  │
            └───────────────┘
```

---

## HTTP Client

### 1. **HTTP Client Class**

```typescript
// src/Helpers/http.ts

class http {
  instance: AxiosInstance
  public accessToken: string
  private refreshTokenRequest: Promise<string> | null

  constructor() {
    this.accessToken = getAccessTokenFromLS()
    this.refreshTokenRequest = null
    
    // Create Axios instance
    this.instance = axios.create({
      baseURL: config.baseURLClient,  // e.g., "http://localhost:8000"
      timeout: 10000,
      headers: {
        "Content-Type": "application/json"
      },
      withCredentials: true  // Send cookies (for refresh token)
    })
    
    // Setup interceptors
    this.instance.interceptors.request.use(...)
    this.instance.interceptors.response.use(...)
  }
}

// Export singleton instance
const httpClient = new http()
export default httpClient.instance
```

### 2. **Configuration**

```typescript
// src/Constants/config.ts

export const config = {
  baseURLClient: import.meta.env.VITE_API_URL || "http://localhost:8000",
  timeout: 10000,
  
  // Upload config
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp']
}
```

---

## API Module Structure

### 1. **Module Organization**

```
src/Apis/
├── Admin/                    # Admin-specific APIs
│   ├── index.ts             # Export aggregator
│   ├── auth.api.ts          # Authentication
│   ├── dishes.api.ts        # Dish management
│   ├── dishCategory.api.ts  # Dish categories
│   ├── menus.api.ts         # Menu management
│   ├── employees.api.ts     # Employee management
│   ├── shifts.api.ts        # Shift scheduling
│   ├── payroll.api.ts       # Payroll management
│   ├── payrollItems.api.ts  # Payroll items
│   ├── ingredients.api.ts   # Ingredient management
│   ├── suppliers.api.ts     # Supplier management
│   ├── stockImports.api.ts  # Stock imports
│   ├── stockExports.api.ts  # Stock exports
│   ├── stockLosses.api.ts   # Stock losses
│   ├── customers.api.ts     # Customer management
│   ├── diningTable.api.ts   # Table management
│   ├── tableSession.api.ts  # Table sessions
│   ├── orderItems.api.ts    # Order items
│   ├── invoicePayment.api.ts# Invoice payments
│   ├── roles.api.ts         # Role management
│   ├── permissions.api.ts   # Permission management
│   └── reports.api.ts       # Reports & analytics
│
├── Client/                   # Client-specific APIs
│   └── ...
│
├── Upload/                   # File upload APIs
│   └── upload.api.ts
│
├── admin.api.ts             # Admin API aggregator
├── client.api.ts            # Client API aggregator
└── index.ts                 # Main export
```

### 2. **API Module Pattern**

```typescript
// src/Apis/Admin/dishes.api.ts

export const dishesAPI = {
  // GET /api/dishes?page=1&limit=20&search=pizza
  getList: (params: queryParamConfigDish, signal: AbortSignal) => {
    return Http.get<SuccessResponse<PaginatedResponse<Dish>>>(
      `/api/dishes`, 
      { params, signal }
    )
  },

  // GET /api/dishes/:id
  getById: (id: string) => {
    return Http.get<SuccessResponse<Dish>>(`/api/dishes/${id}`)
  },

  // POST /api/dishes
  create: (data: DishCreateInput) => {
    const formData = new FormData()
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value)
      }
    })
    
    return Http.post<SuccessResponse<Dish>>(
      `/api/dishes`, 
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    )
  },

  // PUT/POST /api/dishes/:id (with _method=PUT for Laravel)
  update: (id: string, data: DishUpdateInput) => {
    const formData = new FormData()
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value)
      }
    })
    formData.append("_method", "PUT")
    
    return Http.post<SuccessResponse<Dish>>(
      `/api/dishes/${id}`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    )
  },

  // DELETE /api/dishes/:id
  delete: (id: string) => {
    return Http.delete<SuccessResponse<void>>(`/api/dishes/${id}`)
  },

  // GET /api/dishes/:id/ingredients
  getIngredients: (id: string) => {
    return Http.get<SuccessResponse<IngredientDish[]>>(
      `/api/dishes/${id}/ingredients`
    )
  },

  // POST /api/dishes/:id/ingredients
  addIngredient: (dishId: string, body: AddIngredientDishBody) => {
    return Http.post<SuccessResponse<any>>(
      `/api/dishes/${dishId}/ingredients`, 
      body
    )
  }
}
```

### 3. **API Aggregator**

```typescript
// src/Apis/Admin/index.ts

export { authAPI } from "./auth.api"
export { dishesAPI } from "./dishes.api"
export { employeesAPI } from "./employees.api"
export { shiftsAPI, employeeShiftsAPI } from "./shifts.api"
export { payrollAPI } from "./payroll.api"
// ... more exports

// Aggregated object
export const adminAPI = {
  auth: authAPI,
  dishes: dishesAPI,
  employees: employeesAPI,
  shifts: shiftsAPI,
  payroll: payrollAPI,
  // ... more modules
}
```

---

## Request Interceptors

### 1. **Auto Attach JWT Token**

```typescript
this.instance.interceptors.request.use(
  (cfg) => {
    // Sync token from localStorage (support OAuth callback)
    const tokenLS = getAccessTokenFromLS()
    if (tokenLS && tokenLS !== this.accessToken) {
      this.accessToken = tokenLS
    }
    
    // Attach Bearer token to all requests
    if (cfg.headers && this.accessToken) {
      cfg.headers.Authorization = `Bearer ${this.accessToken}`
    }
    
    return cfg
  },
  (error) => Promise.reject(error)
)
```

### 2. **Request Flow**

```
┌─────────────────────────────────────────────────┐
│  Component calls API                            │
│  dishesAPI.getList(params)                      │
└───────────────────┬─────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────┐
│  Request Interceptor                            │
│  1. Get token from localStorage                 │
│  2. Attach to Authorization header              │
│     Authorization: "Bearer eyJhbG..."           │
└───────────────────┬─────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────┐
│  Axios sends request to backend                 │
│  GET /api/dishes                                │
│  Headers: {                                     │
│    Authorization: "Bearer eyJhbG...",           │
│    Content-Type: "application/json"             │
│  }                                              │
└─────────────────────────────────────────────────┘
```

---

## Response Interceptors

### 1. **Success Response Handler**

```typescript
this.instance.interceptors.response.use(
  (response) => {
    // Handle login response
    if (response.config.url === "/api/auth/login") {
      const currentPath = window.location.pathname
      const data = response.data as SuccessResponse<AuthResponse>
      const user = data.data.user
      
      // Only for admin login
      if (currentPath === "/admin/login" && user.employee_profile) {
        this.accessToken = data.data.access_token
        setAccessTokenToLS(this.accessToken)
        setNameUserToLS(user.name)
        setRoleToLS(user.role.name)
        setAvatarImageToLS(user.avatar)
        setEmployeeIdToLS(user.employee_profile.id)
      }
    }
    
    // Handle logout response
    if (response.config.url === "/api/auth/logout") {
      clearLS()
      toast.success(response.data.message)
      this.accessToken = ""
    }
    
    return response
  },
  (error) => {
    // Error handling...
  }
)
```

### 2. **Error Response Handler**

```typescript
this.instance.interceptors.response.use(
  (response) => response,
  (error) => {
    // 403 Forbidden - No permission
    if (isError403<MessageResponse>(error)) {
      toast.error(
        error.response?.data.message || "Không có quyền truy cập!"
      )
    }
    
    // 404 Not Found
    if (isError404<MessageResponse>(error)) {
      // Handle 404 if needed
    }
    
    // 401 Unauthorized
    if (isError401(error)) {
      const originalRequest = error.response?.config
      const { url } = originalRequest
      
      // Token expired -> refresh
      if (
        isAxiosExpiredTokenError(error, "Unauthenticated.") && 
        url !== "/api/auth/refresh"
      ) {
        this.refreshTokenRequest = 
          this.refreshTokenRequest ?? this.handleRefreshToken()
        
        return this.refreshTokenRequest.then((accessToken) => {
          // Retry original request with new token
          return this.instance({
            ...originalRequest,
            headers: {
              ...originalRequest.headers,
              Authorization: `Bearer ${accessToken}`
            }
          })
        })
      }
      
      // Refresh token expired
      if (isAxiosExpiredTokenError(error, "Invalid or expired refresh token")) {
        if (this.accessToken) {
          toast.error("Phiên làm việc hết hạn")
        }
        this.accessToken = ""
        clearLS()
      }
    }
    
    return Promise.reject(error)
  }
)
```

### 3. **Token Refresh Mechanism**

```typescript
private handleRefreshToken() {
  return this.instance
    .post<SuccessResponse<{ access_token: string }>>(
      "/api/auth/refresh"
    )
    .then((res) => {
      const { access_token } = res.data.data
      this.accessToken = access_token
      this.refreshTokenRequest = null
      setAccessTokenToLS(access_token)
      return access_token
    })
    .catch((err) => {
      clearLS()
      this.accessToken = ""
      this.refreshTokenRequest = null
      throw err
    })
}
```

### Token Refresh Flow

```
Request → 401 Error → Refresh Token → Retry Request
   │                      │
   │                      ▼
   │           ┌──────────────────────┐
   │           │ POST /auth/refresh   │
   │           │ (httpOnly cookie)    │
   │           └──────────┬───────────┘
   │                      │
   │                      ▼
   │           ┌──────────────────────┐
   │           │ New Access Token     │
   │           │ - Save to LS         │
   │           │ - Update instance    │
   │           └──────────┬───────────┘
   │                      │
   └──────────────────────┴──────────────────────▶
                    Retry Original Request
```

---

## Error Handling

### 1. **Error Helper Functions**

```typescript
// src/Helpers/utils.ts

export function isAxiosError<T>(error: unknown): error is AxiosError<T> {
  return axios.isAxiosError(error)
}

export function isError401(error: unknown): boolean {
  return (
    isAxiosError(error) && 
    error.response?.status === HttpStatusCode.Unauthorized
  )
}

export function isError403<T>(error: unknown): error is AxiosError<T> {
  return (
    isAxiosError(error) && 
    error.response?.status === HttpStatusCode.Forbidden
  )
}

export function isError404<T>(error: unknown): error is AxiosError<T> {
  return (
    isAxiosError(error) && 
    error.response?.status === HttpStatusCode.NotFound
  )
}

export function isAxiosExpiredTokenError<T>(
  error: unknown,
  message: string
): error is AxiosError<T> {
  return (
    isAxiosError(error) &&
    error.response?.status === HttpStatusCode.Unauthorized &&
    error.response?.data?.message === message
  )
}
```

### 2. **Error Response Types**

```typescript
// src/Types/utils.type.ts

export interface ErrorResponse<T = any> {
  message: string
  errors?: T
}

export interface SuccessResponse<T> {
  message: string
  data: T
}

export interface PaginatedResponse<T> {
  data: T[]
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number
  to: number
}
```

---

## API Usage Patterns

### 1. **Simple GET Request**

```tsx
import { useQuery } from '@tanstack/react-query'
import { dishesAPI } from 'src/Apis/Admin'

function DishList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dishes'],
    queryFn: () => dishesAPI.getList({ page: 1, limit: 20 })
  })
  
  if (isLoading) return <Loading />
  if (error) return <Error />
  
  return (
    <div>
      {data?.data.data.map(dish => (
        <DishCard key={dish.id} dish={dish} />
      ))}
    </div>
  )
}
```

### 2. **POST with FormData**

```tsx
import { useMutation } from '@tanstack/react-query'
import { employeesAPI } from 'src/Apis/Admin'

function CreateEmployeeForm() {
  const createMutation = useMutation({
    mutationFn: (data: EmployeeCreateInput) => 
      employeesAPI.create(data)
  })
  
  const handleSubmit = async (formData) => {
    try {
      await createMutation.mutateAsync(formData)
      toast.success('Tạo nhân viên thành công')
    } catch (error) {
      toast.error(error.response?.data.message)
    }
  }
}
```

### 3. **Request with Cancellation**

```tsx
function SearchDishes() {
  const [searchTerm, setSearchTerm] = useState('')
  
  const { data } = useQuery({
    queryKey: ['dishes', { search: searchTerm }],
    queryFn: ({ signal }) => 
      dishesAPI.getList({ search: searchTerm }, signal),
    enabled: searchTerm.length > 0
  })
  
  // Automatically cancels previous request when searchTerm changes
}
```

### 4. **Parallel Requests**

```tsx
function DashboardStats() {
  const queries = useQueries({
    queries: [
      { 
        queryKey: ['stats', 'dishes'], 
        queryFn: () => reportsAPI.getDishStats() 
      },
      { 
        queryKey: ['stats', 'employees'], 
        queryFn: () => reportsAPI.getEmployeeStats() 
      },
      { 
        queryKey: ['stats', 'revenue'], 
        queryFn: () => reportsAPI.getRevenueStats() 
      }
    ]
  })
  
  const isLoading = queries.some(q => q.isLoading)
  const [dishStats, employeeStats, revenueStats] = queries.map(q => q.data)
}
```

### 5. **File Upload**

```tsx
function UploadDishImage() {
  const uploadMutation = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData()
      formData.append('image', file)
      return uploadAPI.uploadImage(formData)
    }
  })
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      uploadMutation.mutate(file)
    }
  }
}
```

---

## 🔗 Best Practices

### 1. **API Module Naming**

✅ **DO**: Use descriptive, resource-based names
```typescript
dishesAPI.getList()
employeesAPI.getDetail(id)
shiftsAPI.create(data)
```

❌ **DON'T**: Use generic names
```typescript
api.getDishes()
api.getEmployee()
api.createShift()
```

### 2. **Error Handling**

✅ **DO**: Handle errors at component level
```tsx
const { data, error } = useQuery({
  queryKey: ['dishes'],
  queryFn: dishesAPI.getList,
  onError: (error) => {
    toast.error(error.response?.data.message || 'Có lỗi xảy ra')
  }
})
```

### 3. **Type Safety**

✅ **DO**: Use proper TypeScript types
```typescript
return Http.get<SuccessResponse<PaginatedResponse<Dish>>>(...)
```

### 4. **Request Cancellation**

✅ **DO**: Pass AbortSignal for cancellable requests
```typescript
getList: (params, signal: AbortSignal) => {
  return Http.get('/api/dishes', { params, signal })
}
```

---

**Cập nhật lần cuối**: October 21, 2025
