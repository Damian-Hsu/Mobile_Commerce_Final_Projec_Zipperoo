-- AlterTable
ALTER TABLE "chat_messages" ADD COLUMN     "is_read_by_buyer" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_read_by_seller" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "read_by_buyer_at" TIMESTAMP(3),
ADD COLUMN     "read_by_seller_at" TIMESTAMP(3);
