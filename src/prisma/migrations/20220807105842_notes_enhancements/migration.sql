/*
  Warnings:

  - Added the required column `position` to the `notes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `notes` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `notes` ADD COLUMN `isShared` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `position` INTEGER NOT NULL,
    ADD COLUMN `title` VARCHAR(191) NOT NULL;
