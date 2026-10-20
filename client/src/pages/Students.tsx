import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../api/client';
import { Student } from '../types';
import {
  Search,
  UserPlus,
  Filter,
  X,
  CheckCircle,
  AlertCircle,
  Sparkles,
  User,
  ShieldCheck,
  Calendar,
  Phone,
  Mail,
  BookOpen,
  Building
} from 'lucide-react';

interface NewStudentFormData {
  rollNumber: string;
  enrollmentNumber: string;
  firstName: string;
  lastName: string;
  fullNameMarathi: string;
  dob: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  bloodGroup: string;
  personalEmail: string;
  phone: string;
  guardianName: string;
  guardianPhone: string;
  guardianRelation: string;
  guardianConsentRecorded: boolean;
  programId: string;
  currentYear: number;
  currentDivision: string;
  status: 'ACTIVE' | 'DETAINED' | 'ON_LEAVE' | 'GRADUATED' | 'WITHDRAWN';
}

const initialFormState: NewStudentFormData = {
  rollNumber: '',
  enrollmentNumber: '',
  firstName: '',
  lastName: '',
  fullNameMarathi: '',
  dob: '2005-06-15',
  gender: 'MALE',
  bloodGroup: 'B+',
  personalEmail: '',
  phone: '',
  guardianName: '',
  guardianPhone: '',
  guardianRelation: 'Father',
  guardianConsentRecorded: true,
  programId: 'prog-ai-ds',
  currentYear: 1,
  currentDivision: 'A',
  status: 'ACTIVE',
};

export const Students: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Filter states
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterProgram, setFilterProgram] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState<NewStudentFormData>(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (filterProgram) params.append('programId', filterProgram);
      if (filterYear) params.append('year', filterYear);
      if (filterStatus) params.append('status', filterStatus);

      const queryString = params.toString() ? `?${params.toString()}` : '';
      const data = await api.get<Student[]>(`/students${queryString}`);
      setStudents(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Error fetching student list', err);
    } finally {
      setLoading(false);
    }
  }, [search, filterProgram, filterYear, filterStatus]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleOpenModal = () => {
    setFormData({
      ...initialFormState,
      rollNumber: `26AIDS${Math.floor(200 + Math.random() * 700)}`,
      enrollmentNumber: `EN2026${Math.floor(1000 + Math.random() * 9000)}`,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleAutofillDemo = () => {
    const randomNum = Math.floor(100 + Math.random() * 899);
    setFormData({
      rollNumber: `26AIDS${randomNum}`,
      enrollmentNumber: `EN2026${randomNum}`,
      firstName: 'Rohan',
      lastName: 'Patil',
      fullNameMarathi: 'रोहन पाटील',
      dob: '2005-04-18',
      gender: 'MALE',
      bloodGroup: 'O+',
      personalEmail: `rohan.patil${randomNum}@gmail.com`,
      phone: '9822154321',
      guardianName: 'Suresh Patil',
      guardianPhone: '9822001122',
      guardianRelation: 'Father',
      guardianConsentRecorded: true,
      programId: 'prog-ai-ds',
      currentYear: 1,
      currentDivision: 'A',
      status: 'ACTIVE',
    });
    setFormError(null);
  };

  const handleSubmitNewStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Basic frontend checks
    if (!formData.rollNumber.trim()) {
      setFormError('Roll Number is required.');
      return;
    }
    if (!formData.enrollmentNumber.trim()) {
      setFormError('Enrollment Number is required.');
      return;
    }
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setFormError('First and Last names are required.');
      return;
    }
    if (!formData.guardianName.trim() || !formData.guardianPhone.trim()) {
      setFormError('Guardian Name and Phone are required.');
      return;
    }
    if (!/^[6-9]\d{9}$/.test(formData.guardianPhone.trim())) {
      setFormError('Guardian phone must be a valid 10-digit Indian mobile number starting with 6-9.');
      return;
    }
    if (formData.phone && !/^[6-9]\d{9}$/.test(formData.phone.trim())) {
      setFormError('Student phone must be a valid 10-digit Indian mobile number starting with 6-9.');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post('/students', {
        ...formData,
        currentYear: Number(formData.currentYear),
      });

      setIsModalOpen(false);
      setSuccessToast(`Student ${formData.firstName} ${formData.lastName} (${formData.rollNumber}) enrolled successfully!`);
      setTimeout(() => setSuccessToast(null), 5000);
      await fetchStudents();
    } catch (err: any) {
      setFormError(err.message || 'Failed to enroll student. Please check input data.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--primary)' }}>Student Records</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            Manage student profiles, program assignments, and enrollment status
          </p>
        </div>
        <button id="btn-new-student" className="btn btn-primary" onClick={handleOpenModal}>
          <UserPlus size={16} />
          <span>New Student</span>
        </button>
      </div>

      {/* Success Notification */}
      {successToast && (
        <div className="form-alert form-alert-success" style={{ marginBottom: '20px' }}>
          <CheckCircle size={18} />
          <span>{successToast}</span>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              type="text"
              placeholder="Search by student name, roll number or enrollment number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            className={`btn ${isFilterOpen ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setIsFilterOpen(!isFilterOpen)}
          >
            <Filter size={16} />
            <span>Filters {filterProgram || filterYear || filterStatus ? '(Active)' : ''}</span>
          </button>
        </div>

        {/* Expandable Filter Strip */}
        {isFilterOpen && (
          <div
            style={{
              marginTop: '16px',
              paddingTop: '16px',
              borderTop: '1px solid var(--border-color)',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '12px',
              alignItems: 'flex-end',
            }}
          >
            <div>
              <label className="form-label" style={{ marginBottom: '4px', display: 'block' }}>Program</label>
              <select value={filterProgram} onChange={(e) => setFilterProgram(e.target.value)}>
                <option value="">All Programs</option>
                <option value="prog-ai-ds">AI & Data Science (B.Tech)</option>
                <option value="prog-cse">Computer Science (B.Tech)</option>
              </select>
            </div>
            <div>
              <label className="form-label" style={{ marginBottom: '4px', display: 'block' }}>Academic Year</label>
              <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)}>
                <option value="">All Years</option>
                <option value="1">1st Year (FE)</option>
                <option value="2">2nd Year (SE)</option>
                <option value="3">3rd Year (TE)</option>
                <option value="4">4th Year (BE)</option>
              </select>
            </div>
            <div>
              <label className="form-label" style={{ marginBottom: '4px', display: 'block' }}>Status</label>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="">All Statuses</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="DETAINED">DETAINED</option>
                <option value="ON_LEAVE">ON_LEAVE</option>
                <option value="GRADUATED">GRADUATED</option>
              </select>
            </div>
            <div>
              <button
                className="btn btn-secondary"
                style={{ width: '100%' }}
                onClick={() => {
                  setFilterProgram('');
                  setFilterYear('');
                  setFilterStatus('');
                  setSearch('');
                }}
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Student Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Roll No</th>
              <th>Student Name</th>
              <th>Program</th>
              <th>Year / Div</th>
              <th>Status</th>
              <th>Guardian Contact</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.length > 0 ? (
              students.map((s) => (
                <tr key={s.id}>
                  <td><strong>{s.roll_number}</strong></td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{s.first_name} {s.last_name}</div>
                    {s.full_name_marathi && (
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{s.full_name_marathi}</div>
                    )}
                  </td>
                  <td>{s.program_code || (s.program_id === 'prog-cse' ? 'CSE' : 'AI-DS')}</td>
                  <td>Year {s.current_year} - {s.current_division}</td>
                  <td>
                    <span
                      className={`badge ${
                        s.status === 'ACTIVE'
                          ? 'badge-success'
                          : s.status === 'DETAINED'
                          ? 'badge-danger'
                          : 'badge-warning'
                      }`}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td>
                    <div>{s.guardian_name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{s.guardian_phone} ({s.guardian_relation})</div>
                  </td>
                  <td>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setSelectedStudent(s)}
                    >
                      View Profile
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                  {loading ? 'Loading student records...' : 'No student records match the search criteria.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal 1: Create New Student */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => !isSubmitting && setIsModalOpen(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <UserPlus size={20} color="var(--accent)" />
                <span>Enroll New Student</span>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => !isSubmitting && setIsModalOpen(false)}
                title="Close"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitNewStudent} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div className="modal-body">
                {/* Autofill Demo Helper */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    backgroundColor: 'var(--accent-light)',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: '18px',
                  }}
                >
                  <div style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 500 }}>
                    ⚡ Need to test quickly? Auto-populate valid form fields:
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleAutofillDemo}
                    style={{ background: '#FFFFFF', borderColor: 'var(--accent)' }}
                  >
                    <Sparkles size={14} color="var(--accent)" />
                    <span>Autofill Demo</span>
                  </button>
                </div>

                {formError && (
                  <div className="form-alert form-alert-error">
                    <AlertCircle size={18} />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="form-grid">
                  {/* Academic Identifiers */}
                  <div className="form-group">
                    <label className="form-label">
                      Roll Number <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 26AIDS101"
                      value={formData.rollNumber}
                      onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value.toUpperCase() })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Enrollment Number <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. EN2026101"
                      value={formData.enrollmentNumber}
                      onChange={(e) => setFormData({ ...formData, enrollmentNumber: e.target.value.toUpperCase() })}
                      required
                    />
                  </div>

                  {/* Personal Names */}
                  <div className="form-group">
                    <label className="form-label">
                      First Name <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Rohan"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Last Name <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Patil"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group full-width">
                    <label className="form-label">Full Name in Marathi (Devanagari)</label>
                    <input
                      type="text"
                      placeholder="e.g. रोहन सुरेश पाटील"
                      value={formData.fullNameMarathi}
                      onChange={(e) => setFormData({ ...formData, fullNameMarathi: e.target.value })}
                    />
                  </div>

                  {/* Demographics */}
                  <div className="form-group">
                    <label className="form-label">
                      Date of Birth <span className="required">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.dob}
                      onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Gender <span className="required">*</span>
                    </label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                      required
                    >
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Blood Group</label>
                    <select
                      value={formData.bloodGroup}
                      onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                    >
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </select>
                  </div>

                  {/* Program & Division */}
                  <div className="form-group">
                    <label className="form-label">
                      Academic Program <span className="required">*</span>
                    </label>
                    <select
                      value={formData.programId}
                      onChange={(e) => setFormData({ ...formData, programId: e.target.value })}
                      required
                    >
                      <option value="prog-ai-ds">AI & Data Science (B.Tech)</option>
                      <option value="prog-cse">Computer Science & Engineering</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Current Academic Year</label>
                    <select
                      value={formData.currentYear}
                      onChange={(e) => setFormData({ ...formData, currentYear: Number(e.target.value) })}
                    >
                      <option value={1}>1st Year (FE)</option>
                      <option value={2}>2nd Year (SE)</option>
                      <option value={3}>3rd Year (TE)</option>
                      <option value={4}>4th Year (BE)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Division</label>
                    <select
                      value={formData.currentDivision}
                      onChange={(e) => setFormData({ ...formData, currentDivision: e.target.value })}
                    >
                      <option value="A">Division A</option>
                      <option value="B">Division B</option>
                      <option value="C">Division C</option>
                    </select>
                  </div>

                  {/* Student Contacts */}
                  <div className="form-group">
                    <label className="form-label">Personal Email</label>
                    <input
                      type="email"
                      placeholder="student@example.com"
                      value={formData.personalEmail}
                      onChange={(e) => setFormData({ ...formData, personalEmail: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Student Phone</label>
                    <input
                      type="tel"
                      placeholder="10 digit Indian number"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>

                  {/* Guardian Contacts */}
                  <div className="form-group">
                    <label className="form-label">
                      Guardian Name <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Father / Mother / Guardian"
                      value={formData.guardianName}
                      onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Guardian Phone <span className="required">*</span>
                    </label>
                    <input
                      type="tel"
                      placeholder="10 digit Indian number"
                      value={formData.guardianPhone}
                      onChange={(e) => setFormData({ ...formData, guardianPhone: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Guardian Relation <span className="required">*</span>
                    </label>
                    <select
                      value={formData.guardianRelation}
                      onChange={(e) => setFormData({ ...formData, guardianRelation: e.target.value })}
                      required
                    >
                      <option value="Father">Father</option>
                      <option value="Mother">Mother</option>
                      <option value="Guardian">Guardian</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="form-group full-width" style={{ marginTop: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                      <input
                        type="checkbox"
                        checked={formData.guardianConsentRecorded}
                        onChange={(e) => setFormData({ ...formData, guardianConsentRecorded: e.target.checked })}
                        style={{ width: 'auto' }}
                      />
                      <span>Parental / Guardian SMS & Email notification consent recorded</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Enrolling Student...' : 'Create Student Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: View Student Profile Details */}
      {selectedStudent && (
        <div className="modal-overlay" onClick={() => setSelectedStudent(null)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <User size={20} color="var(--accent)" />
                <span>Student Profile - {selectedStudent.roll_number}</span>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedStudent(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '16px',
                  backgroundColor: 'var(--zebra-row)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '20px',
                }}
              >
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--primary)',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '22px',
                    fontWeight: 700,
                  }}
                >
                  {selectedStudent.first_name[0]}{selectedStudent.last_name[0]}
                </div>
                <div style={{ flex: 1 }}>
                  <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--primary)' }}>
                    {selectedStudent.first_name} {selectedStudent.last_name}
                  </h2>
                  {selectedStudent.full_name_marathi && (
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      {selectedStudent.full_name_marathi}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                    <span className="badge badge-neutral">Roll: {selectedStudent.roll_number}</span>
                    <span className="badge badge-neutral">PRN: {selectedStudent.enrollment_number}</span>
                    <span className={`badge ${selectedStudent.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'}`}>
                      {selectedStudent.status}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="card" style={{ padding: '16px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <BookOpen size={16} /> Academic Placement
                  </h3>
                  <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div><strong>Program:</strong> {selectedStudent.program_code || selectedStudent.program_name || 'AI & Data Science'}</div>
                    <div><strong>Current Year:</strong> Year {selectedStudent.current_year}</div>
                    <div><strong>Division:</strong> Division {selectedStudent.current_division}</div>
                    <div><strong>College Email:</strong> {selectedStudent.roll_number.toLowerCase()}@adcet.in</div>
                  </div>
                </div>

                <div className="card" style={{ padding: '16px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldCheck size={16} /> Guardian & Demographics
                  </h3>
                  <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div><strong>Guardian:</strong> {selectedStudent.guardian_name} ({selectedStudent.guardian_relation})</div>
                    <div><strong>Guardian Mobile:</strong> {selectedStudent.guardian_phone}</div>
                    <div><strong>DOB:</strong> {selectedStudent.dob} ({selectedStudent.gender})</div>
                    <div><strong>Blood Group:</strong> {selectedStudent.blood_group || 'O+'}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedStudent(null)}>
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
