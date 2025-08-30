-- AlterTable
ALTER TABLE "public"."Product" ADD COLUMN     "productType" TEXT;

-- CreateIndex
CREATE INDEX "Product_productType_idx" ON "public"."Product"("productType");
