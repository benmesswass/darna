-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "hash" TEXT,
ADD COLUMN     "prevHash" TEXT;

-- CreateTable
CREATE TABLE "AuditChainState" (
    "id" TEXT NOT NULL,
    "lastHash" TEXT NOT NULL,

    CONSTRAINT "AuditChainState_pkey" PRIMARY KEY ("id")
);
