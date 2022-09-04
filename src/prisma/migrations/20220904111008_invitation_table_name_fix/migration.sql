/*
  Warnings:

  - You are about to drop the `invitation` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE `invitation`;

-- CreateTable
CREATE TABLE `invitations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(191) NOT NULL,
    `expire` DATETIME(3) NOT NULL,
    `isUsed` BOOLEAN NOT NULL,

    UNIQUE INDEX `invitations_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
