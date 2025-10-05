# API Module Organization

## 📁 Cấu trúc thư mục

```
src/Apis/
├── Admin/              # Admin portal APIs
│   ├── auth.api.ts           # Authentication (login, logout)
│   ├── diningTable.api.ts    # Table management
│   ├── tableSession.api.ts   # Session tracking
│   ├── orderItems.api.ts     # Order management
│   ├── dishCategory.api.ts   # Category CRUD
│   ├── dishes.api.ts         # Dish management
│   ├── menus.api.ts          # Menu versioning
│   └── index.ts              # Barrel exports
├── Client/             # Client portal APIs
│   └── index.ts              # To be developed
├── Upload/             # File upload operations
│   ├── media.api.ts          # Image uploads
│   └── index.ts              # Barrel exports
├── index.ts            # Main barrel export
├── admin.api.ts        # ⚠️ DEPRECATED - kept for backward compatibility
├── client.api.ts       # ⚠️ DEPRECATED - kept for backward compatibility
└── upload.api.ts       # ⚠️ DEPRECATED - kept for backward compatibility
```

## 🎯 Tại sao cần tái cấu trúc?

### Vấn đề cũ:
- ❌ Tất cả API gộp chung vào 1 file `admin.api.ts` (155+ dòng)
- ❌ Nhiều người dev cùng sửa 1 file → Git conflicts liên tục
- ❌ Khó tìm và maintain khi dự án lớn
- ❌ Không có JSDoc → khó hiểu params/return types

### Giải pháp mới:
- ✅ Mỗi domain 1 file riêng → dễ quản lý
- ✅ Nhiều người có thể dev song song không conflict
- ✅ JSDoc đầy đủ cho mọi function
- ✅ Backward compatible hoàn toàn (code cũ vẫn chạy)

## 📖 Cách sử dụng

### ✅ RECOMMENDED: Import từ module chính

```typescript
import { authAPI, dishesAPI, menusAPI } from "src/Apis/Admin"

authAPI.loginAdmin({ email: "admin@example.com", password: "123456" })
dishesAPI.getList(params, signal)
menusAPI.create({ name: "Menu mùa hè", is_active: true })
```

## 🔧 Thêm API mới

### Bước 1: Tạo file API mới

```typescript
// src/Apis/Admin/newFeature.api.ts
import Http from "src/Helpers/http"
import { SuccessResponse } from "src/Types/utils.type"

/**
 * New Feature API
 * Describes what this API module does
 */
export const newFeatureAPI = {
  /**
   * Get list of items
   * @param params - Query parameters for filtering
   * @param signal - Abort signal for cancellation
   */
  getList: (params: any, signal: AbortSignal) => {
    return Http.get<SuccessResponse<any>>("/api/auth/new-feature", {
      params,
      signal
    })
  },

  /**
   * Create new item
   * @param data - Item data
   */
  create: (data: { name: string }) => {
    return Http.post("/api/auth/new-feature", data)
  }
}
```

### Bước 2: Export trong index.ts

```typescript
// src/Apis/Admin/index.ts
export { newFeatureAPI } from "./newFeature.api"

// Thêm vào adminAPI object (để backward compatible)
export const adminAPI = {
  // ... existing APIs
  newFeature: newFeatureAPI
}
```

### Bước 3: Sử dụng

```typescript
import { newFeatureAPI } from "src/Apis/Admin"

newFeatureAPI.getList(params, signal)
newFeatureAPI.create({ name: "Test" })
```

## 📝 Quy tắc viết code

### 1. Naming Convention
- File: `camelCase.api.ts` (ví dụ: `diningTable.api.ts`)
- Export object: `camelCaseAPI` (ví dụ: `diningTableAPI`)
- Functions: `camelCase` (ví dụ: `getList`, `createDiningTable`)

### 2. JSDoc bắt buộc
```typescript
/**
 * Function description
 * @param paramName - Parameter description
 * @param signal - Abort signal for request cancellation
 * @returns Promise with response data
 */
functionName: (paramName: Type, signal: AbortSignal) => { ... }
```

### 3. Type Safety
- Luôn define TypeScript types cho params và return
- Sử dụng generic types từ `utils.type.ts`: `SuccessResponse<T>`, `PaginatedResponse<T>`

### 4. Error Handling
- Http class tự động handle errors (401, 403, 404)
- Không cần try-catch trong API functions
- Use TanStack Query hooks ở component level


## 🎓 Best Practices

1. **Tách biệt concerns**: Mỗi domain 1 file riêng
2. **JSDoc đầy đủ**: Giúp IntelliSense và AI assistants
3. **Type safety**: Luôn define types rõ ràng
4. **AbortSignal**: Thêm cho các GET requests (để cancel khi needed)
5. **Consistent naming**: Đặt tên theo đúng cú pháp
