INSERT INTO academic_years (year_code, is_current, start_date, end_date)
VALUES ('2026-2027', TRUE, '2026-07-01', '2027-05-31')
ON CONFLICT (year_code) DO NOTHING;

INSERT INTO programs (code, name, degree, department, duration_years)
VALUES 
    ('AI-DS', 'Artificial Intelligence and Data Science', 'B.Tech', 'Department of AI & Data Science', 4),
    ('CSE', 'Computer Science and Engineering', 'B.Tech', 'Department of Computer Science', 4)
ON CONFLICT (code) DO NOTHING;

-- Default password is 'Admin@12345' (bcrypt hash)
INSERT INTO users (email, roll_number, password_hash, role, must_change_password, is_active)
VALUES 
    ('superadmin@adcet.in', 'EMP-001', '$2b$12$0k4d5JjS7YwAeg027m7Gbe2tUa6e3xY0mBqH.yI4tG0YlqV02n6ea', 'SUPER_ADMIN', FALSE, TRUE),
    ('registrar@adcet.in', 'EMP-002', '$2b$12$0k4d5JjS7YwAeg027m7Gbe2tUa6e3xY0mBqH.yI4tG0YlqV02n6ea', 'ADMIN', FALSE, TRUE),
    ('accounts@adcet.in', 'EMP-003', '$2b$12$0k4d5JjS7YwAeg027m7Gbe2tUa6e3xY0mBqH.yI4tG0YlqV02n6ea', 'ACCOUNTS', FALSE, TRUE),
    ('faculty.ai@adcet.in', 'EMP-010', '$2b$12$0k4d5JjS7YwAeg027m7Gbe2tUa6e3xY0mBqH.yI4tG0YlqV02n6ea', 'FACULTY', FALSE, TRUE),
    ('student.demo@adcet.in', '26AIDS001', '$2b$12$0k4d5JjS7YwAeg027m7Gbe2tUa6e3xY0mBqH.yI4tG0YlqV02n6ea', 'STUDENT', FALSE, TRUE)
ON CONFLICT DO NOTHING;
