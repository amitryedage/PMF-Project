import { client } from '../src/config/db';
import { hashPassword } from '../src/utils/crypto';

export async function seedRichData() {
  console.log('Seeding rich, realistic college dataset for ADCET Ashta...');

  await client.execute('PRAGMA foreign_keys = OFF');

  const defaultPasswordHash = await hashPassword('Admin@12345');

  // 1. Academic Years
  await client.execute({
    sql: `INSERT OR REPLACE INTO academic_years (id, year_code, is_current, start_date, end_date)
          VALUES (?, ?, 1, '2026-07-01', '2027-05-31')`,
    args: ['ay-2026-2027', '2026-2027'],
  });

  // 2. Programs
  const programs = [
    ['prog-ai-ds', 'AI-DS', 'Artificial Intelligence and Data Science', 'B.Tech', 'Department of AI & Data Science', 4],
    ['prog-cse', 'CSE', 'Computer Science and Engineering', 'B.Tech', 'Department of Computer Science', 4],
  ];

  for (const p of programs) {
    await client.execute({
      sql: `INSERT OR REPLACE INTO programs (id, code, name, degree, department, duration_years)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: p,
    });
  }

  // 3. Classes
  const classes = [
    ['class-aids-3a', 'prog-ai-ds', 'ay-2026-2027', 3, 5, 'A'],
    ['class-aids-3b', 'prog-ai-ds', 'ay-2026-2027', 3, 5, 'B'],
    ['class-aids-4a', 'prog-ai-ds', 'ay-2026-2027', 4, 7, 'A'],
  ];

  for (const c of classes) {
    await client.execute({
      sql: `INSERT OR REPLACE INTO classes (id, program_id, academic_year_id, year, semester, division)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: c,
    });
  }

  // 4. Subjects
  const subjects = [
    ['sub-ai501', 'AI501', 'Machine Learning & Pattern Recognition', 'prog-ai-ds', 3, 5, 4, 100, 50],
    ['sub-ai502', 'AI502', 'Deep Learning Architectures', 'prog-ai-ds', 3, 5, 4, 100, 50],
    ['sub-ai503', 'AI503', 'Big Data Engineering & Cloud Systems', 'prog-ai-ds', 3, 5, 3, 100, 25],
    ['sub-ai504', 'AI504', 'Natural Language Processing', 'prog-ai-ds', 3, 5, 3, 100, 25],
  ];

  for (const s of subjects) {
    await client.execute({
      sql: `INSERT OR REPLACE INTO subjects (id, code, name, program_id, year, semester, credits, max_theory_marks, max_practical_marks)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: s,
    });
  }

  // 5. Faculty Staff Accounts
  const facultyUsers = [
    ['u-fac-01', 'dr.patil@adcet.in', 'EMP-011', 'Dr. S. K. Patil', 'HOD AI & DS'],
    ['u-fac-02', 'prof.deshmukh@adcet.in', 'EMP-012', 'Prof. P. V. Deshmukh', 'Assistant Professor'],
    ['u-fac-03', 'prof.kulkarni@adcet.in', 'EMP-013', 'Prof. A. B. Kulkarni', 'Assistant Professor'],
    ['u-fac-04', 'prof.shinde@adcet.in', 'EMP-014', 'Prof. R. M. Shinde', 'Assistant Professor'],
  ];

  for (const f of facultyUsers) {
    await client.execute({
      sql: `INSERT OR REPLACE INTO users (id, email, roll_number, password_hash, role, must_change_password, is_active)
            VALUES (?, ?, ?, ?, 'FACULTY', 0, 1)`,
      args: [f[0], f[1], f[2], defaultPasswordHash],
    });
  }

  // 6. Faculty Assignments
  const assignments = [
    ['fa-01', 'u-fac-02', 'sub-ai501', 'class-aids-3a'],
    ['fa-02', 'u-fac-03', 'sub-ai502', 'class-aids-3a'],
    ['fa-03', 'u-fac-04', 'sub-ai503', 'class-aids-3a'],
    ['fa-04', 'u-fac-01', 'sub-ai504', 'class-aids-3a'],
  ];

  for (const a of assignments) {
    await client.execute({
      sql: `INSERT OR REPLACE INTO faculty_assignments (id, faculty_user_id, subject_id, class_id)
            VALUES (?, ?, ?, ?)`,
      args: a,
    });
  }

  // 7. 20 Realistic Students
  const studentData = [
    ['26AIDS001', 'EN260101', 'Amit', 'Yedage', 'अमित येडगे', '2005-04-12', 'MALE', 'A+', 'Ramesh Yedage', '9822011223', 'Father', 'ACTIVE', 'A'],
    ['26AIDS002', 'EN260102', 'Sneha', 'Deshmukh', 'स्नेहा देशमुख', '2005-06-18', 'FEMALE', 'B+', 'Vijay Deshmukh', '9822011224', 'Father', 'ACTIVE', 'A'],
    ['26AIDS003', 'EN260103', 'Rohan', 'Patil', 'रोहन पाटील', '2005-01-22', 'MALE', 'O+', 'Sunil Patil', '9822011225', 'Father', 'ACTIVE', 'A'],
    ['26AIDS004', 'EN260104', 'Tanvi', 'Sawant', 'तन्वी सावंत', '2005-08-09', 'FEMALE', 'A+', 'Mahesh Sawant', '9822011226', 'Father', 'ACTIVE', 'A'],
    ['26AIDS005', 'EN260105', 'Prathamesh', 'Joshi', 'प्रथमेश जोशी', '2004-11-30', 'MALE', 'B-', 'Anand Joshi', '9822011227', 'Father', 'ACTIVE', 'A'],
    ['26AIDS006', 'EN260106', 'Ananya', 'Shinde', 'अनन्या शिंदे', '2005-03-14', 'FEMALE', 'O-', 'Dipak Shinde', '9822011228', 'Father', 'ACTIVE', 'A'],
    ['26AIDS007', 'EN260107', 'Yash', 'Pawar', 'यश पवार', '2005-09-25', 'MALE', 'AB+', 'Sachin Pawar', '9822011229', 'Father', 'DETAINED', 'A'],
    ['26AIDS008', 'EN260108', 'Riddhi', 'Kadam', 'रिद्धी कदम', '2005-05-19', 'FEMALE', 'A+', 'Ganesh Kadam', '9822011230', 'Father', 'ACTIVE', 'A'],
    ['26AIDS009', 'EN260109', 'Siddharth', 'Mane', 'सिद्धार्थ माने', '2005-07-07', 'MALE', 'B+', 'Rajendra Mane', '9822011231', 'Father', 'ACTIVE', 'A'],
    ['26AIDS010', 'EN260110', 'Pooja', 'Jadhav', 'पूजा जाधव', '2005-02-11', 'FEMALE', 'O+', 'Ashok Jadhav', '9822011232', 'Father', 'ACTIVE', 'A'],
    ['26AIDS011', 'EN260111', 'Omkar', 'Chavan', 'ओंकार चव्हाण', '2004-12-05', 'MALE', 'A+', 'Prakash Chavan', '9822011233', 'Father', 'ACTIVE', 'B'],
    ['26AIDS012', 'EN260112', 'Shruti', 'Bhosale', 'श्रुती भोसले', '2005-10-16', 'FEMALE', 'B+', 'Suresh Bhosale', '9822011234', 'Father', 'ACTIVE', 'B'],
    ['26AIDS013', 'EN260113', 'Aditya', 'More', 'आदित्य मोरे', '2005-04-29', 'MALE', 'O+', 'Nitin More', '9822011235', 'Father', 'ACTIVE', 'B'],
    ['26AIDS014', 'EN260114', 'Kavya', 'Gaikwad', 'काव्या गायकवाड', '2005-08-21', 'FEMALE', 'A-', 'Vikas Gaikwad', '9822011236', 'Father', 'ACTIVE', 'B'],
    ['26AIDS015', 'EN260115', 'Harshvardhan', 'Salunkhe', 'हर्षवर्धन साळुंखे', '2005-01-15', 'MALE', 'B+', 'Ajit Salunkhe', '9822011237', 'Father', 'ACTIVE', 'B'],
    ['26AIDS016', 'EN260116', 'Neha', 'Thorat', 'नेहा थोरात', '2005-06-03', 'FEMALE', 'O+', 'Sanjay Thorat', '9822011238', 'Father', 'ON_LEAVE', 'B'],
    ['26AIDS017', 'EN260117', 'Digvijay', 'Mohite', 'दिग्विजय मोहिते', '2004-10-28', 'MALE', 'A+', 'Hanmant Mohite', '9822011239', 'Father', 'ACTIVE', 'B'],
    ['26AIDS018', 'EN260118', 'Sakshi', 'Kulkarni', 'साक्षी कुलकर्णी', '2005-07-22', 'FEMALE', 'AB+', 'Milind Kulkarni', '9822011240', 'Father', 'ACTIVE', 'B'],
    ['26AIDS019', 'EN260119', 'Saurabh', 'Kamble', 'सौरभ कांबळे', '2005-03-31', 'MALE', 'B-', 'Arun Kamble', '9822011241', 'Father', 'ACTIVE', 'B'],
    ['26AIDS020', 'EN260120', 'Isha', 'Tambe', 'ईशा तांबे', '2005-11-12', 'FEMALE', 'O+', 'Shrikant Tambe', '9822011242', 'Father', 'ACTIVE', 'B'],
  ];

  const studentIds: string[] = [];

  for (let i = 0; i < studentData.length; i++) {
    const s = studentData[i];
    const userId = `u-stud-${i + 1}`;
    const studentId = `s-stud-${i + 1}`;
    studentIds.push(studentId);

    const email = `${s[0].toLowerCase()}@adcet.in`;

    await client.execute({
      sql: `INSERT OR REPLACE INTO users (id, email, roll_number, password_hash, role, must_change_password, is_active)
            VALUES (?, ?, ?, ?, 'STUDENT', 0, 1)`,
      args: [userId, email, s[0], defaultPasswordHash],
    });

    await client.execute({
      sql: `INSERT OR REPLACE INTO students (
              id, user_id, roll_number, enrollment_number, first_name, last_name, full_name_marathi,
              dob, gender, blood_group, personal_email, phone, guardian_name, guardian_phone,
              guardian_relation, guardian_consent_recorded, program_id, current_year,
              current_division, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'prog-ai-ds', 3, ?, ?)`,
      args: [
        studentId,
        userId,
        s[0],
        s[1],
        s[2],
        s[3],
        s[4],
        s[5],
        s[6],
        s[7],
        `${s[2].toLowerCase()}.${s[3].toLowerCase()}@gmail.com`,
        `98${Math.floor(10000000 + Math.random() * 90000000)}`,
        s[8],
        s[9],
        s[10],
        s[12],
        s[11],
      ],
    });

    const classId = s[12] === 'A' ? 'class-aids-3a' : 'class-aids-3b';
    await client.execute({
      sql: `INSERT OR REPLACE INTO class_enrollments (id, class_id, student_id, roll_in_class)
            VALUES (?, ?, ?, ?)`,
      args: [`ce-${i + 1}`, classId, studentId, i + 1],
    });
  }

  // 8. Attendance Sessions & Records (10 sessions across subjects)
  console.log('Seeding attendance sessions and records...');
  for (let sIdx = 1; sIdx <= 8; sIdx++) {
    const sessionId = `att-sess-${sIdx}`;
    const faId = assignments[(sIdx - 1) % assignments.length][0];
    const sessionDate = `2026-10-${String(sIdx + 5).padStart(2, '0')}`;

    await client.execute({
      sql: `INSERT OR REPLACE INTO attendance_sessions (id, faculty_assignment_id, session_date, session_hour, topic, version)
            VALUES (?, ?, ?, ?, ?, 1)`,
      args: [sessionId, faId, sessionDate, ((sIdx - 1) % 4) + 1, `Lecture ${sIdx}: Practical Implementation`],
    });

    for (let stIdx = 0; stIdx < studentIds.length; stIdx++) {
      const studentId = studentIds[stIdx];
      // Simulate defaulter for student 7 and 9, high attendance for others
      let status = 'PRESENT';
      if (stIdx === 6) status = sIdx % 2 === 0 ? 'ABSENT' : 'PRESENT'; // 50%
      else if (stIdx === 8) status = sIdx % 3 === 0 ? 'ABSENT' : 'PRESENT'; // 66%
      else if (Math.random() < 0.1) status = 'ABSENT';

      await client.execute({
        sql: `INSERT OR REPLACE INTO attendance_records (id, session_id, student_id, status)
              VALUES (?, ?, ?, ?)`,
        args: [`ar-${sIdx}-${stIdx}`, sessionId, studentId, status],
      });
    }
  }

  // 9. Exams and Marks
  console.log('Seeding exams and grade marks...');
  const exams = [
    ['exam-01', 'class-aids-3a', 'sub-ai501', 'Mid-Term Exam', 'MID_TERM', 50, '2026-09-20', 1, '2026-09-25'],
    ['exam-02', 'class-aids-3a', 'sub-ai502', 'Mid-Term Exam', 'MID_TERM', 50, '2026-09-22', 1, '2026-09-25'],
    ['exam-03', 'class-aids-3a', 'sub-ai503', 'Mid-Term Exam', 'MID_TERM', 50, '2026-09-24', 1, '2026-09-25'],
    ['exam-04', 'class-aids-3a', 'sub-ai504', 'Mid-Term Exam', 'MID_TERM', 50, '2026-09-26', 1, '2026-09-25'],
  ];

  for (const ex of exams) {
    await client.execute({
      sql: `INSERT OR REPLACE INTO exams (id, class_id, subject_id, name, exam_type, max_marks, exam_date, is_published, published_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: ex,
    });

    for (let stIdx = 0; stIdx < 10; stIdx++) {
      const studentId = studentIds[stIdx];
      const baseScore = 32 + (stIdx % 15);
      const score = Math.min(48, Math.max(18, baseScore));

      await client.execute({
        sql: `INSERT OR REPLACE INTO marks (id, exam_id, student_id, score, is_absent, remarks, version)
              VALUES (?, ?, ?, ?, 0, 'Good comprehension', 1)`,
        args: [`mk-${ex[0]}-${stIdx}`, ex[0], studentId, score],
      });
    }
  }

  // 10. Fee Structures and Ledgers
  console.log('Seeding fee structures and ledger receipts...');
  await client.execute({
    sql: `INSERT OR REPLACE INTO fee_structures (id, program_id, academic_year_id, year, category, total_amount_paise)
          VALUES ('fee-aids-y3', 'prog-ai-ds', 'ay-2026-2027', 3, 'OPEN', 8500000)`,
  });

  for (let stIdx = 0; stIdx < studentIds.length; stIdx++) {
    const studentId = studentIds[stIdx];
    const receiptNum = stIdx + 1;

    // First: Charge of 85,000 INR
    await client.execute({
      sql: `INSERT OR REPLACE INTO fee_ledger_entries (
              id, student_id, financial_year, entry_type, amount_paise, payment_mode, notes, created_by_user_id
            ) VALUES (?, ?, '2026-2027', 'CHARGE', 8500000, 'ANNUAL_FEE', 'Annual Tuition & Development Fee', 'u-accounts')`,
      args: [`fle-chg-${stIdx}`, studentId],
    });

    // Payment variation: Fully paid vs 50% paid vs Defaulter (0 paid)
    if (stIdx < 12) {
      // 100% Paid (2 installments of 42,500)
      await client.execute({
        sql: `INSERT OR REPLACE INTO fee_ledger_entries (
                id, student_id, financial_year, entry_type, amount_paise, receipt_number, payment_mode, notes, created_by_user_id
              ) VALUES (?, ?, '2026-2027', 'PAYMENT', 4250000, ?, 'UPI', '1st Term Installment', 'u-accounts')`,
        args: [`fle-pay1-${stIdx}`, studentId, receiptNum * 2],
      });
      await client.execute({
        sql: `INSERT OR REPLACE INTO fee_ledger_entries (
                id, student_id, financial_year, entry_type, amount_paise, receipt_number, payment_mode, notes, created_by_user_id
              ) VALUES (?, ?, '2026-2027', 'PAYMENT', 4250000, ?, 'NEFT_RTGS', '2nd Term Installment', 'u-accounts')`,
        args: [`fle-pay2-${stIdx}`, studentId, receiptNum * 2 + 1],
      });
    } else if (stIdx < 17) {
      // 50% Paid (42,500 pending)
      await client.execute({
        sql: `INSERT OR REPLACE INTO fee_ledger_entries (
                id, student_id, financial_year, entry_type, amount_paise, receipt_number, payment_mode, notes, created_by_user_id
              ) VALUES (?, ?, '2026-2027', 'PAYMENT', 4250000, ?, 'CHEQUE', 'Part Payment Cleared', 'u-accounts')`,
        args: [`fle-pay1-${stIdx}`, studentId, receiptNum * 2],
      });
    }
    // stIdx >= 17 are 100% defaulters (0 paid, 85,000 balance) for testing defaulters export!
  }

  // Update receipt sequence counter
  await client.execute({
    sql: `INSERT OR REPLACE INTO receipt_sequences (financial_year, last_receipt_number)
          VALUES ('2026-2027', 150)`,
  });

  console.log('✅ Rich demo dataset seeded successfully!');
}

seedRichData().catch((err) => {
  console.error('Failed to seed rich dataset:', err);
  process.exit(1);
});
