-- Restaverse Employee Directory: schema + seed data.
-- WARNING: DROP TABLE is for local/dev bootstrap only. Remove it before running against shared data.
CREATE DATABASE IF NOT EXISTS restaverse_internal
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE restaverse_internal;

DROP TABLE IF EXISTS employees;

CREATE TABLE employees (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(150) NOT NULL,
    department VARCHAR(80) NOT NULL,
    designation VARCHAR(100) NOT NULL,
    date_of_joining DATE NOT NULL,
    CONSTRAINT uq_employees_email UNIQUE (email),          -- also serves as the email index
    INDEX idx_name_dept (name, department),                -- prefix search on name (+ covers name/department reads)
    INDEX idx_department (department)                      -- prefix search / filtering on department
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO employees (name, email, department, designation, date_of_joining) VALUES
('Rahul Sharma', 'rahul.sharma@restaverse.com', 'Engineering', 'Staff Software Engineer', '2021-03-15'),
('Ananya Roy', 'ananya.roy@restaverse.com', 'Engineering', 'Frontend Developer', '2022-06-01'),
('Priya Nair', 'priya.nair@restaverse.com', 'Product', 'Principal Product Manager', '2020-11-10'),
('Vikramaditya Rao', 'vikram.rao@restaverse.com', 'Culinary Tech', 'IoT Hardware Lead', '2021-08-22'),
('Siddharth Patel', 'siddharth.patel@restaverse.com', 'Operations', 'Head of Restaurant Success', '2019-04-05'),
('Meera Iyer', 'meera.iyer@restaverse.com', 'Engineering', 'Backend Engineer', '2023-01-16'),
('Arjun Kapoor', 'arjun.kapoor@restaverse.com', 'Support', 'Customer Experience Specialist', '2022-09-12'),
('Tanvi Deshmukh', 'tanvi.deshmukh@restaverse.com', 'Design', 'Lead UI/UX Designer', '2021-12-01'),
('Karan Mehta', 'karan.mehta@restaverse.com', 'Operations', 'Integration Operations Manager', '2022-03-30'),
('Rhea Gupta', 'rhea.gupta@restaverse.com', 'Product', 'Data Analyst', '2023-05-18');
