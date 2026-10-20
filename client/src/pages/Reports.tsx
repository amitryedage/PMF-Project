import React from 'react';
import { Download, FileSpreadsheet, Users, ShieldAlert, Award } from 'lucide-react';

export const Reports: React.FC = () => {
  const downloadReport = (endpoint: string, filename: string) => {
    const token = localStorage.getItem('accessToken');
    fetch(`/api/v1/reports/${endpoint}?format=csv`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
      })
      .catch((err) => alert(`Failed to download report: ${err.message}`));
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--primary)' }}>Reports & Data Exports</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
          Standardized college exports with formula-injection sanitization for accreditation & compliance
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: 'var(--accent-light)', color: 'var(--accent)' }}>
              <Users size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--primary)' }}>Attendance Report</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Class-wise attendance % and &lt;75% flags</p>
            </div>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Generates the comprehensive attendance register for all enrolled students across programs and current semester sessions.
          </p>
          <button
            className="btn btn-primary"
            style={{ width: '100%' }}
            onClick={() => downloadReport('attendance', 'attendance_report.csv')}
          >
            <Download size={16} />
            <span>Export CSV</span>
          </button>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: 'var(--accent-light)', color: 'var(--accent)' }}>
              <Award size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--primary)' }}>Grade Sheet Report</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Exam scores and subject grade marks</p>
            </div>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Exports mid-term and end-term exam results, scores obtained, percentages, and pass/fail distributions.
          </p>
          <button
            className="btn btn-primary"
            style={{ width: '100%' }}
            onClick={() => downloadReport('grades', 'grades_report.csv')}
          >
            <Download size={16} />
            <span>Export CSV</span>
          </button>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: 'var(--warning-bg)', color: 'var(--warning)' }}>
              <ShieldAlert size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--primary)' }}>Fee Defaulters List</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Students with outstanding dues &gt; ₹0</p>
            </div>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Detailed breakdown of unpaid balances, student contacts, and guardian phone numbers for accounts office follow-ups.
          </p>
          <button
            className="btn btn-primary"
            style={{ width: '100%' }}
            onClick={() => downloadReport('defaulters', 'fee_defaulters.csv')}
          >
            <Download size={16} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>
    </div>
  );
};
