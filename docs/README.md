# 📚 Restaurant Management System - Frontend Documentation

Tài liệu tổng hợp về kiến trúc và cấu trúc hệ thống Frontend của **Restaurant Management System**.

---

## 📖 Mục Lục Tài Liệu

### 1. [🏗️ Architecture (Kiến Trúc Tổng Quan)](./ARCHITECTURE.md)
Mô tả tổng quan về kiến trúc hệ thống, tech stack, và cấu trúc thư mục.

**Nội dung chính:**
- Tech Stack (React, TypeScript, Vite, TailwindCSS, Zustand, React Query)
- Mô hình kiến trúc tổng quan
- Cấu trúc thư mục chi tiết
- Two-Portal Architecture (Admin & Client)

---

### 2. [🔐 Authentication & Authorization](./AUTHENTICATION_AUTHORIZATION.md)
Chi tiết về hệ thống xác thực và phân quyền dựa trên Role-Based Access Control (RBAC).

**Nội dung chính:**
- JWT Authentication Flow
- Token Management (Access Token & Refresh Token)
- RBAC System với 7 roles
- Permission Structure (43+ permissions)
- Route Guards & Component-level Authorization
- Security Features

**Roles hỗ trợ:**
- Super Administrator
- Administrator
- Manager
- Cashier
- Kitchen Staff
- Waiter
- Staff

---

### 3. [🛣️ Routing Structure](./ROUTING_STRUCTURE.md)
Mô tả cấu trúc routing cho cả Admin Portal và Client Portal.

**Nội dung chính:**
- Admin Routes (25+ routes)
- Client Routes (8+ routes)
- Route Guards (ProtectedRoute, PermissionBoundary, BlockClientForAdmin)
- Navigation Patterns
- Path Constants Management

**Admin Routes:**
- Dashboard, Tables, Reservations
- Dishes, Menus, Categories
- Employees, Shifts, Payroll
- Ingredients, Suppliers, Warehouse
- Invoices, Promotions
- Roles & Permissions

---

### 4. [🗄️ State Management](./STATE_MANAGEMENT.md)
Hệ thống quản lý state sử dụng Zustand, React Query, và React Hook Form.

**Nội dung chính:**
- Zustand Store (Global Client State)
- React Query (Server State & Caching)
- Form State Management
- Real-time Query Hook
- Query Invalidation Strategies
- Optimistic Updates

**State Layers:**
- Application State → Zustand
- Server State → React Query
- Form State → React Hook Form

---

### 5. [📡 API Architecture](./API_ARCHITECTURE.md)
Kiến trúc API layer với HTTP client tùy chỉnh và error handling.

**Nội dung chính:**
- HTTP Client (Axios-based)
- API Module Structure (20+ API modules)
- Request/Response Interceptors
- Token Refresh Mechanism
- Error Handling Strategies
- API Usage Patterns

**API Modules:**
- Authentication, Dishes, Employees
- Shifts, Payroll, Ingredients
- Stock Management, Invoices
- Tables, Menus, Customers
- Reports & Analytics

---

### 6. [🧩 Component Structure](./COMPONENT_STRUCTURE.md)
Cấu trúc và patterns của components trong hệ thống.

**Nội dung chính:**
- Component Hierarchy
- Shared Components (UI Library)
- Admin-specific Components
- Client-specific Components
- Layout Components
- Component Patterns (Container/Presenter, Compound, HOC, Custom Hooks)

**Component Types:**
- Pages (Feature Modules)
- Layouts (Page Wrappers)
- Feature Components (Reusable)
- Shared Components (Generic UI)

---

### 7. [🔄 Data Flow](./DATA_FLOW.md)
Mô tả chi tiết luồng dữ liệu từ UI đến API và ngược lại.

**Nội dung chính:**
- CRUD Operations Flow (Create, Read, Update, Delete)
- Real-time Data Flow
- Form Submission Flow
- File Upload Flow
- Authentication Flow
- Optimistic Updates
- Cache Invalidation

**Flow Patterns:**
- Unidirectional Data Flow
- Optimistic UI Updates
- Background Refetching
- Error Recovery

---

## 🎯 Quick Start

### 1. Đọc theo thứ tự đề xuất

Nếu bạn mới tham gia dự án, đề xuất đọc theo thứ tự sau:

```
1. ARCHITECTURE.md          → Hiểu tổng quan hệ thống
2. AUTHENTICATION_AUTHORIZATION.md → Hiểu cơ chế bảo mật
3. ROUTING_STRUCTURE.md     → Hiểu cấu trúc điều hướng
4. STATE_MANAGEMENT.md      → Hiểu quản lý state
5. API_ARCHITECTURE.md      → Hiểu API layer
6. COMPONENT_STRUCTURE.md   → Hiểu cấu trúc component
7. DATA_FLOW.md            → Hiểu luồng dữ liệu
```

### 2. Tìm kiếm nhanh

| Bạn cần tìm hiểu về... | Xem file |
|------------------------|----------|
| Tech stack, dependencies | [ARCHITECTURE.md](./ARCHITECTURE.md) |
| Đăng nhập, đăng xuất | [AUTHENTICATION_AUTHORIZATION.md](./AUTHENTICATION_AUTHORIZATION.md) |
| Phân quyền, roles, permissions | [AUTHENTICATION_AUTHORIZATION.md](./AUTHENTICATION_AUTHORIZATION.md) |
| Tạo route mới | [ROUTING_STRUCTURE.md](./ROUTING_STRUCTURE.md) |
| Route guards, protected routes | [ROUTING_STRUCTURE.md](./ROUTING_STRUCTURE.md) |
| Zustand store | [STATE_MANAGEMENT.md](./STATE_MANAGEMENT.md) |
| React Query, caching | [STATE_MANAGEMENT.md](./STATE_MANAGEMENT.md) |
| Form validation | [STATE_MANAGEMENT.md](./STATE_MANAGEMENT.md) |
| Gọi API | [API_ARCHITECTURE.md](./API_ARCHITECTURE.md) |
| HTTP interceptors | [API_ARCHITECTURE.md](./API_ARCHITECTURE.md) |
| Error handling | [API_ARCHITECTURE.md](./API_ARCHITECTURE.md) |
| Tạo component mới | [COMPONENT_STRUCTURE.md](./COMPONENT_STRUCTURE.md) |
| Component patterns | [COMPONENT_STRUCTURE.md](./COMPONENT_STRUCTURE.md) |
| CRUD operations | [DATA_FLOW.md](./DATA_FLOW.md) |
| Real-time updates | [DATA_FLOW.md](./DATA_FLOW.md) |
| File upload | [DATA_FLOW.md](./DATA_FLOW.md) |

---

## 🔍 Sơ Đồ Tổng Quan

### Kiến Trúc Tổng Thể

```
┌─────────────────────────────────────────────────────┐
│                   Browser                           │
│  ┌──────────────────┐    ┌──────────────────┐      │
│  │  Admin Portal    │    │  Client Portal   │      │
│  │  /admin/*        │    │  /*             │      │
│  └────────┬─────────┘    └────────┬─────────┘      │
└───────────┼──────────────────────┼─────────────────┘
            │                      │
            └──────────┬───────────┘
                       │
        ┌──────────────▼──────────────┐
        │   React Router (v7)         │
        │   - Route Guards            │
        │   - Permission Checks       │
        └──────────────┬──────────────┘
                       │
        ┌──────────────▼──────────────┐
        │   Components Layer          │
        │   - Pages                   │
        │   - Layouts                 │
        │   - Shared Components       │
        └──────────────┬──────────────┘
                       │
        ┌──────────────▼──────────────┐
        │   State Management          │
        │   - Zustand (App State)     │
        │   - React Query (Server)    │
        │   - React Hook Form         │
        └──────────────┬──────────────┘
                       │
        ┌──────────────▼──────────────┐
        │   API Layer                 │
        │   - HTTP Client (Axios)     │
        │   - API Modules             │
        │   - Interceptors            │
        └──────────────┬──────────────┘
                       │
        ┌──────────────▼──────────────┐
        │   Backend API               │
        │   (Laravel/PHP)             │
        └─────────────────────────────┘
```

### Data Flow

```
User Action → Event Handler → State Update → API Call
                                    ↓
                            Response Handler
                                    ↓
                      Cache Update / UI Re-render
```

---

## 🛠️ Development Guidelines

### Code Style
- **TypeScript**: Strict mode enabled
- **Naming**: PascalCase for components, camelCase for functions
- **File Structure**: One component per file
- **Imports**: Absolute imports using `src/` alias

### Best Practices
1. ✅ Luôn sử dụng TypeScript types
2. ✅ Validate form với Yup schema
3. ✅ Handle loading và error states
4. ✅ Invalidate React Query cache sau mutations
5. ✅ Sử dụng Permission Guards cho protected features
6. ✅ Follow component patterns documented
7. ✅ Write descriptive commit messages

---

## 📊 Metrics

### Codebase Statistics
- **Total Components**: 100+ components
- **API Modules**: 20+ modules
- **Routes**: 30+ routes
- **Roles**: 7 roles
- **Permissions**: 43+ permissions
- **Tech Stack**: 50+ packages

### Documentation Coverage
- ✅ Architecture Documentation
- ✅ Authentication & Authorization
- ✅ Routing Structure
- ✅ State Management
- ✅ API Architecture
- ✅ Component Structure
- ✅ Data Flow

---

## 🤝 Contributing

Khi thêm feature mới:

1. **Đọc tài liệu liên quan** trước khi code
2. **Follow existing patterns** trong codebase
3. **Update documentation** nếu có thay đổi kiến trúc
4. **Add TypeScript types** cho mọi API và component
5. **Test thoroughly** trước khi commit

---

## 📝 Changelog

### v1.0.0 (October 21, 2025)
- ✅ Initial documentation created
- ✅ 7 comprehensive documentation files
- ✅ Architecture diagrams added
- ✅ Code examples included
- ✅ Best practices documented

---

## 📧 Support

Nếu có thắc mắc về tài liệu hoặc kiến trúc hệ thống:
- Liên hệ team lead
- Tạo issue trong repository
- Hỏi trong Slack channel #frontend

---

**Cập nhật lần cuối**: October 21, 2025

**Maintainers**: Frontend Team
