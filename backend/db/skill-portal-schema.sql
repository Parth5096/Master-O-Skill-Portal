-- Skill Portal initial schema (MySQL 8+)
-- Creates database objects for users, skills, questions, options, quiz attempts, and answers.
-- Normalized to support reporting (user-wise performance, skill gaps, time filters).

SET NAMES utf8mb4;
SET time_zone = '+00:00';
SET sql_mode = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION';

CREATE DATABASE IF NOT EXISTS skill_portal
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;
USE skill_portal;

-- USERS
CREATE TABLE IF NOT EXISTS users (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_uuid     CHAR(36)         NOT NULL UNIQUE DEFAULT (UUID()),
  full_name     VARCHAR(100)     NOT NULL,
  email         VARCHAR(255)     NOT NULL UNIQUE,
  password_hash VARCHAR(255)     NOT NULL,
  role          ENUM('admin','user') NOT NULL DEFAULT 'user',
  is_active     TINYINT(1)       NOT NULL DEFAULT 1,
  last_login_at DATETIME         NULL,
  created_at    DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- SKILLS (a.k.a skill categories)
CREATE TABLE IF NOT EXISTS skills (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100)     NOT NULL,
  description TEXT             NULL,
  is_active   TINYINT(1)       NOT NULL DEFAULT 1,
  created_at  DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_skills_name (name)
) ENGINE=InnoDB;

-- QUESTIONS (linked to skills) - MCQ type
CREATE TABLE IF NOT EXISTS questions (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  skill_id      BIGINT UNSIGNED NOT NULL,
  question_text TEXT            NOT NULL,
  difficulty    ENUM('easy','medium','hard') NOT NULL DEFAULT 'medium',
  explanation   TEXT            NULL,
  is_active     TINYINT(1)      NOT NULL DEFAULT 1,
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_questions_skill
    FOREIGN KEY (skill_id) REFERENCES skills(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  KEY idx_questions_skill (skill_id)
) ENGINE=InnoDB;

-- QUESTION OPTIONS (answer choices)
CREATE TABLE IF NOT EXISTS question_options (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  question_id  BIGINT UNSIGNED NOT NULL,
  position     TINYINT UNSIGNED NOT NULL, -- 1..8 typical
  option_text  TEXT            NOT NULL,
  is_correct   TINYINT(1)      NOT NULL DEFAULT 0,
  created_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_options_question
    FOREIGN KEY (question_id) REFERENCES questions(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT uq_option_position UNIQUE (question_id, position),
  KEY idx_options_question (question_id),
  KEY idx_options_is_correct (question_id, is_correct)
) ENGINE=InnoDB;

-- QUIZ ATTEMPTS (attempt header per user & skill)
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id           BIGINT UNSIGNED NOT NULL,
  skill_id          BIGINT UNSIGNED NOT NULL,
  total_questions   INT UNSIGNED    NOT NULL DEFAULT 0,
  correct_answers   INT UNSIGNED    NOT NULL DEFAULT 0,
  score_percent     DECIMAL(5,2)    NOT NULL DEFAULT 0.00, -- 0..100
  status            ENUM('in_progress','submitted','scored') NOT NULL DEFAULT 'in_progress',
  started_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  submitted_at      DATETIME        NULL,
  duration_seconds  INT UNSIGNED    NULL,
  created_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_attempts_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_attempts_skill
    FOREIGN KEY (skill_id) REFERENCES skills(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  KEY idx_attempts_user_time (user_id, submitted_at),
  KEY idx_attempts_skill_time (skill_id, submitted_at)
) ENGINE=InnoDB;

-- QUIZ ANSWERS (per attempt, per question)
CREATE TABLE IF NOT EXISTS quiz_answers (
  id                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  attempt_id         BIGINT UNSIGNED NOT NULL,
  question_id        BIGINT UNSIGNED NOT NULL,
  selected_option_id BIGINT UNSIGNED NOT NULL,
  is_correct         TINYINT(1)      NOT NULL DEFAULT 0,
  time_spent_seconds INT UNSIGNED    NULL,
  answered_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ans_attempt
    FOREIGN KEY (attempt_id) REFERENCES quiz_attempts(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_ans_question
    FOREIGN KEY (question_id) REFERENCES questions(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_ans_selected_option
    FOREIGN KEY (selected_option_id) REFERENCES question_options(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT uq_attempt_question UNIQUE (attempt_id, question_id),
  KEY idx_ans_question (question_id),
  KEY idx_ans_attempt (attempt_id)
) ENGINE=InnoDB;

-- Helpful views for reports

-- Attempt summary (already stored but view makes it easy)
CREATE OR REPLACE VIEW v_attempt_summary AS
SELECT
  qa.id,
  qa.user_id,
  u.full_name,
  qa.skill_id,
  s.name AS skill_name,
  qa.total_questions,
  qa.correct_answers,
  qa.score_percent,
  qa.started_at,
  qa.submitted_at
FROM quiz_attempts qa
JOIN users u   ON u.id = qa.user_id
JOIN skills s  ON s.id = qa.skill_id;

-- Average performance per user per skill (skill gap identification)
CREATE OR REPLACE VIEW v_user_skill_performance AS
SELECT
  user_id,
  skill_id,
  COUNT(*)                        AS attempts,
  AVG(score_percent)              AS avg_score_percent,
  SUM(correct_answers)            AS total_correct,
  SUM(total_questions)            AS total_questions
FROM quiz_attempts
WHERE status IN ('submitted','scored')
GROUP BY user_id, skill_id;

-- Time-based performance (filter by date at query-time)
-- Example usage:
--   SELECT * FROM v_attempt_summary
--   WHERE submitted_at IS NOT NULL
--     AND submitted_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY);
-- Indexes on (user_id, submitted_at) and (skill_id, submitted_at) support week/month filters.

-- Minimal seed (optional)
INSERT INTO skills (name, description) VALUES
  ('JavaScript', 'Core JS and ES features'),
  ('SQL', 'Relational databases and SQL queries'),
  ('DevOps', 'CI/CD, Docker, and cloud fundamentals')
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- Create a placeholder admin user (replace hash later from backend seed)
-- password_hash below is bcrypt for "Admin@123" with 10 rounds (example)
INSERT INTO users (full_name, email, password_hash, role)
VALUES ('Admin User', 'admin@example.com', '$2a$10$48MGzXWJeqR.yRnAORDqke39IVRFhAG5leBu55u5LOLMArMOrF2hW', 'admin')
ON DUPLICATE KEY UPDATE role='admin';
