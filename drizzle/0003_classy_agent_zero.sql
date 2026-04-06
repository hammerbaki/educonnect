ALTER TABLE `dday_events` ADD `alertEnabled` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `dday_events` ADD `alertDaysBefore` int DEFAULT 7 NOT NULL;--> statement-breakpoint
ALTER TABLE `dday_events` ADD `isPreset` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `dday_events` ADD `memo` varchar(500);