import React from 'react';
import { CalendarCheck, AlertTriangle, CheckCircle } from 'lucide-react';

export const Attendance: React.FC = () => {
  const sampleSubjects = [
    { code: 'AI401', name: 'Machine Learning', total: 32, attended: 29, pct: 90.6 },
    { code: 'AI402', name: 'Deep Learning Architectures', total: 30, attended: 27, pct: 90.0 },
    { code: 'AI403', name: 'Data Engineering & Cloud Systems', total: 28, attended: 24, pct: 85.7 },
    { code: 'AI404', name: 'Probability & Applied Statistics', total: 30, attended: 21, pct: 70.0 },
  ];

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--primary)' }}>Attendance Register</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
          Real-time session tracking, attendance percentage, and 75% threshold alerts
        </p>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              padding: '12px',
              borderRadius: '8px',
              backgroundColor: 'var(--warning-bg)',
              color: 'var(--warning)',
            }}
          >
            <AlertTriangle size={24} />
          </div>
          <div>
            <h4 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--warning)' }}>
              7-Day Edit Window Active
            </h4>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Faculty members can update session entries within 7 days of the lecture. Subsequent updates require Registrar approval.
            </p>
          </div>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Subject Code</th>
              <th>Subject Name</th>
              <th>Total Conducted</th>
              <th>Attended</th>
              <th>Percentage</th>
              <th>Eligibility Status</th>
            </tr>
          </thead>
          <tbody>
            {sampleSubjects.map((sub) => {
              const isBelow = sub.pct < 75.0;
              return (
                <tr key={sub.code}>
                  <td><strong>{sub.code}</strong></td>
                  <td>{sub.name}</td>
                  <td>{sub.total} sessions</td>
                  <td>{sub.attended} sessions</td>
                  <td>
                    <strong style={{ color: isBelow ? 'var(--danger)' : 'var(--success)' }}>
                      {sub.pct}%
                    </strong>
                  </td>
                  <td>
                    <span className={`badge ${isBelow ? 'badge-danger' : 'badge-success'}`}>
                      {isBelow ? 'Defaulter (<75%)' : 'Eligible'}
                    </span>
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
