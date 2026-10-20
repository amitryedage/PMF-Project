INSERT OR IGNORE INTO academic_years (id, year_code, is_current, start_date, end_date)
VALUES ('ay-2026-2027', '2026-2027', 1, '2026-07-01', '2027-05-31');

INSERT OR IGNORE INTO programs (id, code, name, degree, department, duration_years)
VALUES 
    ('prog-ai-ds', 'AI-DS', 'Artificial Intelligence and Data Science', 'B.Tech', 'Department of AI & Data Science', 4),
    ('prog-cse', 'CSE', 'Computer Science and Engineering', 'B.Tech', 'Department of Computer Science', 4);

-- Default password is 'Admin@12345'
INSERT OR IGNORE INTO users (id, email, roll_number, password_hash, role, must_change_password, is_active)
VALUES 
    ('u-superadmin', 'superadmin@adcet.in', 'EMP-001', '$2a$12$Jq6Y3OFnym8Bk2/GcbGBguQ0HQruDhDzlciqa/hbVsL1g.Btqrmp.', 'SUPER_ADMIN', 0, 1),
    ('u-registrar', 'registrar@adcet.in', 'EMP-002', '$2a$12$Jq6Y3OFnym8Bk2/GcbGBguQ0HQruDhDzlciqa/hbVsL1g.Btqrmp.', 'ADMIN', 0, 1),
    ('u-accounts', 'accounts@adcet.in', 'EMP-003', '$2a$12$Jq6Y3OFnym8Bk2/GcbGBguQ0HQruDhDzlciqa/hbVsL1g.Btqrmp.', 'ACCOUNTS', 0, 1),
    ('u-faculty', 'faculty.ai@adcet.in', 'EMP-010', '$2a$12$Jq6Y3OFnym8Bk2/GcbGBguQ0HQruDhDzlciqa/hbVsL1g.Btqrmp.', 'FACULTY', 0, 1),
    ('u-student', 'student.demo@adcet.in', '26AIDS001', '$2a$12$Jq6Y3OFnym8Bk2/GcbGBguQ0HQruDhDzlciqa/hbVsL1g.Btqrmp.', 'STUDENT', 0, 1);

INSERT OR IGNORE INTO students (
    id, user_id, roll_number, enrollment_number, first_name, last_name,
    dob, gender, guardian_name, guardian_phone, guardian_relation,
    program_id, current_year, current_division, status
) VALUES (
    's-demo-001', 'u-student', '26AIDS001', 'EN2026001', 'Amit', 'Yedage',
    '2005-04-12', 'MALE', 'Ramesh Yedage', '9876543210', 'Father',
    'prog-ai-ds', 4, 'A', 'ACTIVE'
);
