CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    roll_number TEXT,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL,
    must_change_password INTEGER NOT NULL DEFAULT 1,
    is_active INTEGER NOT NULL DEFAULT 1,
    failed_login_attempts INTEGER NOT NULL DEFAULT 0,
    locked_until TEXT,
    totp_secret TEXT,
    totp_enabled INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_active ON users (LOWER(email)) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_roll_number_active ON users (roll_number) WHERE deleted_at IS NULL AND roll_number IS NOT NULL;

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    revoked_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_lookup ON refresh_tokens (user_id, token_hash) WHERE revoked_at IS NULL;

CREATE TABLE IF NOT EXISTS programs (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    degree TEXT NOT NULL,
    department TEXT NOT NULL,
    duration_years INTEGER NOT NULL DEFAULT 4,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS academic_years (
    id TEXT PRIMARY KEY,
    year_code TEXT NOT NULL UNIQUE,
    is_current INTEGER NOT NULL DEFAULT 0,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS students (
    id TEXT PRIMARY KEY,
    user_id TEXT UNIQUE REFERENCES users(id) ON DELETE RESTRICT,
    roll_number TEXT NOT NULL,
    enrollment_number TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    full_name_marathi TEXT,
    dob TEXT NOT NULL,
    gender TEXT NOT NULL,
    blood_group TEXT,
    personal_email TEXT,
    phone TEXT,
    guardian_name TEXT NOT NULL,
    guardian_phone TEXT NOT NULL,
    guardian_relation TEXT NOT NULL,
    guardian_consent_recorded INTEGER NOT NULL DEFAULT 0,
    program_id TEXT NOT NULL REFERENCES programs(id) ON DELETE RESTRICT,
    current_year INTEGER NOT NULL,
    current_division TEXT NOT NULL DEFAULT 'A',
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_students_roll_number ON students (roll_number) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_students_enrollment_number ON students (enrollment_number) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS subjects (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    program_id TEXT NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    semester INTEGER NOT NULL,
    credits INTEGER NOT NULL DEFAULT 3,
    max_theory_marks INTEGER NOT NULL DEFAULT 100,
    max_practical_marks INTEGER NOT NULL DEFAULT 50,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (code, program_id)
);

CREATE TABLE IF NOT EXISTS classes (
    id TEXT PRIMARY KEY,
    program_id TEXT NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    academic_year_id TEXT NOT NULL REFERENCES academic_years(id) ON DELETE RESTRICT,
    year INTEGER NOT NULL,
    semester INTEGER NOT NULL,
    division TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (program_id, academic_year_id, year, semester, division)
);

CREATE TABLE IF NOT EXISTS class_enrollments (
    id TEXT PRIMARY KEY,
    class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    roll_in_class INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (class_id, student_id)
);

CREATE TABLE IF NOT EXISTS faculty_assignments (
    id TEXT PRIMARY KEY,
    faculty_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (faculty_user_id, subject_id, class_id)
);

CREATE TABLE IF NOT EXISTS attendance_sessions (
    id TEXT PRIMARY KEY,
    faculty_assignment_id TEXT NOT NULL REFERENCES faculty_assignments(id) ON DELETE RESTRICT,
    session_date TEXT NOT NULL,
    session_hour INTEGER NOT NULL,
    topic TEXT,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (faculty_assignment_id, session_date, session_hour)
);

CREATE TABLE IF NOT EXISTS attendance_records (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
    status TEXT NOT NULL DEFAULT 'PRESENT',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (session_id, student_id)
);

CREATE TABLE IF NOT EXISTS exams (
    id TEXT PRIMARY KEY,
    class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    exam_type TEXT NOT NULL,
    max_marks REAL NOT NULL,
    exam_date TEXT NOT NULL,
    is_published INTEGER NOT NULL DEFAULT 0,
    published_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (class_id, subject_id, name)
);

CREATE TABLE IF NOT EXISTS marks (
    id TEXT PRIMARY KEY,
    exam_id TEXT NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
    score REAL,
    is_absent INTEGER NOT NULL DEFAULT 0,
    remarks TEXT,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (exam_id, student_id)
);

CREATE TABLE IF NOT EXISTS result_revisions (
    id TEXT PRIMARY KEY,
    mark_id TEXT NOT NULL REFERENCES marks(id) ON DELETE CASCADE,
    previous_score REAL,
    new_score REAL,
    previous_absent INTEGER NOT NULL,
    new_absent INTEGER NOT NULL,
    reason TEXT NOT NULL,
    revised_by_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS fee_structures (
    id TEXT PRIMARY KEY,
    program_id TEXT NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    academic_year_id TEXT NOT NULL REFERENCES academic_years(id) ON DELETE RESTRICT,
    year INTEGER NOT NULL,
    category TEXT NOT NULL DEFAULT 'OPEN',
    total_amount_paise INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (program_id, academic_year_id, year, category)
);

CREATE TABLE IF NOT EXISTS receipt_sequences (
    financial_year TEXT PRIMARY KEY,
    last_receipt_number INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS fee_ledger_entries (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
    financial_year TEXT NOT NULL,
    entry_type TEXT NOT NULL,
    amount_paise INTEGER NOT NULL,
    receipt_number INTEGER,
    payment_mode TEXT,
    notes TEXT,
    created_by_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    reversed_entry_id TEXT REFERENCES fee_ledger_entries(id) ON DELETE RESTRICT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_fee_ledger_student ON fee_ledger_entries (student_id, financial_year);

CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    actor_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    old_values TEXT,
    new_values TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs (actor_user_id, created_at DESC);
