import { client } from '../src/config/db';
import { hashPassword } from '../src/utils/crypto';

export async function seed1200Students() {
  console.log('Generating complete 1,200 student dataset for ADCET Ashta...');
  const startTime = Date.now();

  await client.execute('PRAGMA foreign_keys = OFF');

  const defaultPasswordHash = await hashPassword('Admin@12345');

  // 1. Academic Years
  await client.execute({
    sql: `INSERT OR REPLACE INTO academic_years (id, year_code, is_current, start_date, end_date)
          VALUES ('ay-2026-2027', '2026-2027', 1, '2026-07-01', '2027-05-31')`,
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

  // 3. Classes (Years 1 to 4, Div A & B for both programs = 16 classes)
  console.log('Creating classes for all 4 academic years...');
  const classList: { id: string; progId: string; year: number; div: string }[] = [];

  for (const p of programs) {
    for (let yr = 1; yr <= 4; yr++) {
      for (const div of ['A', 'B']) {
        const classId = `class-${String(p[1]).toLowerCase()}-y${yr}-${div.toLowerCase()}`;
        classList.push({ id: classId, progId: p[0] as string, year: yr, div });
        await client.execute({
          sql: `INSERT OR REPLACE INTO classes (id, program_id, academic_year_id, year, semester, division)
                VALUES (?, ?, 'ay-2026-2027', ?, ?, ?)`,
          args: [classId, p[0], yr, yr * 2 - 1, div],
        });
      }
    }
  }

  // 4. Subjects
  const subjects = [
    ['sub-ai501', 'AI501', 'Machine Learning & Pattern Recognition', 'prog-ai-ds', 3, 5, 4, 100, 50],
    ['sub-ai502', 'AI502', 'Deep Learning Architectures', 'prog-ai-ds', 3, 5, 4, 100, 50],
    ['sub-ai503', 'AI503', 'Big Data Engineering & Cloud Systems', 'prog-ai-ds', 3, 5, 3, 100, 25],
    ['sub-ai504', 'AI504', 'Natural Language Processing', 'prog-ai-ds', 3, 5, 3, 100, 25],
    ['sub-cs501', 'CS501', 'Theory of Computation', 'prog-cse', 3, 5, 4, 100, 50],
    ['sub-cs502', 'CS502', 'Database Management Systems', 'prog-cse', 3, 5, 4, 100, 50],
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
    ['u-superadmin', 'superadmin@adcet.in', 'EMP-001', 'SUPER_ADMIN'],
    ['u-registrar', 'registrar@adcet.in', 'EMP-002', 'ADMIN'],
    ['u-accounts', 'accounts@adcet.in', 'EMP-003', 'ACCOUNTS'],
    ['u-fac-01', 'dr.patil@adcet.in', 'EMP-011', 'FACULTY'],
    ['u-fac-02', 'prof.deshmukh@adcet.in', 'EMP-012', 'FACULTY'],
    ['u-fac-03', 'prof.kulkarni@adcet.in', 'EMP-013', 'FACULTY'],
    ['u-fac-04', 'prof.shinde@adcet.in', 'EMP-014', 'FACULTY'],
  ];

  for (const f of facultyUsers) {
    await client.execute({
      sql: `INSERT OR REPLACE INTO users (id, email, roll_number, password_hash, role, must_change_password, is_active)
            VALUES (?, ?, ?, ?, ?, 0, 1)`,
      args: [f[0], f[1], f[2], defaultPasswordHash, f[3]],
    });
  }

  // 6. 1,200 Realistic Indian Students
  const firstNames = [
    'Amit', 'Sneha', 'Rohan', 'Tanvi', 'Prathamesh', 'Ananya', 'Yash', 'Riddhi', 'Siddharth', 'Pooja',
    'Omkar', 'Shruti', 'Aditya', 'Kavya', 'Harshvardhan', 'Neha', 'Digvijay', 'Sakshi', 'Saurabh', 'Isha',
    'Abhishek', 'Priyanka', 'Sanket', 'Gauri', 'Nikhil', 'Manasi', 'Akshay', 'Sayali', 'Tejas', 'Deepika',
    'Kunal', 'Ashwini', 'Vishal', 'Swati', 'Suraj', 'Megha', 'Mayur', 'Komal', 'Pranav', 'Ruturaj'
  ]; // 40 first names

  const lastNames = [
    'Yedage', 'Deshmukh', 'Patil', 'Sawant', 'Joshi', 'Shinde', 'Pawar', 'Kadam', 'Mane', 'Jadhav',
    'Chavan', 'Bhosale', 'More', 'Gaikwad', 'Salunkhe', 'Thorat', 'Mohite', 'Kulkarni', 'Kamble', 'Tambe',
    'Ghadge', 'Surve', 'Koli', 'Mali', 'Ghatge', 'Sutar', 'Babar', 'Ghorpade', 'Ingale', 'Vhanmane'
  ]; // 30 last names

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

  console.log('Inserting 1,200 students into database...');

  // Use a transactional batch to ensure near-instant write performance
  const tx = await client.transaction('write');

  let studentIndex = 0;

  for (let f = 0; f < firstNames.length; f++) {
    for (let l = 0; l < lastNames.length; l++) {
      studentIndex++; // 1 to 1200

      const firstName = firstNames[f];
      const lastName = lastNames[l];
      const gender = (f % 2 === 0) ? 'MALE' : 'FEMALE';
      const bloodGroup = bloodGroups[(f + l) % bloodGroups.length];

      // Assign program: first 600 AI-DS, next 600 CSE
      const isAiDs = studentIndex <= 600;
      const progCode = isAiDs ? 'AIDS' : 'CSE';
      const progId = isAiDs ? 'prog-ai-ds' : 'prog-cse';

      // Assign academic year (1 to 4) - 150 students per year per department
      const progStudentIdx = isAiDs ? studentIndex : studentIndex - 600;
      const currentYear = Math.min(4, Math.floor((progStudentIdx - 1) / 150) + 1);

      // Assign division (A or B) - 75 students per division
      const yearStudentIdx = ((progStudentIdx - 1) % 150) + 1;
      const currentDivision = yearStudentIdx <= 75 ? 'A' : 'B';

      // Year prefix: 26 (First Year), 25 (Second Year), 24 (Third Year), 23 (Final Year)
      const yearPrefix = 27 - currentYear;
      const rollNumber = `${yearPrefix}${progCode}${String(yearStudentIdx).padStart(3, '0')}`;
      const enrollmentNumber = `EN${yearPrefix}${progCode}${String(yearStudentIdx).padStart(4, '0')}`;

      const userId = `u-stud-${studentIndex}`;
      const studentId = `s-stud-${studentIndex}`;
      const email = `${rollNumber.toLowerCase()}@adcet.in`;

      // Status variation: 98% ACTIVE, 1% DETAINED, 1% ON_LEAVE
      let status = 'ACTIVE';
      if (studentIndex % 85 === 0) status = 'DETAINED';
      else if (studentIndex % 115 === 0) status = 'ON_LEAVE';

      // Insert User
      await tx.execute({
        sql: `INSERT OR REPLACE INTO users (id, email, roll_number, password_hash, role, must_change_password, is_active)
              VALUES (?, ?, ?, ?, 'STUDENT', 0, 1)`,
        args: [userId, email, rollNumber, defaultPasswordHash],
      });

      // Insert Student
      const birthYear = 2008 - currentYear;
      const dob = `${birthYear}-${String((f % 12) + 1).padStart(2, '0')}-${String((l % 28) + 1).padStart(2, '0')}`;
      const guardianName = `Mr. Ramesh ${lastName}`;
      const guardianPhone = `9822${String(100000 + studentIndex).slice(0, 6)}`;

      await tx.execute({
        sql: `INSERT OR REPLACE INTO students (
                id, user_id, roll_number, enrollment_number, first_name, last_name,
                dob, gender, blood_group, personal_email, phone, guardian_name, guardian_phone,
                guardian_relation, guardian_consent_recorded, program_id, current_year,
                current_division, status
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Father', 1, ?, ?, ?, ?)`,
        args: [
          studentId,
          userId,
          rollNumber,
          enrollmentNumber,
          firstName,
          lastName,
          dob,
          gender,
          bloodGroup,
          `${firstName.toLowerCase()}.${lastName.toLowerCase()}@gmail.com`,
          `98${String(10000000 + studentIndex).slice(0, 8)}`,
          guardianName,
          guardianPhone,
          progId,
          currentYear,
          currentDivision,
          status,
        ],
      });

      // Enroll in corresponding Class
      const targetClass = classList.find(
        (c) => c.progId === progId && c.year === currentYear && c.div === currentDivision
      );
      if (targetClass) {
        await tx.execute({
          sql: `INSERT OR REPLACE INTO class_enrollments (id, class_id, student_id, roll_in_class)
                VALUES (?, ?, ?, ?)`,
          args: [`ce-${studentIndex}`, targetClass.id, studentId, yearStudentIdx],
        });
      }

      // 7. Fee Ledger Entries (Annual tuition: ₹85,000 = 8500000 paise)
      await tx.execute({
        sql: `INSERT OR REPLACE INTO fee_ledger_entries (
                id, student_id, financial_year, entry_type, amount_paise, payment_mode, notes, created_by_user_id
              ) VALUES (?, ?, '2026-2027', 'CHARGE', 8500000, 'ANNUAL_FEE', 'Annual Tuition & Development Fee', 'u-accounts')`,
        args: [`fle-chg-${studentIndex}`, studentId],
      });

      // Realistic payment distribution:
      // ~70% Fully Paid (2 installments)
      // ~20% Part Paid (1 installment)
      // ~10% Unpaid Defaulters
      if (studentIndex % 10 <= 6) {
        // Fully Paid
        await tx.execute({
          sql: `INSERT OR REPLACE INTO fee_ledger_entries (
                  id, student_id, financial_year, entry_type, amount_paise, receipt_number, payment_mode, notes, created_by_user_id
                ) VALUES (?, ?, '2026-2027', 'PAYMENT', 4250000, ?, 'UPI', '1st Term Installment', 'u-accounts')`,
          args: [`fle-p1-${studentIndex}`, studentId, studentIndex * 2],
        });
        await tx.execute({
          sql: `INSERT OR REPLACE INTO fee_ledger_entries (
                  id, student_id, financial_year, entry_type, amount_paise, receipt_number, payment_mode, notes, created_by_user_id
                ) VALUES (?, ?, '2026-2027', 'PAYMENT', 4250000, ?, 'NEFT_RTGS', '2nd Term Installment', 'u-accounts')`,
          args: [`fle-p2-${studentIndex}`, studentId, studentIndex * 2 + 1],
        });
      } else if (studentIndex % 10 <= 8) {
        // Part Paid
        await tx.execute({
          sql: `INSERT OR REPLACE INTO fee_ledger_entries (
                  id, student_id, financial_year, entry_type, amount_paise, receipt_number, payment_mode, notes, created_by_user_id
                ) VALUES (?, ?, '2026-2027', 'PAYMENT', 4250000, ?, 'CHEQUE', 'Part Payment Cleared', 'u-accounts')`,
          args: [`fle-p1-${studentIndex}`, studentId, studentIndex * 2],
        });
      }
      // Remaining 10% have balance of ₹85,000 for Defaulter exports!
    }
  }

  await tx.commit();

  // 8. Update receipt sequence
  await client.execute({
    sql: `INSERT OR REPLACE INTO receipt_sequences (financial_year, last_receipt_number)
          VALUES ('2026-2027', 2500)`,
  });

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`✅ Successfully seeded exactly 1,200 students across 4 academic years in ${durationSec}s!`);
}

seed1200Students().catch((err) => {
  console.error('Failed to seed 1200 students:', err);
  throw err;
});
