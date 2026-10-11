-- AlterTable
ALTER TABLE "operations" ADD COLUMN     "cancelled_at" TIMESTAMP(3),
ADD COLUMN     "cancelled_by_id" INTEGER,
ADD COLUMN     "user_id" INTEGER;

-- CreateTable
CREATE TABLE "login_attempts" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "login_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "login_attempts_ip_created_at_idx" ON "login_attempts"("ip", "created_at");

-- AddForeignKey
ALTER TABLE "operations" ADD CONSTRAINT "operations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operations" ADD CONSTRAINT "operations_cancelled_by_id_fkey" FOREIGN KEY ("cancelled_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

