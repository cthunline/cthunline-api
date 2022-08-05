-- DropForeignKey
ALTER TABLE `notes` DROP FOREIGN KEY `notes_sessionId_fkey`;

-- AddForeignKey
ALTER TABLE `notes` ADD CONSTRAINT `notes_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `sessions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
