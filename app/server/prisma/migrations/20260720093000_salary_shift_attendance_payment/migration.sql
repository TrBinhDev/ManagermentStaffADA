-- AlterTable
ALTER TABLE "Position" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "PositionSalaryRate" (
    "id" TEXT NOT NULL,
    "positionId" TEXT NOT NULL,
    "hourlyRate" DECIMAL(12,2) NOT NULL,
    "effectiveFrom" DATE NOT NULL,
    "effectiveTo" DATE,

    CONSTRAINT "PositionSalaryRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shift" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShiftPositionCapacity" (
    "id" TEXT NOT NULL,
    "shiftId" TEXT NOT NULL,
    "positionId" TEXT NOT NULL,
    "maxStaff" INTEGER NOT NULL,

    CONSTRAINT "ShiftPositionCapacity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkSchedule" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "shiftId" TEXT NOT NULL,
    "workDate" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attendance" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "shiftId" TEXT NOT NULL,
    "workDate" DATE NOT NULL,
    "checkedInAt" TIMESTAMP(3),
    "checkedOutAt" TIMESTAMP(3),
    "checkedInById" TEXT NOT NULL,
    "checkedOutById" TEXT,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyPayment" (
    "id" TEXT NOT NULL,
    "attendanceId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "positionId" TEXT NOT NULL,
    "workDate" DATE NOT NULL,
    "hoursWorked" DECIMAL(6,2) NOT NULL,
    "hourlyRate" DECIMAL(12,2) NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,

    CONSTRAINT "DailyPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PositionSalaryRate_positionId_idx" ON "PositionSalaryRate"("positionId");

-- CreateIndex
CREATE UNIQUE INDEX "Shift_name_key" ON "Shift"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ShiftPositionCapacity_shiftId_positionId_key" ON "ShiftPositionCapacity"("shiftId", "positionId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkSchedule_employeeId_shiftId_workDate_key" ON "WorkSchedule"("employeeId", "shiftId", "workDate");

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_employeeId_workDate_shiftId_key" ON "Attendance"("employeeId", "workDate", "shiftId");

-- CreateIndex
CREATE UNIQUE INDEX "DailyPayment_attendanceId_key" ON "DailyPayment"("attendanceId");

-- CreateIndex
CREATE INDEX "DailyPayment_employeeId_workDate_idx" ON "DailyPayment"("employeeId", "workDate");

-- AddForeignKey
ALTER TABLE "PositionSalaryRate" ADD CONSTRAINT "PositionSalaryRate_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftPositionCapacity" ADD CONSTRAINT "ShiftPositionCapacity_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftPositionCapacity" ADD CONSTRAINT "ShiftPositionCapacity_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkSchedule" ADD CONSTRAINT "WorkSchedule_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkSchedule" ADD CONSTRAINT "WorkSchedule_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_checkedInById_fkey" FOREIGN KEY ("checkedInById") REFERENCES "ManagerAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_checkedOutById_fkey" FOREIGN KEY ("checkedOutById") REFERENCES "ManagerAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyPayment" ADD CONSTRAINT "DailyPayment_attendanceId_fkey" FOREIGN KEY ("attendanceId") REFERENCES "Attendance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyPayment" ADD CONSTRAINT "DailyPayment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyPayment" ADD CONSTRAINT "DailyPayment_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
