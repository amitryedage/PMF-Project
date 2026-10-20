import React from 'react';
import { GraduationCap, Award, FileText } from 'lucide-react';

export const Marks: React.FC = () => {
  const sampleExams = [
    { code: 'AI401', subject: 'Machine Learning', exam: 'Mid-Term Exam', max: 50, score: 44, grade: 'O', status: 'PASS' },
    { code: 'AI402', subject: 'Deep Learning Architectures', exam: 'Mid-Term Exam', max: 50, score: 41, grade: 'A+', status: 'PASS' },
    { code: 'AI403', subject: 'Data Engineering & Cloud Systems', exam: 'Mid-Term Exam', max: 50, score: 38, grade: 'A', status: 'PASS' },
    { code: 'AI404', subject: 'Probability & Applied Statistics', exam: 'Mid-Term Exam', max: 50, score: 36, grade: 'B+', status: 'PASS' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--primary)' }}>Examinations & Grade Cards</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            Semester grades, score transcripts, and SGPA performance record
          </p>
        </div>
        <button className="btn btn-secondary">
          <FileText size={16} />
          <span>Download PDF Grade Sheet</span>
        </button>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              padding: '16px',
              borderRadius: '12px',
              backgroundColor: 'var(--accent-light)',
              color: 'var(--accent)',
            }}
          >
            <Award size={32} />
          </div>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>
              SEMESTER IV SGPA
            </div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--primary)' }}>
              8.80 / 10.00
            </div>
            <div style={{ fontSize: '13px', color: 'var(--success)', fontWeight: 600 }}>
              First Class with Distinction (Credits Completed: 22)
            </div>
          </div>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Subject</th>
              <th>Exam Type</th>
              <th>Score Obtained</th>
              <th>Max Marks</th>
              <th>Percentage</th>
              <th>Letter Grade</th>
              <th>Result Status</th>
            </tr>
          </thead>
          <tbody>
            {sampleExams.map((ex) => {
              const pct = ((ex.score / ex.max) * 100).toFixed(1);
              return (
                <tr key={ex.code}>
                  <td>
                    <strong>{ex.code}</strong> - {ex.subject}
                  </td>
                  <td>{ex.exam}</td>
                  <td><strong>{ex.score}</strong></td>
                  <td>{ex.max}</td>
                  <td>{pct}%</td>
                  <td>
                    <span className="badge badge-neutral" style={{ fontWeight: 700 }}>
                      {ex.grade}
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-success">{ex.status}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
