# ManagementStaffADA

Hệ thống quản lý nhân viên nhà hàng — 2 role (`OWNER`, `MANAGER`), đăng nhập bằng email/password (JWT access + refresh token), quản lý phòng ban/vị trí/nhân viên, xếp ca, chấm công và tính lương theo giờ.

## Tech stack

- **Backend:** Node.js, Express 5, TypeScript, Prisma ORM, PostgreSQL, Redis (session/refresh-token store)
- **Auth:** JWT (access 15 phút / refresh 7 ngày, refresh token lưu ở httpOnly cookie), bcrypt cho password, AES-256-GCM cho dữ liệu nhạy cảm (CCCD), SHA-256 một chiều cho việc chống trùng CCCD
- **Validate:** Zod
- **Frontend:** Next.js (App Router), Zustand (state cho các list CRUD), shadcn/Base UI + Tailwind
- **Money/hours math:** `Prisma.Decimal` (decimal.js) — không dùng `Float` để tránh sai số làm tròn lương
- **Monorepo:** pnpm workspace

## Cấu trúc thư mục

```
app/
  server/            # Backend API (Express + Prisma)
    prisma/          # schema.prisma + migrations
    src/
      config/        # env (zod-validated), prisma client, redis client
      constants/     # httpStatus, jwt constants, message (lỗi tiếng Việt)
      errors/        # AppError + các subclass (BadRequest/Unauthorized/Forbidden/NotFound/Conflict)
      middlewares/    # authenticate, authorize, error handler (kèm lưới an toàn cho lỗi FK Restrict thô từ Prisma), notFound
      validators/    # validate() middleware (zod, hỗ trợ cả body lẫn query)
      utils/         # asyncHandler, token (JWT), session (Redis), hash (SHA-256), crypto (AES-256-GCM), date (UTC-anchored, tránh lỗi lệch ngày theo timezone)
      modules/       # 1 folder / resource, mỗi folder có đủ: schema -> repository -> service -> controller -> routes
        auth/
        department/
        position/
        employee/
        employee-profile/
        manager-account/
        position-history/          # chỉ có repository/service/controller/routes (không có schema, GET thuần)
        employment-period/         # tương tự position-history
        position-salary-rate/      # mức lương/giờ theo vị trí, có hiệu lực theo khoảng ngày
        shift/                     # ca làm việc (giờ bắt đầu/kết thúc)
        shift-position-capacity/   # số lượng tối đa mỗi vị trí trong 1 ca
        work-schedule/             # xếp lịch làm việc cho nhân viên theo ngày/ca
        attendance/                # chấm công vào/ra, khớp với work-schedule
        daily-payment/             # lương tính tự động khi chấm công ra (giờ làm x lương/giờ)
    scripts/         # script phụ trợ cho test (vd tạo/xóa record trực tiếp qua Prisma khi API liên quan chưa có)
    test-*.ps1       # script test tay từng module (PowerShell), gọi API thật qua HTTP
  web/               # Frontend (Next.js App Router)
    src/
      app/(dashboard)/   # các trang: departments, positions, shifts, work-schedule, employees/[id], payments, manager-accounts, settings
      features/          # 1 folder / resource: *.types.ts + *.api.ts (+ *.store.ts cho list CRUD đầy đủ, hoặc use-*.ts hook cho phần đọc/refetch hẹp hơn)
      components/        # UI dùng chung (layout, shadcn/ui)
docker/
  docker-compose.yml # Postgres + Redis cho local dev
```

Quy ước module: mỗi resource là 1 folder trong `src/modules/`, gồm 5 file:
- `*.schema.ts` — zod schema, luôn kèm type suy ra qua `z.infer`
- `*.repository.ts` — chỉ chứa query Prisma thuần, không có business logic
- `*.service.ts` — business logic, gọi qua repository của chính module đó (không gọi thẳng `prisma`)
- `*.controller.ts` — mỏng, bọc `asyncHandler`, set status code
- `*.routes.ts` — nối `validate()` + `authenticate`/`authorize` + controller

## Yêu cầu môi trường

- Node.js + pnpm
- Docker (chạy Postgres + Redis local)

## Cài đặt & chạy local

```bash
# 1. Cài dependency
pnpm install

# 2. Tạo file .env trong app/server (không commit, xem mẫu bên dưới)

# 3. Bật Postgres + Redis
pnpm docker:up

# 4. Chạy migration
pnpm --filter server exec prisma migrate deploy

# 5. Seed tài khoản OWNER mẫu để test (owner@ada.local / Owner@123)
pnpm --filter server run seed

# 6. Chạy backend (dev, tự reload)
pnpm dev:server

# 7. Chạy frontend (dev)
pnpm dev:web
```

Backend chạy ở `http://localhost:3000` (đổi qua biến `PORT`), frontend chạy ở `http://localhost:8080`.

### Mẫu `.env` (đặt trong `app/server/.env`)

```
NODE_ENV=development
PORT=3000

DATABASE_URL="postgresql://<user>:<password>@localhost:5432/<db>"
REDIS_URL="redis://:<password>@localhost:6379"

JWT_ACCESS_SECRET=<chuỗi bí mật>
JWT_REFRESH_SECRET=<chuỗi bí mật>
SECRET_KEY=<chuỗi bí mật, dùng để mã hóa CCCD>

CLIENT_ORIGIN=http://localhost:8080
```

### Mẫu `.env` (đặt trong `app/web/.env`)

```
NEXT_PUBLIC_API_URL=http://localhost:3000
```

Và `docker/.env` (biến cho `docker-compose.yml`):

```
POSTGRES_USER=...
POSTGRES_PASSWORD=...
POSTGRES_DB=...
REDIS_PASSWORD=...
```

## Script hay dùng (chạy ở root)

| Lệnh | Ý nghĩa |
|---|---|
| `pnpm dev:server` | Chạy backend (watch mode) |
| `pnpm dev:web` | Chạy frontend (Next.js dev, port 8080) |
| `pnpm docker:up` / `pnpm docker:down` | Bật/tắt Postgres + Redis |
| `pnpm --filter server run seed` | Seed tài khoản OWNER mẫu |
| `pnpm --filter server exec prisma migrate deploy` | Áp dụng migration |
| `pnpm --filter server exec prisma studio` | Xem/sửa dữ liệu qua UI |

## Các module API

| Module | Quyền | Ghi chú |
|---|---|---|
| `auth` | OWNER/MANAGER | login, logout, refresh, `/me`, change-password. Refresh token ở httpOnly cookie, session lưu Redis (single-session/account) |
| `department` | OWNER/MANAGER | CRUD phòng ban |
| `position` | OWNER/MANAGER | CRUD vị trí, unique theo `(name, departmentId)` — 2 phòng ban khác nhau được trùng tên vị trí |
| `employee` | OWNER/MANAGER | CRUD nhân viên, sinh `code` tự động (`NV0001...`), chống trùng CCCD qua hash, resign/rehire |
| `employee-profile` | OWNER/MANAGER | Hồ sơ chi tiết nhân viên (CCCD mã hóa 2 chiều để hiển thị lại, địa chỉ, ngân hàng...) |
| `manager-account` | **OWNER only** | Quản lý tài khoản đăng nhập của MANAGER — khóa tài khoản/đổi mật khẩu đều tự force-logout qua Redis |
| `position-history` | OWNER/MANAGER | `GET /employees/:id/position-history` — timeline các vị trí nhân viên đã/đang giữ, tự động ghi khi tạo/đổi vị trí/resign/rehire |
| `employment-period` | OWNER/MANAGER | `GET /employees/:id/employment-periods` — timeline các đợt làm việc liên tục, reset khi rehire |
| `position-salary-rate` | GET: OWNER/MANAGER, POST: **OWNER only** | `/positions/:id/salary-rates` — lương/giờ theo vị trí, có hiệu lực từ ngày nào; tạo mức mới tự đóng mức đang mở (`effectiveTo = hôm nay`) |
| `shift` | OWNER/MANAGER | CRUD ca làm việc (tên, giờ bắt đầu/kết thúc) |
| `shift-position-capacity` | OWNER/MANAGER | `/shifts/:id/capacities` — số lượng tối đa mỗi vị trí được xếp trong 1 ca |
| `work-schedule` | OWNER/MANAGER | `/employees/:id/work-schedule` (xếp lịch, hỗ trợ bulk theo nhiều ngày) + `/work-schedule` (tab tổng hợp); chặn vượt `shift-position-capacity`, idempotent khi xếp trùng ngày/ca đã có |
| `attendance` | OWNER/MANAGER | Check-in yêu cầu có `work-schedule` khớp ngày/ca; check-out tính lương ngay trong 1 transaction |
| `daily-payment` | OWNER/MANAGER | `/employees/:id/daily-payment` + `/daily-payment` (tổng hợp toàn nhà hàng theo tháng) — sinh tự động khi check-out, không có API tạo/sửa tay |

`position-history`/`employment-period` không có API tạo/sửa riêng — chỉ đọc (`GET`), được ghi tự động bởi vòng đời `employee` (create/đổi vị trí/resign/rehire). Không lưu counter "số ngày" nào cả, chỉ lưu `startDate`/`endDate` (`endDate = null` nghĩa là đang mở) — số ngày luôn tính lúc đọc API bằng `(endDate ?? hiện tại) - startDate`, không cần job chạy nền. Vì lý do này, `Position` giờ bị chặn xóa (409) nếu **đã từng** xuất hiện trong `position-history`, kể cả khi hiện không còn ai giữ — không chỉ chặn khi có nhân viên đang giữ như trước. Tương tự, `Employee` giờ bị chặn xóa (409) nếu đã từng có `attendance`.

`daily-payment` không có API tạo/sửa tay — sinh tự động khi `attendance` check-out, trong 1 transaction: lấy vị trí nhân viên đang giữ **tại đúng thời điểm check-in** (không phải theo ngày, để tránh tính sai lương khi đổi vị trí ngay trong ngày), lấy mức lương/giờ đang hiệu lực của vị trí đó tại ngày làm việc, tính `số giờ làm x lương/giờ` bằng `Prisma.Decimal` rồi làm tròn tới 1.000đ gần nhất. Nếu vị trí chưa có `position-salary-rate` nào thì chặn check-out (400) thay vì tạo dữ liệu lương sai/thiếu.

Chi tiết từng endpoint xem `api-list-v3-simple.md` ở root (lưu ý: file đó là bản nháp ban đầu, một số hành vi đã chỉnh trong lúc code — vd `Position` unique theo department chứ không unique toàn cục, `employee-profile` bỏ tính năng upload avatar, thêm `position-history`/`employment-period` không có trong bản gốc). Spec của module lương/xếp ca (`position-salary-rate`, `shift`, `shift-position-capacity`, `work-schedule`, `attendance`, `daily-payment`) xem `docs/V4.md`.

## Test

Chưa có test tự động — mỗi module có 1 script PowerShell gọi thẳng API qua HTTP để test hồi quy tay:

```powershell
cd app/server
powershell -File .\test-auth.ps1
powershell -File .\test-department.ps1
powershell -File .\test-position.ps1
powershell -File .\test-employee.ps1
powershell -File .\test-employee-profile.ps1
powershell -File .\test-manager-account.ps1
powershell -File .\test-position-history-employment-period.ps1
powershell -File .\test-position-salary-rate.ps1
powershell -File .\test-shift.ps1
powershell -File .\test-shift-position-capacity.ps1
powershell -File .\test-work-schedule.ps1
powershell -File .\test-attendance.ps1
```

Cần server đang chạy (`pnpm dev:server`) và đã seed tài khoản OWNER trước khi chạy. Mật khẩu OWNER hardcode sẵn trong các script test — nếu bạn seed lại DB (mật khẩu mặc định trong `prisma/seed.ts` là `Owner@123`) hoặc đã đổi mật khẩu OWNER thủ công, nhớ sửa lại biến `$ownerPassword` đầu mỗi script cho khớp.
