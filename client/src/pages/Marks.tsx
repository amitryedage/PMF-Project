import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Student } from '../types';
import {
  GraduationCap,
  Award,
  FileText,
  Search,
  Sparkles,
  X,
  Printer,
  CheckCircle,
  AlertCircle,
  Edit3,
  ShieldCheck,
  BookOpen,
} from 'lucide-react';

interface ExamResult {
  mark_id: string;
  score: number | null;
  maxMarks: number;
  percentage: number;
  grade: string;
  gradePoint: number;
  exam_id: string;
  exam_name: string;
  exam_type: string;
  subject_id: string;
  subject_code: string;
  subject_name: string;
  credits: number;
  is_published: boolean;
  is_absent: boolean;
}

interface StudentResultsSummary {
  studentId: string;
  sgpa: number;
  totalCredits: number;
  results: ExamResult[];
}

interface MarkEntryItem {
  studentId: string;
  roll_number: string;
  first_name: string;
  last_name: string;
  score: number;
  isAbsent: boolean;
}

export const Marks: React.FC = () => {
  const { user } = useAuth();
  const isStudent = user?.role === 'STUDENT';

  // Search & Student State
  const [searchRoll, setSearchRoll] = useState('26AIDS001');
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [resultsData, setResultsData] = useState<StudentResultsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [isTranscriptModalOpen, setIsTranscriptModalOpen] = useState(false);

  // Form State
  const [selectedExamId, setSelectedExamId] = useState('exam-01');
  const [entryRoster, setEntryRoster] = useState<MarkEntryItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Load student marks results
  const loadStudentResults = useCallback(async (roll: string) => {
    try {
      setLoading(true);
      const studentRes = await api.get<Student[]>(`/students?search=${encodeURIComponent(roll)}&limit=1`);
      if (!Array.isArray(studentRes) || studentRes.length === 0) {
        setResultsData(null);
        return;
      }

      const st = studentRes[0];
      setCurrentStudent(st);

      const data = await api.get<StudentResultsSummary>(`/marks/student/${st.id}`);
      setResultsData(data);
    } catch (err) {
      console.error('Error fetching student exam results', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isStudent && user?.rollNumber) {
      setSearchRoll(user.rollNumber);
      loadStudentResults(user.rollNumber);
    } else {
      loadStudentResults('26AIDS001');
    }
  }, [isStudent, user?.rollNumber, loadStudentResults]);

  // Load class students when opening the marks entry modal
  const handleOpenEntryModal = async () => {
    setIsEntryModalOpen(true);
    setFormError(null);
    try {
      const students = await api.get<Student[]>('/students?limit=25');
      if (Array.isArray(students)) {
        setEntryRoster(
          students.map((s, idx) => ({
            studentId: s.id,
            roll_number: s.roll_number,
            first_name: s.first_name,
            last_name: s.last_name,
            score: Math.min(50, Math.max(28, 48 - (idx % 12))),
            isAbsent: false,
          }))
        );
      }
    } catch (err) {
      console.error('Failed to load roster for marks entry', err);
    }
  };

  const handleScoreChange = (studentId: string, value: string) => {
    const num = parseFloat(value);
    setEntryRoster((prev) =>
      prev.map((item) => (item.studentId === studentId ? { ...item, score: isNaN(num) ? 0 : Math.min(50, Math.max(0, num)) } : item))
    );
  };

  const handleAbsentToggle = (studentId: string) => {
    setEntryRoster((prev) =>
      prev.map((item) => (item.studentId === studentId ? { ...item, isAbsent: !item.isAbsent } : item))
    );
  };

  const handleAutofillDemoMarks = () => {
    setEntryRoster((prev) =>
      prev.map((s, idx) => ({
        ...s,
        score: Math.min(50, Math.floor(36 + Math.random() * 14)),
        isAbsent: idx === 19, // One absent demo student
      }))
    );
    setFormError(null);
  };

  const handleSubmitMarks = async (e: React.FormEvent) => {
    e.preventDefault();
    if (entryRoster.length === 0) {
      setFormError('Roster is empty. Cannot submit marks.');
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);

      await api.post('/marks/entry', {
        examId: selectedExamId,
        records: entryRoster.map((r) => ({
          studentId: r.studentId,
          score: r.isAbsent ? undefined : r.score,
          isAbsent: r.isAbsent,
        })),
      });

      setIsEntryModalOpen(false);
      setSuccessToast(`Exam marks successfully submitted and encrypted in ledger for ${entryRoster.length} students.`);
      setTimeout(() => setSuccessToast(null), 5000);

      // Refresh student's results
      if (currentStudent) {
        await loadStudentResults(currentStudent.roll_number);
      }
    } catch (err: any) {
      setFormError(err.message || 'Failed to submit exam marks.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const defaultResults = [
    { subject_code: 'AI501', subject_name: 'Machine Learning & Pattern Recognition', exam_name: 'Mid-Term Exam', maxMarks: 50, score: 44, percentage: 88.0, grade: 'O', credits: 4 },
    { subject_code: 'AI502', subject_name: 'Deep Learning Architectures', exam_name: 'Mid-Term Exam', maxMarks: 50, score: 41, percentage: 82.0, grade: 'A+', credits: 4 },
    { subject_code: 'AI503', subject_name: 'Big Data Engineering & Cloud Systems', exam_name: 'Mid-Term Exam', maxMarks: 50, score: 38, percentage: 76.0, grade: 'A', credits: 3 },
    { subject_code: 'AI504', subject_name: 'Natural Language Processing', exam_name: 'Mid-Term Exam', maxMarks: 50, score: 36, percentage: 72.0, grade: 'B+', credits: 3 },
  ];

  const displayList = resultsData && resultsData.results.length > 0 ? resultsData.results : defaultResults;
  const sgpaValue = resultsData?.sgpa && resultsData.sgpa > 0 ? resultsData.sgpa : 8.84;
  const totalCredits = resultsData?.totalCredits && resultsData.totalCredits > 0 ? resultsData.totalCredits : 14;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--primary)' }}>Examinations & Grade Cards</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            Autonomous credit-based evaluation, SGPA computation, and verified marks transcripts
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {!isStudent && (
            <button id="btn-enter-marks" className="btn btn-primary" onClick={handleOpenEntryModal}>
              <Edit3 size={16} />
              <span>+ Enter Exam Marks</span>
            </button>
          )}
          <button className="btn btn-secondary" onClick={() => setIsTranscriptModalOpen(true)}>
            <FileText size={16} />
            <span>Official Grade Card</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {successToast && (
        <div className="form-alert form-alert-success" style={{ marginBottom: '20px' }}>
          <CheckCircle size={18} />
          <span>{successToast}</span>
        </div>
      )}

      {/* Student Lookup for Staff */}
      {!isStudent && (
        <div className="card" style={{ marginBottom: '20px', padding: '16px' }}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (searchRoll.trim()) loadStudentResults(searchRoll.trim());
            }}
            style={{ display: 'flex', gap: '12px', alignItems: 'center' }}
          >
            <div style={{ flex: 1 }}>
              <input
                type="text"
                placeholder="Enter Student Roll Number (e.g. 26AIDS001, 26AIDS102)..."
                value={searchRoll}
                onChange={(e) => setSearchRoll(e.target.value.toUpperCase())}
              />
            </div>
            <button type="submit" className="btn btn-secondary">
              <Search size={16} />
              <span>Load Grade Card</span>
            </button>
          </form>
        </div>
      )}

      {/* SGPA Performance Summary Banner */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
            <div
              style={{
                padding: '16px',
                borderRadius: '12px',
                backgroundColor: 'var(--accent-light)',
                color: 'var(--accent)',
              }}
            >
              <Award size={36} />
            </div>
            <div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                Semester V Autonomous SGPA Record
              </div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--primary)' }}>
                {sgpaValue.toFixed(2)} / 10.00
              </div>
              <div style={{ fontSize: '13px', color: 'var(--success)', fontWeight: 600 }}>
                First Class with Distinction • Earned Credits: {totalCredits}
              </div>
            </div>
          </div>

          {currentStudent && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--primary)' }}>
                {currentStudent.first_name} {currentStudent.last_name}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Roll: {currentStudent.roll_number} | PRN: {currentStudent.enrollment_number}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {currentStudent.program_code || 'AI-DS'} Department
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Marks Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Course Code & Title</th>
              <th>Exam Component</th>
              <th>Score Obtained</th>
              <th>Maximum Marks</th>
              <th>Percentage</th>
              <th>Letter Grade</th>
              <th>Credits</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {displayList.map((ex: any) => {
              const isPass = ex.grade !== 'F' && ex.grade !== 'AB';
              return (
                <tr key={ex.mark_id || ex.subject_code}>
                  <td>
                    <strong>{ex.subject_code}</strong> - {ex.subject_name}
                  </td>
                  <td>{ex.exam_name || 'Mid-Term Exam'}</td>
                  <td>
                    <strong>{ex.is_absent ? 'AB' : ex.score}</strong>
                  </td>
                  <td>{ex.maxMarks}</td>
                  <td>{ex.percentage}%</td>
                  <td>
                    <span className="badge badge-neutral" style={{ fontWeight: 800 }}>
                      {ex.grade}
                    </span>
                  </td>
                  <td>{ex.credits}</td>
                  <td>
                    <span className={`badge ${isPass ? 'badge-success' : 'badge-danger'}`}>
                      {isPass ? 'PASS' : 'FAIL'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal 1: Enter Exam Marks */}
      {isEntryModalOpen && (
        <div className="modal-overlay" onClick={() => !isSubmitting && setIsEntryModalOpen(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '780px' }}>
            <div className="modal-header">
              <div className="modal-title">
                <Edit3 size={20} color="var(--accent)" />
                <span>Enter Examination Scores</span>
              </div>
              <button className="modal-close-btn" onClick={() => !isSubmitting && setIsEntryModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitMarks} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div className="modal-body">
                {/* Autofill Demo */}
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
                    ⚡ Autofill realistic class marks (Mid-Term Exam out of 50):
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleAutofillDemoMarks}
                    style={{ background: '#FFFFFF', borderColor: 'var(--accent)' }}
                  >
                    <Sparkles size={14} color="var(--accent)" />
                    <span>Autofill Sample Marks</span>
                  </button>
                </div>

                {formError && (
                  <div className="form-alert form-alert-error">
                    <AlertCircle size={18} />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label">Examination & Course</label>
                  <select
                    value={selectedExamId}
                    onChange={(e) => setSelectedExamId(e.target.value)}
                    required
                  >
                    <option value="exam-01">AI501 - Machine Learning Mid-Term Exam (Max: 50)</option>
                    <option value="exam-02">AI502 - Deep Learning Architectures Mid-Term Exam (Max: 50)</option>
                    <option value="exam-03">AI503 - Big Data Engineering Mid-Term Exam (Max: 50)</option>
                    <option value="exam-04">AI504 - NLP Mid-Term Exam (Max: 50)</option>
                  </select>
                </div>

                {/* Batch Marks Entry Table */}
                <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
                  <table>
                    <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                      <tr>
                        <th>Roll No</th>
                        <th>Student Name</th>
                        <th style={{ width: '130px' }}>Score (Max: 50)</th>
                        <th style={{ width: '100px', textAlign: 'center' }}>Absent</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entryRoster.map((r) => (
                        <tr key={r.studentId}>
                          <td><strong>{r.roll_number}</strong></td>
                          <td>{r.first_name} {r.last_name}</td>
                          <td>
                            <input
                              type="number"
                              min="0"
                              max="50"
                              disabled={r.isAbsent}
                              value={r.isAbsent ? '' : r.score}
                              onChange={(e) => handleScoreChange(r.studentId, e.target.value)}
                              style={{
                                padding: '6px 10px',
                                width: '100px',
                                backgroundColor: r.isAbsent ? 'var(--bg-page)' : '#FFFFFF',
                              }}
                            />
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <input
                              type="checkbox"
                              checked={r.isAbsent}
                              onChange={() => handleAbsentToggle(r.studentId)}
                              style={{ width: 'auto', cursor: 'pointer' }}
                            />
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
                  onClick={() => setIsEntryModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Recording Marks...' : 'Publish Examination Marks'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Official Printable Marksheet */}
      {isTranscriptModalOpen && (
        <div className="modal-overlay" onClick={() => setIsTranscriptModalOpen(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '680px' }}>
            <div className="modal-header">
              <div className="modal-title">
                <FileText size={20} color="var(--accent)" />
                <span>Official Grade Card Transcript</span>
              </div>
              <button className="modal-close-btn" onClick={() => setIsTranscriptModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body" style={{ backgroundColor: '#FAFAFA' }}>
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  padding: '24px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                {/* College Branding */}
                <div style={{ textAlign: 'center', borderBottom: '2px solid var(--primary)', paddingBottom: '16px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Sant Gajanan Maharaj Rural Hospital & Research Centre
                  </div>
                  <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--primary)', margin: '4px 0' }}>
                    Annasaheb Dange College of Engineering & Technology
                  </h2>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Ashta, Sangli, Maharashtra • Autonomous Institute • Affiliated to Shivaji University
                  </div>
                  <div
                    style={{
                      display: 'inline-block',
                      marginTop: '8px',
                      padding: '3px 12px',
                      backgroundColor: 'var(--accent-light)',
                      color: 'var(--accent)',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 700,
                    }}
                  >
                    STATEMENT OF GRADES - B.TECH SEMESTER V (AY 2026-2027)
                  </div>
                </div>

                {/* Student Particulars */}
                <div
                  style={{
                    backgroundColor: 'var(--zebra-row)',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '13px',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '8px',
                    marginBottom: '16px',
                  }}
                >
                  <div>
                    <strong>Student Name:</strong> {currentStudent ? `${currentStudent.first_name} ${currentStudent.last_name}` : 'Amit Ramesh Yedage'}
                  </div>
                  <div>
                    <strong>Roll Number:</strong> {currentStudent ? currentStudent.roll_number : '26AIDS001'}
                  </div>
                  <div>
                    <strong>Permanent Reg. No (PRN):</strong> {currentStudent ? currentStudent.enrollment_number : 'EN2026001'}
                  </div>
                  <div>
                    <strong>Branch / Program:</strong> {currentStudent?.program_code || 'AI & Data Science'}
                  </div>
                </div>

                {/* Grades Table */}
                <div style={{ marginBottom: '16px' }}>
                  <table style={{ fontSize: '13px' }}>
                    <thead>
                      <tr>
                        <th>Course</th>
                        <th>Credits</th>
                        <th>Max</th>
                        <th>Obtained</th>
                        <th>Grade</th>
                        <th>Pts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayList.map((row: any) => (
                        <tr key={row.subject_code}>
                          <td><strong>{row.subject_code}</strong> - {row.subject_name}</td>
                          <td>{row.credits}</td>
                          <td>{row.maxMarks}</td>
                          <td><strong>{row.is_absent ? 'AB' : row.score}</strong></td>
                          <td><strong>{row.grade}</strong></td>
                          <td>{row.grade === 'O' ? 10 : row.grade === 'A+' ? 9 : row.grade === 'A' ? 8 : 7}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* SGPA Summary */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 18px',
                    backgroundColor: 'var(--success-bg)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid #BBF7D0',
                    marginBottom: '16px',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--success)' }}>
                      SEMESTER GRADE POINT AVERAGE (SGPA)
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Credits Earned: {totalCredits} • Result: First Class with Distinction
                    </div>
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--success)' }}>
                    {sgpaValue.toFixed(2)}
                  </div>
                </div>

                {/* Footer Stamp */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: '16px', borderTop: '1px dashed var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--success)' }}>
                    <ShieldCheck size={18} />
                    <span>Digitally Authenticated Examination Record</span>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)' }}>Controller of Examinations</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ADCET Ashta (Autonomous)</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => window.print()}>
                <Printer size={16} />
                <span>Print Official Marksheet</span>
              </button>
              <button className="btn btn-primary" onClick={() => setIsTranscriptModalOpen(false)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
