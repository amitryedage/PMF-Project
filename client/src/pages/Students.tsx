import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Student } from '../types';
import { Search, UserPlus, Filter } from 'lucide-react';

export const Students: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const queryParams = search ? `?search=${encodeURIComponent(search)}` : '';
        const data = await api.get<Student[]>(`/students${queryParams}`);
        setStudents(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error fetching student list', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [search]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--primary)' }}>Student Records</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            Manage student profiles, program assignments, and enrollment status
          </p>
        </div>
        <button className="btn btn-primary">
          <UserPlus size={16} />
          <span>New Student</span>
        </button>
      </div>

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
          <button className="btn btn-secondary">
            <Filter size={16} />
            <span>Filters</span>
          </button>
        </div>
      </div>

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
                  <td>{s.first_name} {s.last_name}</td>
                  <td>{s.program_code || 'AI-DS'}</td>
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
                  <td>{s.guardian_name} ({s.guardian_phone})</td>
                  <td>
                    <button className="btn btn-secondary btn-sm">View Profile</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  {loading ? 'Loading student records...' : 'No student records match the search filter.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
