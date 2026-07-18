-- DropIndex
DROP INDEX "Position_name_key";

-- CreateIndex
CREATE UNIQUE INDEX "Position_name_departmentId_key" ON "Position"("name", "departmentId");


