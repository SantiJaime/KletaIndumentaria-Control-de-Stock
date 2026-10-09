-- DropIndex (lo cubre el índice compuesto de abajo)
DROP INDEX "operations_created_at_idx";

-- CreateIndex
CREATE INDEX "operations_created_at_id_idx" ON "operations"("created_at", "id");
