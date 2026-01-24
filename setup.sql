DROP DATABASE IF EXISTS mixmaster;
CREATE DATABASE mixmaster;
USE mixmaster;

CREATE TABLE users (
                       user_id INT AUTO_INCREMENT PRIMARY KEY,
                       username VARCHAR(50) NOT NULL UNIQUE,
                       email VARCHAR(100) NOT NULL UNIQUE,
                       password VARCHAR(255) NOT NULL,
                       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE favorites (
                           favorite_id INT AUTO_INCREMENT PRIMARY KEY,
                           user_id INT NOT NULL,
                           drink_id VARCHAR(20) NOT NULL,
                           drink_name VARCHAR(200) NOT NULL,
                           drink_category VARCHAR(100),
                           drink_image VARCHAR(500),
                           glass_type VARCHAR(100),
                           is_alcoholic VARCHAR(20),
                           ingredient_count INT,
                           base_spirit VARCHAR(100),
                           created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                           FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
                           UNIQUE KEY unique_user_drink (user_id, drink_id)
);