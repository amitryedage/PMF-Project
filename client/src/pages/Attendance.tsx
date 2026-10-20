import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Student } from '../types';
import {
  CalendarCheck,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  PlusCircle,
  Search,
  Sparkles,
  X,
  Users,
  BookOpen,
  Calendar,
  AlertCircle,
  Filter,
} from 'lucide-react';

interface SubjectAttendance {
  subject_id: string;
  subject_code: string;
  subject_name: string;
  total_sessions: number;
  attended_sessions: number;
  percentage: number;
  isBelowThreshold: boolean;
}

interface StudentAttendanceSummary {
  studentId: string;
  overallPercentage: number;
  isOverallBelowThreshold: boolean;
  subjectStats: SubjectAttendance[];
}

interface RosterStudent {
  id: string;
  roll_number: string;
  first_name: string;
  last_name: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE';
}

export const Attendance: React.FC = () => {
  const { user } = useAuth();
  const isStudent = user?.role === 'STUDENT';

  // Search & Student State
  const [searchRoll, setSearchRoll] = useState('26AIDS001');
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [attendanceData, setAttendanceData] = useState<StudentAttendanceSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isMarkModalOpen, setIsMarkModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState('fa-ai501-a');
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [sessionHour, setSessionHour] = useState(1);
  const [topic, setTopic] = useState('Backpropagation & Loss Landscapes');
  const [roster, setRoster] = useState<RosterStudent[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Load student attendance stats
  const loadAttendanceStats = useCallback(async (roll: string) => {
    try {
      setLoading(true);
      const studentRes = await api.get<Student[]>(`/students?search=${encodeURIComponent(roll)}&limit=1`);
      if (!Array.isArray(studentRes) || studentRes.length === 0) {
        setAttendanceData(null);
        return;
      }

      const st = studentRes[0];
      setCurrentStudent(st);

      const stats = await api.get<StudentAttendanceSummary>(`/attendance/student/${st.id}`);
      setAttendanceData(stats);
    } catch (err) {
      console.error('Error fetching attendance statistics', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isStudent && user?.rollNumber) {
      setSearchRoll(user.rollNumber);
      loadAttendanceStats(user.rollNumber);
    } else {
      loadAttendanceStats('26AIDS001');
    }
  }, [isStudent, user?.rollNumber, loadAttendanceStats]);

  // Load class roster when opening the mark attendance modal
  const handleOpenMarkModal = async () => {
    setIsMarkModalOpen(true);
    setFormError(null);
    try {
      // Fetch sample active students to populate the interactive batch roster
      const students = await api.get<Student[]>('/students?limit=25');
      if (Array.isArray(students)) {
        setRoster(
          students.map((s) => ({
            id: s.id,
            roll_number: s.roll_number,
            first_name: s.first_name,
            last_name: s.last_name,
            status: 'PRESENT', // 1-click batch entry: all default to PRESENT
          }))
        );
      }
    } catch (err) {
      console.error('Failed to load roster', err);
    }
  };

  const toggleStudentStatus = (studentId: string) => {
    setRoster((prev) =>
      prev.map((s) => {
        if (s.id !== studentId) return s;
        const nextStatus = s.status === 'PRESENT' ? 'ABSENT' : s.status === 'ABSENT' ? 'LATE' : 'PRESENT';
        return { ...s, status: nextStatus };
      })
    );
  };

  const handleMarkAll = (status: 'PRESENT' | 'ABSENT') => {
    setRoster((prev) => prev.map((s) => ({ ...s, status })));
  };

  const handleAutofillDemoSession = () => {
    setSelectedAssignment('fa-ai501-a');
    setSessionDate(new Date().toISOString().split('T')[0]);
    setSessionHour(2);
    setTopic('Convolutional Neural Networks & Feature Maps');
    setRoster((prev) =>
      prev.map((s, idx) => ({
        ...s,
        status: idx % 7 === 0 ? 'ABSENT' : idx % 11 === 0 ? 'LATE' : 'PRESENT',
      }))
    );
    setFormError(null);
  };

  const handleSubmitAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (roster.length === 0) {
      setFormError('Class roster is empty. Cannot record attendance.');
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);

      // 1. Create or retrieve Session
      const session = await api.post<any>('/attendance/sessions', {
        facultyAssignmentId: selectedAssignment,
        sessionDate,
        sessionHour: Number(sessionHour),
        topic: topic.trim() || undefined,
      });

      // 2. Submit Bulk Attendance Records
      await api.post('/attendance/records', {
        sessionId: session.id,
        records: roster.map((r) => ({
          studentId: r.id,
          status: r.status,
        })),
      });

      const presentCount = roster.filter((r) => r.status === 'PRESENT').length;
      setIsMarkModalOpen(false);
      setSuccessToast(`Attendance recorded! ${presentCount} of ${roster.length} students marked present for ${topic}.`);
      setTimeout(() => setSuccessToast(null), 6000);

      // Refresh current student's stats
      if (currentStudent) {
        await loadAttendanceStats(currentStudent.roll_number);
      }
    } catch (err: any) {
      setFormError(err.message || 'Failed to record attendance session.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const presentCount = roster.filter((r) => r.status === 'PRESENT').length;
  const absentCount = roster.filter((r) => r.status === 'ABSENT').length;
  const lateCount = roster.filter((r) => r.status === 'LATE').length;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--primary)' }}>Attendance Register</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            Real-time session tracking, lecture percentage, and 75% statutory eligibility alerts
          </p>
        </div>
        {!isStudent && (
          <button id="btn-mark-attendance" className="btn btn-primary" onClick={handleOpenMarkModal}>
            <CalendarCheck size={16} />
            <span>+ Mark Lecture Attendance</span>
          </button>
        )}
      </div>

      {/* Success Banner */}
      {successToast && (
        <div className="form-alert form-alert-success" style={{ marginBottom: '20px' }}>
          <CheckCircle size={18} />
          <span>{successToast}</span>
        </div>
      )}

      {/* 7-Day Edit Window Notice */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              padding: '10px',
              borderRadius: '8px',
              backgroundColor: 'var(--warning-bg)',
              color: 'var(--warning)',
            }}
          >
            <AlertTriangle size={22} />
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--warning)' }}>
              Autonomous 7-Day Faculty Edit Window Active
            </h4>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Faculty members can amend lecture session records within 7 calendar days of conduction. Subsequent adjustments require Registrar or Super Admin authorization.
            </p>
          </div>
        </div>
      </div>

      {/* Student Lookup for Faculty / Admins */}
      {!isStudent && (
        <div className="card" style={{ marginBottom: '20px', padding: '16px' }}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (searchRoll.trim()) loadAttendanceStats(searchRoll.trim());
            }}
            style={{ display: 'flex', gap: '12px', alignItems: 'center' }}
          >
            <div style={{ flex: 1 }}>
              <input
                type="text"
                placeholder="Lookup student attendance by Roll Number (e.g. 26AIDS001, 26AIDS102)..."
                value={searchRoll}
                onChange={(e) => setSearchRoll(e.target.value.toUpperCase())}
              />
            </div>
            <button type="submit" className="btn btn-secondary">
              <Search size={16} />
              <span>Inspect Student Register</span>
            </button>
          </form>
        </div>
      )}

      {/* Selected Student Profile Banner */}
      {currentStudent && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 20px',
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '20px',
          }}
        >
          <div>
            <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--primary)' }}>
              {currentStudent.first_name} {currentStudent.last_name}
            </span>{' '}
            <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
              ({currentStudent.roll_number} | PRN: {currentStudent.enrollment_number})
            </span>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Program: {currentStudent.program_code || 'AI-DS'} • Year {currentStudent.current_year} Division {currentStudent.current_division}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Overall Attendance</div>
              <div
                style={{
                  fontSize: '18px',
                  fontWeight: 800,
                  color: attendanceData && attendanceData.isOverallBelowThreshold ? 'var(--danger)' : 'var(--success)',
                }}
              >
                {attendanceData ? `${attendanceData.overallPercentage}%` : '85.2%'}
              </div>
            </div>
            <span
              className={`badge ${
                attendanceData && attendanceData.isOverallBelowThreshold ? 'badge-danger' : 'badge-success'
              }`}
            >
              {attendanceData && attendanceData.isOverallBelowThreshold ? 'Defaulter (<75%)' : 'Eligible for Exams'}
            </span>
          </div>
        </div>
      )}

      {/* Subject-Wise Attendance Breakdown Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Subject Code</th>
              <th>Course Name</th>
              <th>Total Conducted</th>
              <th>Attended Sessions</th>
              <th>Percentage</th>
              <th>Eligibility Status</th>
            </tr>
          </thead>
          <tbody>
            {attendanceData && attendanceData.subjectStats.length > 0 ? (
              attendanceData.subjectStats.map((sub) => {
                const isBelow = sub.isBelowThreshold;
                return (
                  <tr key={sub.subject_code}>
                    <td><strong>{sub.subject_code}</strong></td>
                    <td>{sub.subject_name}</td>
                    <td>{sub.total_sessions} sessions</td>
                    <td>{sub.attended_sessions} sessions</td>
                    <td>
                      <strong style={{ color: isBelow ? 'var(--danger)' : 'var(--success)' }}>
                        {sub.percentage}%
                      </strong>
                    </td>
                    <td>
                      <span className={`badge ${isBelow ? 'badge-danger' : 'badge-success'}`}>
                        {isBelow ? 'Defaulter (<75%)' : 'Eligible'}
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                  {loading
                    ? 'Loading attendance statistics from server...'
                    : 'No attendance records logged yet for the selected student.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: Mark Lecture Attendance Session */}
      {isMarkModalOpen && (
        <div className="modal-overlay" onClick={() => !isSubmitting && setIsMarkModalOpen(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '780px' }}>
            <div className="modal-header">
              <div className="modal-title">
                <CalendarCheck size={20} color="var(--accent)" />
                <span>Mark Lecture Attendance</span>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => !isSubmitting && setIsMarkModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitAttendance} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div className="modal-body">
                {/* 1-Click Demo Helper */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    backgroundColor: 'var(--accent-light)',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: '16px',
                  }}
                >
                  <div style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 500 }}>
                    ⚡ Test quickly with pre-configured lecture details & random absentees:
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleAutofillDemoSession}
                    style={{ background: '#FFFFFF', borderColor: 'var(--accent)' }}
                  >
                    <Sparkles size={14} color="var(--accent)" />
                    <span>Autofill Sample Lecture</span>
                  </button>
                </div>

                {formError && (
                  <div className="form-alert form-alert-error">
                    <AlertCircle size={18} />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Session Header Fields */}
                <div className="form-grid" style={{ marginBottom: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Course / Subject</label>
                    <select
                      value={selectedAssignment}
                      onChange={(e) => setSelectedAssignment(e.target.value)}
                      required
                    >
                      <option value="fa-ai501-a">AI501 - Machine Learning & Pattern Recognition</option>
                      <option value="fa-ai502-a">AI502 - Deep Learning Architectures</option>
                      <option value="fa-ai503-a">AI503 - Big Data Engineering & Cloud Systems</option>
                      <option value="fa-ai504-a">AI504 - Natural Language Processing</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Lecture Date</label>
                    <input
                      type="date"
                      value={sessionDate}
                      onChange={(e) => setSessionDate(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Session Hour</label>
                    <select
                      value={sessionHour}
                      onChange={(e) => setSessionHour(Number(e.target.value))}
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((h) => (
                        <option key={h} value={h}>Hour {h} (Lecture Period {h})</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Topic Covered</label>
                    <input
                      type="text"
                      placeholder="e.g. Backpropagation Algorithm & Loss Functions"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* 1-Click Batch Attendance Toolbar */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 16px',
                    backgroundColor: 'var(--zebra-row)',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: '12px',
                  }}
                >
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600 }}>Roster Controls:</span>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleMarkAll('PRESENT')}
                    >
                      ✅ All Present
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleMarkAll('ABSENT')}
                    >
                      ❌ All Absent
                    </button>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 600 }}>
                    <span style={{ color: 'var(--success)' }}>{presentCount} Present</span> •{' '}
                    <span style={{ color: 'var(--danger)' }}>{absentCount} Absent</span> •{' '}
                    <span style={{ color: 'var(--warning)' }}>{lateCount} Late</span>
                  </div>
                </div>

                {/* Interactive Roster Table */}
                <div style={{ maxHeight: '280px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
                  <table>
                    <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                      <tr>
                        <th>Roll No</th>
                        <th>Student Name</th>
                        <th style={{ textAlign: 'center' }}>Attendance Status (Click to Toggle)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {roster.map((s) => (
                        <tr
                          key={s.id}
                          onClick={() => toggleStudentStatus(s.id)}
                          style={{ cursor: 'pointer', transition: 'background-color 0.15s ease' }}
                        >
                          <td><strong>{s.roll_number}</strong></td>
                          <td>{s.first_name} {s.last_name}</td>
                          <td style={{ textAlign: 'center' }}>
                            <span
                              className={`badge ${
                                s.status === 'PRESENT'
                                  ? 'badge-success'
                                  : s.status === 'ABSENT'
                                  ? 'badge-danger'
                                  : 'badge-warning'
                              }`}
                              style={{ padding: '6px 14px', fontSize: '12px', cursor: 'pointer' }}
                            >
                              {s.status === 'PRESENT' && '✅ PRESENT'}
                              {s.status === 'ABSENT' && '❌ ABSENT'}
                              {s.status === 'LATE' && '⏰ LATE'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsMarkModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Recording Attendance...' : `Submit Attendance (${presentCount} Present)`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
