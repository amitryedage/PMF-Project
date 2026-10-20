import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import {
  Download,
  FileSpreadsheet,
  Users,
  ShieldAlert,
  Award,
  Eye,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  Search,
  X,
  FileText,
  Lock,
} from 'lucide-react';

interface ReportCard {
  id: string;
  title: string;
  description: string;
  endpoint: string;
  filename: string;
  icon: React.ReactNode;
  badge: string;
  badgeType: 'badge-success' | 'badge-warning' | 'badge-danger' | 'badge-neutral';
  adminOnly?: boolean;
}

export const Reports: React.FC = () => {
  const { user } = useAuth();
  const isAdminOrSuper = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  // Preview Modal State
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewTitle, setPreviewTitle] = useState('');
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [previewColumns, setPreviewColumns] = useState<string[]>([]);
  const [previewSearch, setPreviewSearch] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);

  // Download State
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const reports: ReportCard[] = [
    {
      id: 'attendance',
      title: 'Course-Wise Attendance Register',
      description: 'Comprehensive lecture session register for all academic classes, total sessions conducted, attended count, and statutory < 75% defaulter flags.',
      endpoint: 'attendance',
      filename: 'ADCET_Attendance_Register.csv',
      icon: <Users size={24} />,
      badge: 'NBA & NAAC Req.',
      badgeType: 'badge-success',
    },
    {
      id: 'grades',
      title: 'Examination Grade Rosters',
      description: 'Course examination scores, mid-term & end-term distributions, percentages, letter grades (O to F), and SGPA credit achievements.',
      endpoint: 'grades',
      filename: 'ADCET_Semester_Grade_Sheet.csv',
      icon: <Award size={24} />,
      badge: 'Academic Records',
      badgeType: 'badge-neutral',
    },
    {
      id: 'defaulters',
      title: 'Fee Dues & Defaulters Roster',
      description: 'Ledger report of students with outstanding tuition fee balances, parent/guardian phone numbers, and approved scholarship waiver adjustments.',
      endpoint: 'defaulters',
      filename: 'ADCET_Fee_Defaulters_Roster.csv',
      icon: <ShieldAlert size={24} />,
      badge: 'Finance & Accounts',
      badgeType: 'badge-warning',
    },
    {
      id: 'audit',
      title: 'Immutable Security Audit Logs',
      description: 'Forensic audit trail recording marks revisions, fee payments, student deletions, actor timestamps, and user ID accountability.',
      endpoint: 'audit',
      filename: 'ADCET_Security_Audit_Logs.csv',
      icon: <Lock size={24} />,
      badge: 'Super Admin Only',
      badgeType: 'badge-danger',
      adminOnly: true,
    },
  ];

  const handleDownload = async (report: ReportCard) => {
    try {
      setDownloadingId(report.id);
      setDownloadError(null);
      const token = api.getAccessToken();

      const res = await fetch(`/api/v1/reports/${report.endpoint}?format=csv`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error ${res.status}`);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = report.filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setDownloadSuccess(`Successfully exported ${report.filename} with formula-injection protection.`);
      setTimeout(() => setDownloadSuccess(null), 5000);
    } catch (err: any) {
      setDownloadError(err.message || 'Failed to download report.');
    } finally {
      setDownloadingId(null);
    }
  };

  const handlePreview = async (report: ReportCard) => {
    setPreviewTitle(report.title);
    setIsPreviewOpen(true);
    setPreviewLoading(true);
    setPreviewSearch('');

    try {
      // Fetch JSON version
      const data = await api.get<any[]>(`/reports/${report.endpoint}?format=json`);
      if (Array.isArray(data) && data.length > 0) {
        setPreviewRows(data);
        setPreviewColumns(Object.keys(data[0]));
      } else {
        setPreviewRows([]);
        setPreviewColumns([]);
      }
    } catch (err: any) {
      console.error('Failed to preview report', err);
      setPreviewRows([]);
      setPreviewColumns([]);
    } finally {
      setPreviewLoading(false);
    }
  };

  const filteredPreviewRows = previewRows.filter((row) => {
    if (!previewSearch.trim()) return true;
    const term = previewSearch.toLowerCase();
    return Object.values(row).some((val) => String(val).toLowerCase().includes(term));
  });

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--primary)' }}>Reports & Data Exports</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
          Standardized institutional data exports with formula-injection sanitization for accreditation & statutory audits
        </p>
      </div>

      {/* Success Notification */}
      {downloadSuccess && (
        <div className="form-alert form-alert-success" style={{ marginBottom: '20px' }}>
          <CheckCircle size={18} />
          <span>{downloadSuccess}</span>
        </div>
      )}

      {/* Error Notification */}
      {downloadError && (
        <div className="form-alert form-alert-error" style={{ marginBottom: '20px' }}>
          <AlertCircle size={18} />
          <span>{downloadError}</span>
        </div>
      )}

      {/* Cybersecurity Safeguard Notice */}
      <div className="card" style={{ marginBottom: '24px', padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              padding: '10px',
              borderRadius: '8px',
              backgroundColor: 'var(--accent-light)',
              color: 'var(--accent)',
            }}
          >
            <ShieldCheck size={24} />
          </div>
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--primary)' }}>
              CSV Formula-Injection (CWE-1236) Protection Enabled
            </h4>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              All exported CSV columns containing potentially executable spreadsheet tokens (<code style={{ color: 'var(--accent)' }}>=</code>, <code style={{ color: 'var(--accent)' }}>+</code>, <code style={{ color: 'var(--accent)' }}>-</code>, <code style={{ color: 'var(--accent)' }}>@</code>) are prefixed with a single quotation mark to prevent Dynamic Data Exchange (DDE) code execution in Microsoft Excel.
            </p>
          </div>
        </div>
      </div>

      {/* Report Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {reports.map((report) => {
          if (report.adminOnly && !isAdminOrSuper) return null;

          return (
            <div key={report.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div
                    style={{
                      padding: '12px',
                      borderRadius: '10px',
                      backgroundColor: 'var(--accent-light)',
                      color: 'var(--accent)',
                    }}
                  >
                    {report.icon}
                  </div>
                  <span className={`badge ${report.badgeType}`}>{report.badge}</span>
                </div>

                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--primary)', marginBottom: '8px' }}>
                  {report.title}
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '20px' }}>
                  {report.description}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => handlePreview(report)}
                >
                  <Eye size={15} />
                  <span>Preview Data</span>
                </button>
                <button
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  disabled={downloadingId === report.id}
                  onClick={() => handleDownload(report)}
                >
                  <Download size={15} />
                  <span>{downloadingId === report.id ? 'Exporting...' : 'Export CSV'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Live Data Preview */}
      {isPreviewOpen && (
        <div className="modal-overlay" onClick={() => setIsPreviewOpen(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px' }}>
            <div className="modal-header">
              <div className="modal-title">
                <FileSpreadsheet size={20} color="var(--accent)" />
                <span>Data Preview: {previewTitle}</span>
              </div>
              <button className="modal-close-btn" onClick={() => setIsPreviewOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              {/* Search filter in preview */}
              <div style={{ marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="Search inside preview rows..."
                    value={previewSearch}
                    onChange={(e) => setPreviewSearch(e.target.value)}
                  />
                </div>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                  Showing {filteredPreviewRows.length} of {previewRows.length} entries
                </span>
              </div>

              {/* Data Table */}
              <div style={{ maxHeight: '420px', overflow: 'auto', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
                <table>
                  <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                    <tr>
                      {previewColumns.map((col) => (
                        <th key={col} style={{ textTransform: 'uppercase', fontSize: '11px', whiteSpace: 'nowrap' }}>
                          {col.replace(/_/g, ' ')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPreviewRows.length > 0 ? (
                      filteredPreviewRows.slice(0, 50).map((row, idx) => (
                        <tr key={idx}>
                          {previewColumns.map((col) => (
                            <td key={col} style={{ fontSize: '13px', whiteSpace: 'nowrap' }}>
                              {String(row[col] ?? '-')}
                            </td>
                          ))}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={previewColumns.length || 1} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                          {previewLoading ? 'Loading live dataset from database...' : 'No data rows found.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setIsPreviewOpen(false)}>
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
