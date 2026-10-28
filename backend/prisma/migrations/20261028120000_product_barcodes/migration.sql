-- Varios códigos de barras por producto: pasan de la columna "products"."barcode" a una tabla aparte.

-- CreateTable
CREATE TABLE "product_barcodes" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "product_id" INTEGER NOT NULL,

    CONSTRAINT "product_barcodes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "product_barcodes_code_key" ON "product_barcodes"("code");

-- CreateIndex
CREATE INDEX "product_barcodes_product_id_idx" ON "product_barcodes"("product_id");

-- AddForeignKey
ALTER TABLE "product_barcodes" ADD CONSTRAINT "product_barcodes_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Copia los códigos existentes (incluidos los de productos eliminados, que los conservan).
INSERT INTO "product_barcodes" ("code", "product_id")
SELECT "barcode", "id" FROM "products" WHERE "barcode" IS NOT NULL ORDER BY "id";

-- DropIndex
DROP INDEX "products_barcode_key";

-- AlterTable
ALTER TABLE "products" DROP COLUMN "barcode";
