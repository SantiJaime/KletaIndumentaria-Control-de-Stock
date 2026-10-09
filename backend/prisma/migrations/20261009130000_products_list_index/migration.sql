-- CreateIndex
CREATE INDEX "products_deleted_at_name_id_idx" ON "products"("deleted_at", "name", "id");
