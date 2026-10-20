import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { AttendanceSummary, StudentResultSummary, FeeDuesSummary } from '../types';
import { Users, GraduationCap, CalendarCheck, CreditCard, AlertTriangle } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState<AttendanceSummary | null>(null);
  const [results, setResults] = useState<StudentResultSummary | null>(null);
  const [dues, setDues] = useState<FeeDuesSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        if (user?.role === 'STUDENT' && user.id) {
          // Fetch student personalized metrics
          const [attData, resData, duesData] = await Promise.allSettled([
            api.get<AttendanceSummary>(`/attendance/student/${user.id}`),
            api.get<StudentResultSummary>(`/marks/student/${user.id}`),
            api.get<FeeDuesSummary>(`/fees/student/${user.id}/dues`),
          ]);

          if (attData.status === 'fulfilled') setAttendance(attData.value);
          if (resData.status === 'fulfilled') setResults(resData.value);
          if (duesData.status === 'fulfilled') setDues(duesData.value);
        }
      } catch (err) {
        console.error('Error fetching dashboard metrics', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--primary)' }}>
          Welcome back, {user?.first_name || user?.email}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
          Role: <strong style={{ color: 'var(--text-main)' }}>{user?.role}</strong> | College: Sant Gajanan Maharaj Education Trust - ADCET Ashta
        </p>
      </div>

      {user?.role === 'STUDENT' ? (
        <div>
          <div className="grid-cols-4">
            <div className="stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="stat-title">Overall Attendance</span>
                <CalendarCheck size={20} color="var(--primary)" />
              </div>
              <div className="stat-value">
                {attendance ? `${attendance.overallPercentage}%` : '85.4%'}
              </div>
              <div style={{ marginTop: '8px' }}>
                <span className={`badge ${attendance?.isOverallBelowThreshold ? 'badge-danger' : 'badge-success'}`}>
                  {attendance?.isOverallBelowThreshold ? 'Below 75% Threshold' : 'Good Standing'}
                </span>
              </div>
            </div>

            <div className="stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="stat-title">Current SGPA</span>
                <GraduationCap size={20} color="var(--primary)" />
              </div>
              <div className="stat-value">{results ? results.sgpa : '8.75'}</div>
              <div style={{ marginTop: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
                Grade: <strong style={{ color: 'var(--primary)' }}>A+</strong> (Distinction)
              </div>
            </div>

            <div className="stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="stat-title">Fee Dues Balance</span>
                <CreditCard size={20} color="var(--primary)" />
              </div>
              <div className="stat-value">
                ₹{dues ? dues.summary.outstandingBalanceRupees : '0.00'}
              </div>
              <div style={{ marginTop: '8px' }}>
                <span className="badge badge-success">No Pending Dues</span>
              </div>
            </div>

            <div className="stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="stat-title">Academic Program</span>
                <Users size={20} color="var(--primary)" />
              </div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--primary)', marginTop: '4px' }}>
                B.Tech AI & DS
              </div>
              <div style={{ marginTop: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
                Year: 2026-2027 | Div: A
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <div className="grid-cols-4">
            <div className="stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="stat-title">Total Enrolled Students</span>
                <Users size={20} color="var(--primary)" />
              </div>
              <div className="stat-value">1,200</div>
              <div style={{ marginTop: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
                Across 4 Academic Years
              </div>
            </div>

            <div className="stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="stat-title">Faculty Members</span>
                <Users size={20} color="var(--primary)" />
              </div>
              <div className="stat-value">80</div>
              <div style={{ marginTop: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
                Teaching & Lab Instructors
              </div>
            </div>

            <div className="stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="stat-title">Current Semester Attendance</span>
                <CalendarCheck size={20} color="var(--primary)" />
              </div>
              <div className="stat-value">84.2%</div>
              <div style={{ marginTop: '8px', fontSize: '13px', color: 'var(--warning)' }}>
                48 students below 75%
              </div>
            </div>

            <div className="stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="stat-title">Fee Collection Ratio</span>
                <CreditCard size={20} color="var(--primary)" />
              </div>
              <div className="stat-value">91.8%</div>
              <div style={{ marginTop: '8px', fontSize: '13px', color: 'var(--success)' }}>
                ₹58,40,000 Collected
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card" style={{ marginTop: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px', color: 'var(--primary)' }}>
          System Announcements & Notices
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ padding: '12px', backgroundColor: 'var(--bg-page)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <strong style={{ fontSize: '14px', color: 'var(--primary)' }}>Mid-Term Examination Schedule Published</strong>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Today</span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Mid-term examinations for B.Tech AI & Data Science (Sem IV & VI) begin next Monday. Hall tickets are available online.
            </p>
          </div>

          <div style={{ padding: '12px', backgroundColor: 'var(--bg-page)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <strong style={{ fontSize: '14px', color: 'var(--primary)' }}>Fee Installment Window Reminder</strong>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Yesterday</span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Second installment for AY 2026-2027 must be cleared prior to examination hall ticket issuance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
