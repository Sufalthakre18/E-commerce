-- AlterTable
ALTER TABLE "public"."Product" ADD COLUMN     "type" TEXT;

-- CreateIndex
CREATE INDEX "Product_type_idx" ON "public"."Product"("type");
