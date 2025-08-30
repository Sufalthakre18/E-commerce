-- CreateTable
CREATE TABLE "public"."DigitalFile" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publicId" TEXT,
    "fileName" TEXT,
    "productId" TEXT NOT NULL,

    CONSTRAINT "DigitalFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DigitalFile_productId_idx" ON "public"."DigitalFile"("productId");

-- AddForeignKey
ALTER TABLE "public"."DigitalFile" ADD CONSTRAINT "DigitalFile_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
