# Tai lieu he thong phan quyen

## Tong quan
He thong phan quyen duoc xay dung de dieu khien quyen truy cap giao dien quan tri thong qua cac role, danh sach ability va cac thanh phan kiem tra o muc UI. Core nam trong thu muc `src/Authorization/` va duoc ket noi voi store toan cuc (`src/StateGlobal/zustand.tsx`) cung nhu cac route va component UI trong admin.

## Cac thanh phan chinh

### 1. Role (`roles.ts`)
- Dinh nghia enum `AppRole` gom cac role quan tri (super_admin, administrator, manager, staff, cashier, kitchen_staff, waiter).
- Cung cap `APP_ROLE_LABELS` de hien thi ten role than thien.
- Ham `resolveRole(rawRole)` chuan hoa ten role (chap nhan alias va legacy code) ve gia tri `AppRole`.
- Khi muon them role moi: cap nhat enum, label, va bo sung alias (neu can).

### 2. Ability (`abilities.ts`)
- Dinh nghia enum `AppAbility` chua cac quyen han cuc bo (dinh dang `feature:action`).
- `ALL_ABILITIES` la danh sach day du dung cho viec cap quyen mac dinh va mapping.
- Khi them tinh nang moi can tao ability view/manage tuong ung.

### 3. Mapping ve tinh nang (`featurePermissions.ts`)
- `FeatureKey` chuan hoa danh sach tinh nang UI.
- `FEATURE_VIEW_ABILITY` gan moi tinh nang voi ability bat buoc de xem.
- `FEATURE_MANAGE_ABILITY` (option) gan ability tuong ung khi can thao tac ghi.
- Dung lam cau noi giua UI va he thong ability.

### 4. Role -> Ability (`permissionMap.ts`)
- `ROLE_PERMISSIONS` xac dinh nhung ability mac dinh cho tung role.
- `getDefaultPermissionsForRole(role)` tra ve ability mac dinh khi backend khong truyen permission rieng.
- Khi them role/ability, can cap nhat map nay de dam bao role mac dinh hoat dong dung.

### 5. Hook `useAuthorization.ts`
- Lay thong tin tu store (role va danh sach permission dang co).
- Chuan hoa permission code ve ability tuong ung.
- Xac dinh danh sach ability hieu luc (backend -> fallback role).
- Tra ve cac ham ho tro:
  - `can(ability)` kiem tra tat ca ability bat buoc.
  - `canSome(ability)` kiem tra chi can mot trong cac ability.
  - `hasRole` / `hasAnyRole` kiem tra role.
  - `abilitySet` giu set ability hieu luc de su dung nang cao.

### 6. Component kiem tra UI
- `PermissionGate` (render children hoac fallback dua tren `can`/`canSome`).
- `PermissionBoundary` (bao boc route/component, mac dinh redirect ve `path.AdminDashboard` neu khong du quyen).
- Ca hai deu nhan props `ability`, `anyAbility`, `roles`, `fallback`.

## Dong chay du lieu phan quyen
1. Khi dang nhap (`AdminLogin.tsx`):
   - Lay role va danh sach permission tu API.
   - Dung `resolveRole` de chuan hoa role.
   - Luu role, permissions vao store. Neu backend khong tra permission thi lay mac dinh theo role thong qua `getDefaultPermissionsForRole`.
2. Khi dang xuat (`Sidebar.tsx`): reset store de xoa permission hien co.
3. UI doc tu store trong moi lan render, dam bao thay doi quyen cap nhat ngay lap tuc.

## Cach su dung trong code

### 1. Bao ve route
```tsx
<Route
  path={path.AdminMenu}
  element={
    <PermissionBoundary ability={FEATURE_VIEW_ABILITY.menu}>
      <ManageMenu />
    </PermissionBoundary>
  }
/>
```
- `ability` co the la string hoac mang ability.
- `roles` dung khi muon gioi han theo role cu the.
- `redirectTo` tuy chon neu muon chuyen huong sang trang khac.

### 2. Bao ve component UI nho
```tsx
import { PermissionGate, FEATURE_MANAGE_ABILITY } from "src/Authorization"

<PermissionGate ability={FEATURE_MANAGE_ABILITY.menu} fallback={null}>
  <Button type="primary">Them menu</Button>
</PermissionGate>
```
- Mac dinh fallback la `null`, co the truyen button disabled hoac message tuy nhu cau.

### 3. Su dung hook `useAuthorization`
```tsx
const { can, canSome, role, abilitySet } = useAuthorization()

const choPhepThem = can(FEATURE_MANAGE_ABILITY.ingredients)
const hienThiBaoCao = canSome([
  AppAbility.PAYROLL_VIEW,
  AppAbility.INVOICES_VIEW
])
```
- Thich hop cho logic xu ly dong, vi du quyet dinh data fetch hay bo loc du lieu.

### 4. Xay dung menu dong
- `Sidebar.tsx` khai bao `menuConfig` voi `feature` key va loc thong qua `can(FEATURE_VIEW_ABILITY[key])`.
- Cach lam goi y cho cac module khac muon render danh sach muc luc theo quyen.

## Mo rong va bao tri
1. **Them tinh nang moi**
   - Bo sung ability view/manage trong `abilities.ts`.
   - Cap nhat `FeatureKey` va mapping trong `featurePermissions.ts`.
   - Cap nhat `ROLE_PERMISSIONS` de role mac dinh co quyen phu hop.
   - Dung `PermissionBoundary` va `PermissionGate` tai cac route/component lien quan.

2. **Them role moi**
   - Bo sung vao enum `AppRole` va label.
  - Cap nhat alias neu backend tra ve chuoi khac.
   - Thiet lap quyen mac dinh trong `ROLE_PERMISSIONS`.

3. **Tich hop permission tu backend**
   - Backend nen tra ve danh sach permission code lower-case (vd: `"menu:view"`).
   - Neu backend thay doi format can cap nhat mapping trong `useAuthorization` (ham `mapPermissionCodeToAbility`).

4. **Kiem thu**
   - Kiem tra cac role chu yeu (Super Admin, Manager, Staff, Cashier, Kitchen Staff, Waiter).
   - Dam bao route va menu an hien dung theo permission duoc gan.
   - Khi thay doi mapping phai smoke test trang dashboard, menu, nhan su, kho hang, tai chinh va bao mat.

## De xuat thuc hanh tot
- Dong bo thuat ngu: luon su dung `FeatureKey` khi map UI -> ability.
- Han che hard-code role trong component; thay vao do dung `useAuthorization`.
- Khi tuong tac voi API moi, can dam bao API tra lai danh sach permission hoac role ro rang.
- Viet unit hoac integration test cho cac luong critical neu co khung test phu hop.

Tai lieu nay duoc cap nhat lan dau vao 2025-10-19. Hay cap nhat khi them role, ability hoac module phan quyen moi.
