-- Users and authentication tables
-- MySQL version

CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) NOT NULL,
  username VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  password_hash VARCHAR(255) NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_users_username (username),
  CONSTRAINT chk_users_role CHECK (role IN ('admin', 'doctor'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  token VARCHAR(500) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_refresh_tokens_token (token),
  CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_users_username ON users(username);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);

CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);

CREATE INDEX idx_refresh_tokens_expires ON refresh_tokens(expires_at)
