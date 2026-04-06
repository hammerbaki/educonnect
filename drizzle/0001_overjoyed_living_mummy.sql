CREATE TABLE `aptitude_analyses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`surveyAnswers` json,
	`radarData` json,
	`recommendedMajors` json,
	`analysisText` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `aptitude_analyses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dday_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(200) NOT NULL,
	`eventDate` timestamp NOT NULL,
	`category` enum('수능','수시','정시','모의고사','기타') DEFAULT '기타',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dday_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(300) NOT NULL,
	`docType` enum('자기소개서','생기부분석','학업계획서') DEFAULT '자기소개서',
	`content` text,
	`aiSuggestion` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `interview_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`university` varchar(200),
	`major` varchar(200),
	`interviewType` enum('심층면접','인성면접','제시문면접') DEFAULT '인성면접',
	`messages` json,
	`feedback` text,
	`score` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `interview_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `roadmap_goals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(300) NOT NULL,
	`description` text,
	`category` enum('학업','비교과','입시','자기개발','기타') DEFAULT '기타',
	`status` enum('예정','진행중','완료') NOT NULL DEFAULT '예정',
	`priority` enum('높음','보통','낮음') DEFAULT '보통',
	`dueDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `roadmap_goals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `student_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`grade` enum('1','2','3') NOT NULL DEFAULT '3',
	`school` varchar(200),
	`interestAreas` json,
	`favoriteSubjects` json,
	`weakSubjects` json,
	`gpa` varchar(20),
	`targetUniversities` json,
	`targetMajors` json,
	`admissionType` enum('수시','정시','미정') DEFAULT '미정',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `student_profiles_id` PRIMARY KEY(`id`)
);
