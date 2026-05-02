-- Create users table
CREATE TABLE `users` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `openId` varchar(64) NOT NULL UNIQUE,
  `name` text,
  `email` varchar(320),
  `loginMethod` varchar(64),
  `role` enum('user', 'admin') NOT NULL DEFAULT 'user',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `lastSignedIn` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create sessions table
CREATE TABLE `sessions` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `userId` int,
  `sessionId` varchar(64) NOT NULL UNIQUE,
  `profileLevel` int NOT NULL DEFAULT 0,
  `trustScore` decimal(5, 2) NOT NULL DEFAULT 45.00,
  `points` int NOT NULL DEFAULT 0,
  `streak` int NOT NULL DEFAULT 0,
  `isActive` boolean NOT NULL DEFAULT true,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create questions table
CREATE TABLE `questions` (
  `id` varchar(64) PRIMARY KEY,
  `type` enum('swipe', 'rating', 'choice', 'open_ended') NOT NULL,
  `text` text NOT NULL,
  `textAr` text NOT NULL,
  `options` json,
  `difficulty` varchar(64),
  `pointsValue` int NOT NULL DEFAULT 10,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create answers table
CREATE TABLE `answers` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `sessionId` varchar(64) NOT NULL,
  `questionId` varchar(64) NOT NULL,
  `answer` text NOT NULL,
  `responseTime` int NOT NULL,
  `wasSkipped` boolean NOT NULL DEFAULT false,
  `pointsEarned` int NOT NULL DEFAULT 0,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`sessionId`) REFERENCES `sessions`(`sessionId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create behavioral_metrics table
CREATE TABLE `behavioral_metrics` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `sessionId` varchar(64) NOT NULL,
  `avgResponseTime` decimal(10, 2) NOT NULL DEFAULT 0,
  `skipRate` decimal(5, 2) NOT NULL DEFAULT 0,
  `completionRate` decimal(5, 2) NOT NULL DEFAULT 0,
  `dropOffPoints` int NOT NULL DEFAULT 0,
  `trustScore` decimal(5, 2) NOT NULL DEFAULT 45,
  `lastUpdated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`sessionId`) REFERENCES `sessions`(`sessionId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create rewards table
CREATE TABLE `rewards` (
  `id` varchar(64) PRIMARY KEY,
  `name` varchar(255) NOT NULL,
  `nameAr` varchar(255) NOT NULL,
  `description` text,
  `descriptionAr` text,
  `pointsCost` int NOT NULL,
  `category` varchar(64),
  `icon` varchar(255),
  `color` varchar(64),
  `isActive` boolean NOT NULL DEFAULT true,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create purchases table
CREATE TABLE `purchases` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `sessionId` varchar(64) NOT NULL,
  `rewardId` varchar(64) NOT NULL,
  `pointsSpent` int NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`sessionId`) REFERENCES `sessions`(`sessionId`),
  FOREIGN KEY (`rewardId`) REFERENCES `rewards`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create wheel_spins table
CREATE TABLE `wheel_spins` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `sessionId` varchar(64) NOT NULL,
  `prizeId` varchar(64),
  `pointsSpent` int NOT NULL DEFAULT 50,
  `pointsWon` int NOT NULL DEFAULT 0,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`sessionId`) REFERENCES `sessions`(`sessionId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert mock questions
INSERT INTO `questions` (`id`, `type`, `text`, `textAr`, `options`, `difficulty`, `pointsValue`) VALUES
('q1', 'swipe', 'Which brand do you prefer?', 'أنهي براند تفضل؟', '[{"id":"opt1","label":"Hamoud Frères","labelAr":"حمود فريرز"},{"id":"opt2","label":"Boga","labelAr":"بوقة"}]', 'easy', 10),
('q2', 'rating', 'Rate your satisfaction with Jumia', 'قيّم رضاك عن جوميا', NULL, 'easy', 10),
('q3', 'choice', 'Which shopping platform do you prefer?', 'أنهي منصة تسوق تفضل؟', '[{"id":"opt1","label":"Jumia","labelAr":"جوميا"},{"id":"opt2","label":"Glovo","labelAr":"جلوفو"},{"id":"opt3","label":"Carrefour","labelAr":"كارفور"}]', 'easy', 15),
('q4', 'open_ended', 'What product category do you prefer?', 'أنهي فئة منتجات تفضل؟', NULL, 'medium', 20),
('q5', 'swipe', 'Which phone brand do you prefer?', 'أنهي ماركة هاتف تفضل؟', '[{"id":"opt1","label":"Apple","labelAr":"أبل"},{"id":"opt2","label":"Samsung","labelAr":"سامسونج"}]', 'easy', 10),
('q6', 'rating', 'Rate your experience with online shopping', 'قيّم تجربتك في التسوق الإلكتروني', NULL, 'easy', 10),
('q7', 'choice', 'What payment method do you prefer?', 'أنهي طريقة دفع تفضل؟', '[{"id":"opt1","label":"Credit Card","labelAr":"بطاقة ائتمان"},{"id":"opt2","label":"Mobile Money","labelAr":"محفظة رقمية"},{"id":"opt3","label":"Cash on Delivery","labelAr":"الدفع عند الاستلام"}]', 'easy', 15),
('q8', 'open_ended', 'What is your favorite Tunisian brand?', 'ما هي ماركتك التونسية المفضلة؟', NULL, 'medium', 20),
('q9', 'swipe', 'Do you prefer local or international brands?', 'هل تفضل الماركات المحلية أم العالمية؟', '[{"id":"opt1","label":"Local","labelAr":"محلية"},{"id":"opt2","label":"International","labelAr":"عالمية"}]', 'easy', 10),
('q10', 'rating', 'How often do you shop online?', 'كم مرة تتسوق أونلاين؟', NULL, 'easy', 10);

-- Insert mock rewards
INSERT INTO `rewards` (`id`, `name`, `nameAr`, `description`, `descriptionAr`, `pointsCost`, `category`, `icon`, `color`, `isActive`) VALUES
('jumia-100', 'Jumia Card', 'بطاقة جوميا', '100 DT credit on Jumia', 'رصيد 100 دينار على جوميا', 200, 'shopping', '🛍️', 'from-orange-600 to-orange-700', true),
('glovo-50', 'Glovo Card', 'بطاقة جلوفو', '50 DT credit on Glovo', 'رصيد 50 دينار على جلوفو', 150, 'food', '🍔', 'from-green-600 to-green-700', true),
('carrefour-75', 'Carrefour Card', 'بطاقة كارفور', '75 DT credit on Carrefour', 'رصيد 75 دينار على كارفور', 180, 'shopping', '🏪', 'from-blue-600 to-blue-700', true),
('ooredoo-30', 'Ooredoo Credit', 'رصيد أوريدو', '30 DT phone credit', 'رصيد 30 دينار للهاتف', 100, 'telecom', '📱', 'from-red-600 to-red-700', true),
('netflix-month', 'Netflix Month', 'نتفليكس شهر', 'Netflix subscription for 1 month', 'اشتراك نتفليكس لشهر كامل', 250, 'entertainment', '🎬', 'from-red-700 to-red-800', true),
('spotify-3months', 'Spotify 3 Months', 'سبوتيفاي 3 أشهر', 'Spotify subscription for 3 months', 'اشتراك سبوتيفاي لثلاثة أشهر', 300, 'entertainment', '🎵', 'from-green-700 to-green-800', true);
