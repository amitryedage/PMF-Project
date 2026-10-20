CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

CREATE TYPE user_role AS ENUM ('STUDENT', 'FACULTY', 'ADMIN', 'ACCOUNTS', 'SUPER_ADMIN');
CREATE TYPE student_status AS ENUM ('ACTIVE', 'DETAINED', 'ON_LEAVE', 'GRADUATED', 'WITHDRAWN');
CREATE TYPE attendance_status AS ENUM ('PRESENT', 'ABSENT', 'LATE');
CREATE TYPE ledger_entry_type AS ENUM ('CHARGE', 'PAYMENT', 'WAIVER', 'REFUND', 'REVERSAL');
CREATE TYPE exam_type AS ENUM ('INTERNAL_1', 'INTERNAL_2', 'MID_TERM', 'END_TERM', 'PRACTICAL');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    roll_number VARCHAR(64),
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    must_change_password BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    failed_login_attempts INT NOT NULL DEFAULT 0,
    locked_until TIMESTAMPTZ,
    totp_secret VARCHAR(128),
    totp_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX idx_users_email_active ON users (LOWER(email)) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_users_roll_number_active ON users (roll_number) WHERE deleted_at IS NULL AND roll_number IS NOT NULL;

CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_lookup ON refresh_tokens (user_id, token_hash) WHERE revoked_at IS NULL;

CREATE TABLE programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(32) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    degree VARCHAR(64) NOT NULL,
    department VARCHAR(128) NOT NULL,
    duration_years INT NOT NULL DEFAULT 4,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE academic_years (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    year_code VARCHAR(16) NOT NULL UNIQUE,
    is_current BOOLEAN NOT NULL DEFAULT FALSE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE RESTRICT,
    roll_number VARCHAR(64) NOT NULL,
    enrollment_number VARCHAR(64) NOT NULL,
    first_name VARCHAR(128) NOT NULL,
    last_name VARCHAR(128) NOT NULL,
    full_name_marathi VARCHAR(255),
    dob DATE NOT NULL,
    gender VARCHAR(16) NOT NULL,
    blood_group VARCHAR(8),
    personal_email VARCHAR(255),
    phone VARCHAR(20),
    guardian_name VARCHAR(128),
    guardian_phone VARCHAR(20),
    guardian_relation VARCHAR(64),
    guardian_consent_recorded BOOLEAN NOT NULL DEFAULT FALSE,
    program_id UUID NOT NULL REFERENCES programs(id) ON DELETE RESTRICT,
    current_year INT NOT NULL CHECK (current_year BETWEEN 1 AND 5),
    current_division VARCHAR(16) NOT NULL DEFAULT 'A',
    status student_status NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX idx_students_roll_number ON students (roll_number) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_students_enrollment_number ON students (enrollment_number) WHERE deleted_at IS NULL;
CREATE INDEX idx_students_search_name ON students USING gin ((first_name || ' ' || last_name) gin_trgm_ops);

CREATE TABLE subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(32) NOT NULL,
    name VARCHAR(255) NOT NULL,
    program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    year INT NOT NULL CHECK (year BETWEEN 1 AND 5),
    semester INT NOT NULL CHECK (semester BETWEEN 1 AND 10),
    credits INT NOT NULL DEFAULT 3,
    max_theory_marks INT NOT NULL DEFAULT 100,
    max_practical_marks INT NOT NULL DEFAULT 50,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (code, program_id)
);

CREATE TABLE classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE RESTRICT,
    year INT NOT NULL CHECK (year BETWEEN 1 AND 5),
    semester INT NOT NULL CHECK (semester BETWEEN 1 AND 10),
    division VARCHAR(16) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (program_id, academic_year_id, year, semester, division)
);

CREATE TABLE class_enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    roll_in_class INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (class_id, student_id)
);

CREATE TABLE faculty_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    faculty_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (faculty_user_id, subject_id, class_id)
);

CREATE TABLE attendance_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    faculty_assignment_id UUID NOT NULL REFERENCES faculty_assignments(id) ON DELETE RESTRICT,
    session_date DATE NOT NULL,
    session_hour INT NOT NULL CHECK (session_hour BETWEEN 1 AND 10),
    topic VARCHAR(255),
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (faculty_assignment_id, session_date, session_hour)
);

CREATE TABLE attendance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
    status attendance_status NOT NULL DEFAULT 'PRESENT',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (session_id, student_id)
);

CREATE TABLE exams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    name VARCHAR(128) NOT NULL,
    exam_type exam_type NOT NULL,
    max_marks NUMERIC(5,2) NOT NULL CHECK (max_marks > 0),
    exam_date DATE NOT NULL,
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (class_id, subject_id, name)
);

CREATE TABLE marks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
    score NUMERIC(5,2) CHECK (score >= 0),
    is_absent BOOLEAN NOT NULL DEFAULT FALSE,
    remarks VARCHAR(255),
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (exam_id, student_id)
);

CREATE TABLE result_revisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mark_id UUID NOT NULL REFERENCES marks(id) ON DELETE CASCADE,
    previous_score NUMERIC(5,2),
    new_score NUMERIC(5,2),
    previous_absent BOOLEAN NOT NULL,
    new_absent BOOLEAN NOT NULL,
    reason TEXT NOT NULL,
    revised_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE fee_structures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE RESTRICT,
    year INT NOT NULL CHECK (year BETWEEN 1 AND 5),
    category VARCHAR(64) NOT NULL DEFAULT 'OPEN',
    total_amount_paise BIGINT NOT NULL CHECK (total_amount_paise >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (program_id, academic_year_id, year, category)
);

CREATE TABLE receipt_sequences (
    financial_year VARCHAR(9) PRIMARY KEY,
    last_receipt_number BIGINT NOT NULL DEFAULT 0
);

CREATE TABLE fee_ledger_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
    financial_year VARCHAR(9) NOT NULL,
    entry_type ledger_entry_type NOT NULL,
    amount_paise BIGINT NOT NULL CHECK (amount_paise > 0),
    receipt_number BIGINT,
    payment_mode VARCHAR(32),
    notes TEXT,
    created_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    reversed_entry_id UUID REFERENCES fee_ledger_entries(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_fee_ledger_student ON fee_ledger_entries (student_id, financial_year);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(64) NOT NULL,
    entity_type VARCHAR(64) NOT NULL,
    entity_id VARCHAR(64) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_actor ON audit_logs (actor_user_id, created_at DESC);
CREATE INDEX idx_audit_logs_entity ON audit_logs (entity_type, entity_id);

CREATE OR REPLACE FUNCTION get_next_receipt_number(p_fy VARCHAR) 
RETURNS BIGINT AS $$
DECLARE
    v_next_no BIGINT;
BEGIN
    INSERT INTO receipt_sequences (financial_year, last_receipt_number)
    VALUES (p_fy, 1)
    ON CONFLICT (financial_year) DO UPDATE
    SET last_receipt_number = receipt_sequences.last_receipt_number + 1
    RETURNING last_receipt_number INTO v_next_no;
    RETURN v_next_no;
END;
$$ LANGUAGE plpgsql;

CREATE RULE prevent_update_ledger AS ON UPDATE TO fee_ledger_entries DO INSTEAD NOTHING;
CREATE RULE prevent_delete_ledger AS ON DELETE TO fee_ledger_entries DO INSTEAD NOTHING;
CREATE RULE prevent_update_audit AS ON UPDATE TO audit_logs DO INSTEAD NOTHING;
CREATE RULE prevent_delete_audit AS ON DELETE TO audit_logs DO INSTEAD NOTHING;
