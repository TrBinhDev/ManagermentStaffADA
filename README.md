# ManagementStaffADA

Hệ thống quản lý nhân viên nhà hàng — 3 role (`OWNER`, `MANAGER`, `STAFF`), đăng nhập bằng email/password (JWT access + refresh token), quản lý phòng ban/vị trí/nhân viên, xếp ca, chấm công và tính lương theo giờ.

## Tech stack

- **Backend:** Node.js, Express 5, TypeScript, Prisma ORM, PostgreSQL, Redis (session/refresh-token store)
- **Auth:** JWT (access 15 phút / refresh 7 ngày, refresh token lưu ở httpOnly cookie), bcrypt cho password, AES-256-GCM cho dữ liệu nhạy cảm (CCCD), SHA-256 một chiều để chống trùng CCCD
- **Validate:** Zod
- **Frontend:** Next.js (App Router), Zustand (state cho các list CRUD), shadcn/Base UI + Tailwind, Axios(Giúp cấu hình HTTP req/res)
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
      middlewares/    # authenticate, authorize, error handler, notFound
      validators/    # validate() middleware (zod, hỗ trợ cả body lẫn query)
      utils/         # asyncHandler, token (JWT), session (Redis), hash (SHA-256), crypto (AES-256-GCM), date (UTC-anchored)
      modules/       # 1 folder / resource, mỗi folder có đủ: schema -> repository -> service -> controller -> routes
        auth/
        department/
        position/
        employee/
        employee-profile/
        manager-account/
        position-history/         
        employment-period/         
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

| Lệnh                                              | Ý nghĩa                                |
| ------------------------------------------------- | -------------------------------------- |
| `pnpm dev:server`                                 | Chạy backend (watch mode)              |
| `pnpm dev:web`                                    | Chạy frontend (Next.js dev, port 8080) |
| `pnpm docker:up` / `pnpm docker:down`             | Bật/tắt Postgres + Redis               |
| `pnpm --filter server run seed`                   | Seed tài khoản OWNER mẫu               |
| `pnpm --filter server exec prisma migrate deploy` | Áp dụng migration                      |
| `pnpm --filter server exec prisma studio`         | Xem/sửa dữ liệu qua UI                 |

## Phân quyền

| Role      | Đối tượng                                                 | Quyền hạn                                                                                                                                                                                |
| --------- | --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OWNER`   | Chủ nhà hàng (duy nhất, seed sẵn, không gắn `employeeId`) | Toàn quyền: CRUD phòng ban/vị trí/nhân viên, quản lý tài khoản MANAGER, set lương/giờ theo vị trí, xem toàn bộ lịch làm/chấm công/lương                                                  |
| `MANAGER` | Quản lý (không giới hạn theo phòng ban/vị trí)            | CRUD phòng ban/vị trí/nhân viên, xếp ca, xem/sửa chấm công, xem lương toàn nhà hàng — trừ quản lý tài khoản MANAGER và set lương/giờ (chỉ OWNER)                                         |
| `STAFF`   | Nhân viên (gắn với 1 `employeeId`)                        | Chỉ xem dữ liệu của chính mình: hồ sơ cá nhân, lịch làm việc, lịch sử chấm công, bảng lương, lịch sử vị trí/thời gian làm việc. Không có quyền sửa hồ sơ hay CRUD trên các resource khác |

STAFF tự chấm công vào/ra của chính mình (`attendance` check-in/check-out) — không chấm công hộ nhân viên khác. Mọi endpoint đọc dữ liệu của STAFF đều tự lọc theo `employeeId` gắn với token, không nhận `employeeId` tuỳ ý từ client.

## Các module API

| Module                    | Quyền                                                                                | Ghi chú                                                                                                                                                                               |
| ------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `auth`                    | OWNER/MANAGER/STAFF                                                                  | login, logout, refresh, `/me`, change-password. Refresh token ở httpOnly cookie, session lưu Redis (single-session/account)                                                           |
| `department`              | OWNER/MANAGER (GET: +STAFF)                                                          | CRUD phòng ban; STAFF chỉ xem                                                                                                                                                         |
| `position`                | OWNER/MANAGER (GET: +STAFF)                                                          | CRUD vị trí, unique theo `(name, departmentId)` — 2 phòng ban khác nhau được trùng tên vị trí; STAFF chỉ xem                                                                          |
| `employee`                | OWNER/MANAGER                                                                        | CRUD nhân viên, sinh `code` tự động (`NV0001...`), chống trùng CCCD qua hash, resign/rehire                                                                                           |
| `employee-profile`        | OWNER/MANAGER, STAFF: xem hồ sơ chính mình                                           | Hồ sơ chi tiết nhân viên (CCCD mã hóa 2 chiều để hiển thị lại, địa chỉ, ngân hàng...)                                                                                                 |
| `manager-account`         | **OWNER only**                                                                       | Quản lý tài khoản đăng nhập của MANAGER — khóa tài khoản/đổi mật khẩu đều tự force-logout qua Redis                                                                                   |
| `position-history`        | OWNER/MANAGER, STAFF: xem của chính mình                                             | `GET /employees/:id/position-history` — timeline các vị trí nhân viên đã/đang giữ, tự động ghi khi tạo/đổi vị trí/resign/rehire                                                       |
| `employment-period`       | OWNER/MANAGER, STAFF: xem của chính mình                                             | `GET /employees/:id/employment-periods` — timeline các đợt làm việc liên tục, reset khi rehire                                                                                        |
| `position-salary-rate`    | GET: OWNER/MANAGER, POST: **OWNER only**                                             | `/positions/:id/salary-rates` — lương/giờ theo vị trí, có hiệu lực từ ngày nào; tạo mức mới tự đóng mức đang mở (`effectiveTo = hôm nay`)                                             |
| `shift`                   | OWNER/MANAGER (GET: +STAFF)                                                          | CRUD ca làm việc (tên, giờ bắt đầu/kết thúc); STAFF chỉ xem                                                                                                                           |
| `shift-position-capacity` | OWNER/MANAGER                                                                        | `/shifts/:id/capacities` — số lượng tối đa mỗi vị trí được xếp trong 1 ca                                                                                                             |
| `work-schedule`           | OWNER/MANAGER, STAFF: xem lịch của chính mình                                        | `/employees/:id/work-schedule` (xếp lịch, hỗ trợ bulk theo nhiều ngày) + `/work-schedule` (tab tổng hợp); chặn vượt `shift-position-capacity`, idempotent khi xếp trùng ngày/ca đã có |
| `attendance`              | OWNER/MANAGER: xem tất cả; STAFF: tự check-in/check-out + xem lịch sử của chính mình | Check-in yêu cầu có `work-schedule` khớp ngày/ca; check-out tính lương ngay trong 1 transaction                                                                                       |
| `daily-payment`           | OWNER/MANAGER: xem tất cả; STAFF: xem lương của chính mình                           | `/employees/:id/daily-payment` + `/daily-payment` (tổng hợp toàn nhà hàng theo tháng) — sinh tự động khi check-out, không có API tạo/sửa tay                                          |

`position-history`/`employment-period` chỉ đọc (`GET`), được ghi tự động bởi vòng đời `employee` (create/đổi vị trí/resign/rehire). Không lưu counter "số ngày" — chỉ lưu `startDate`/`endDate` (`endDate = null` nghĩa là đang mở), số ngày luôn tính lúc đọc API bằng `(endDate ?? hiện tại) - startDate`. Vì vậy `Position` bị chặn xóa (409) nếu đã từng xuất hiện trong `position-history`, kể cả khi hiện không còn ai giữ. Tương tự, `Employee` bị chặn xóa (409) nếu đã từng có `attendance`.

`daily-payment` sinh tự động khi `attendance` check-out, trong 1 transaction: lấy vị trí nhân viên đang giữ tại đúng thời điểm check-in (không phải theo ngày, để tránh tính sai lương khi đổi vị trí ngay trong ngày), lấy mức lương/giờ đang hiệu lực của vị trí đó tại ngày làm việc, tính `số giờ làm x lương/giờ` bằng `Prisma.Decimal` rồi làm tròn tới 1.000đ gần nhất. Nếu vị trí chưa có `position-salary-rate` nào thì chặn check-out (400).

Chi tiết từng endpoint xem `api-list-v3-simple.md` ở root. Spec của module lương/xếp ca (`position-salary-rate`, `shift`, `shift-position-capacity`, `work-schedule`, `attendance`, `daily-payment`) xem `docs/V4.md`.

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

Cần server đang chạy (`pnpm dev:server`) và đã seed tài khoản OWNER trước khi chạy. Mật khẩu OWNER hardcode sẵn trong các script test — nếu seed lại DB (mật khẩu mặc định trong `prisma/seed.ts` là `Owner@123`) hoặc đã đổi mật khẩu OWNER thủ công, nhớ sửa lại biến `$ownerPassword` đầu mỗi script cho khớp.
