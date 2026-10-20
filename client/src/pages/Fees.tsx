import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Student } from '../types';
import {
  CreditCard,
  CheckCircle,
  Receipt,
  Search,
  Sparkles,
  X,
  Printer,
  AlertCircle,
  Building,
  ShieldCheck,
  TrendingUp,
  FileCheck,
  HelpCircle,
} from 'lucide-react';

interface FeeSummary {
  chargesPaise: number;
  chargesRupees: string;
  paidPaise: number;
  paidRupees: string;
  waiverPaise: number;
  waiverRupees: string;
  refundPaise: number;
  refundRupees: string;
  outstandingBalancePaise: number;
  outstandingBalanceRupees: string;
  isDefaulter: boolean;
}

interface LedgerEntry {
  id: string;
  financial_year: string;
  entry_type: 'CHARGE' | 'PAYMENT' | 'WAIVER' | 'REFUND' | 'REVERSAL';
  amount_paise: number;
  amountRupees: string;
  receipt_number?: number;
  receiptCode?: string;
  payment_mode?: string;
  notes?: string;
  created_at: string;
}

export const Fees: React.FC = () => {
  const { user } = useAuth();
  const isStudent = user?.role === 'STUDENT';

  // Search & Selected Student
  const [searchRoll, setSearchRoll] = useState('26AIDS001');
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [feeSummary, setFeeSummary] = useState<FeeSummary | null>(null);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState<{
    receiptCode: string;
    studentName: string;
    rollNumber: string;
    program: string;
    amountRupees: string;
    paymentMode: string;
    date: string;
    notes?: string;
  } | null>(null);

  // Form State
  const [amountRupees, setAmountRupees] = useState('42500');
  const [financialYear, setFinancialYear] = useState('2026-2027');
  const [paymentMode, setPaymentMode] = useState<'UPI' | 'NEFT_RTGS' | 'DEMAND_DRAFT' | 'CHEQUE' | 'CASH'>('UPI');
  const [paymentNotes, setPaymentNotes] = useState('UPI/982736182938/HDFC Bank');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Fetch student and their fee details
  const loadStudentFeeDetails = useCallback(async (roll: string) => {
    try {
      setLoading(true);
      // 1. Fetch student record
      const studentData = await api.get<Student[]>(`/students?search=${encodeURIComponent(roll)}&limit=1`);
      if (!Array.isArray(studentData) || studentData.length === 0) {
        setFeeSummary(null);
        setLedgerEntries([]);
        return;
      }

      const targetStudent = studentData[0];
      setCurrentStudent(targetStudent);

      // 2. Fetch Dues Summary
      const duesRes = await api.get<{ summary: FeeSummary }>(`/fees/student/${targetStudent.id}/dues`);
      if (duesRes && duesRes.summary) {
        setFeeSummary(duesRes.summary);
      }

      // 3. Fetch Ledger Entries
      const ledgerRes = await api.get<LedgerEntry[]>(`/fees/student/${targetStudent.id}/ledger`);
      setLedgerEntries(Array.isArray(ledgerRes) ? ledgerRes : []);
    } catch (err: any) {
      console.error('Error fetching fee ledger details', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // If student user, auto-populate with their own roll number
    if (isStudent && user?.rollNumber) {
      setSearchRoll(user.rollNumber);
      loadStudentFeeDetails(user.rollNumber);
    } else {
      loadStudentFeeDetails('26AIDS001');
    }
  }, [isStudent, user?.rollNumber, loadStudentFeeDetails]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchRoll.trim()) {
      loadStudentFeeDetails(searchRoll.trim());
    }
  };

  const handleAutofillDemoPayment = () => {
    setAmountRupees('42500');
    setPaymentMode('UPI');
    setPaymentNotes(`UPI/${Math.floor(100000000000 + Math.random() * 900000000000)}/SBI Bank`);
    setFormError(null);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStudent) {
      setFormError('No student selected. Please search for a valid student first.');
      return;
    }

    const amt = parseFloat(amountRupees);
    if (isNaN(amt) || amt <= 0) {
      setFormError('Please enter a valid positive payment amount in ₹.');
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);

      const amountPaise = Math.round(amt * 100);
      const res = await api.post<any>('/fees/payments', {
        studentId: currentStudent.id,
        financialYear,
        amountPaise,
        paymentMode,
        notes: paymentNotes.trim() || undefined,
      });

      setIsRecordModalOpen(false);
      setSuccessToast(`Payment recorded! Generated Receipt #${res.receiptCode}`);
      setTimeout(() => setSuccessToast(null), 5000);

      // Open Printable Receipt Modal immediately!
      setActiveReceipt({
        receiptCode: res.receiptCode,
        studentName: `${currentStudent.first_name} ${currentStudent.last_name}`,
        rollNumber: currentStudent.roll_number,
        program: currentStudent.program_code || 'AI-DS',
        amountRupees: parseFloat(amountRupees).toLocaleString('en-IN', { minimumFractionDigits: 2 }),
        paymentMode,
        date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        notes: paymentNotes,
      });

      // Reload ledger
      await loadStudentFeeDetails(currentStudent.roll_number);
    } catch (err: any) {
      setFormError(err.message || 'Failed to record fee payment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--primary)' }}>Fee Ledger & Receipts</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            Academic year fee structure, payment history, and atomic receipt issuance
          </p>
        </div>
        {!isStudent && (
          <button
            id="btn-record-payment"
            className="btn btn-primary"
            onClick={() => {
              setFormError(null);
              setIsRecordModalOpen(true);
            }}
          >
            <CreditCard size={16} />
            <span>Record Payment</span>
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

      {/* Student Lookup Filter (for Admins / Accounts) */}
      {!isStudent && (
        <div className="card" style={{ marginBottom: '20px', padding: '16px' }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
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
              <span>Load Student Ledger</span>
            </button>
          </form>
        </div>
      )}

      {/* Current Student Banner */}
      {currentStudent && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 18px',
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '20px',
          }}
        >
          <div>
            <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--primary)' }}>
              {currentStudent.first_name} {currentStudent.last_name}
            </span>{' '}
            <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
              ({currentStudent.roll_number} | PRN: {currentStudent.enrollment_number})
            </span>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Program: {currentStudent.program_code || 'AI-DS'} • Year {currentStudent.current_year} Division {currentStudent.current_division}
            </div>
          </div>
          <span className={`badge ${feeSummary && !feeSummary.isDefaulter ? 'badge-success' : 'badge-warning'}`}>
            {feeSummary && !feeSummary.isDefaulter ? 'No Dues Cleared' : 'Pending Dues'}
          </span>
        </div>
      )}

      {/* Financial Stat Cards */}
      <div className="grid-cols-4">
        <div className="stat-card">
          <span className="stat-title">Total Annual Fees</span>
          <div className="stat-value">
            ₹{feeSummary ? parseFloat(feeSummary.chargesRupees).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '85,000.00'}
          </div>
          <div style={{ marginTop: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>AY 2026-2027 Approved</div>
        </div>

        <div className="stat-card">
          <span className="stat-title">Total Paid</span>
          <div className="stat-value" style={{ color: 'var(--success)' }}>
            ₹{feeSummary ? parseFloat(feeSummary.paidRupees).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}
          </div>
          <div style={{ marginTop: '8px', fontSize: '13px', color: 'var(--success)' }}>
            {feeSummary && parseFloat(feeSummary.paidRupees) > 0 ? 'Verified College Receipts' : 'No payments posted'}
          </div>
        </div>

        <div className="stat-card">
          <span className="stat-title">Waiver / Concession</span>
          <div className="stat-value">
            ₹{feeSummary ? parseFloat(feeSummary.waiverRupees).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}
          </div>
          <div style={{ marginTop: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>EBC / TFWS / Merit</div>
        </div>

        <div className="stat-card">
          <span className="stat-title">Outstanding Balance</span>
          <div
            className="stat-value"
            style={{ color: feeSummary && feeSummary.outstandingBalancePaise > 0 ? 'var(--danger)' : 'var(--primary)' }}
          >
            ₹{feeSummary ? parseFloat(feeSummary.outstandingBalanceRupees).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}
          </div>
          <div style={{ marginTop: '8px' }}>
            <span className={`badge ${feeSummary && feeSummary.outstandingBalancePaise === 0 ? 'badge-success' : 'badge-danger'}`}>
              {feeSummary && feeSummary.outstandingBalancePaise === 0 ? 'No Dues Certificate Ready' : 'Dues Pending'}
            </span>
          </div>
        </div>
      </div>

      {/* Transaction & Payment Ledger */}
      <div className="card" style={{ marginTop: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--primary)' }}>
            Official Fee Ledger Entries ({ledgerEntries.length})
          </h3>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Financial Year: 2026-2027</span>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Receipt / Ref No</th>
                <th>Posting Date</th>
                <th>Entry Type</th>
                <th>Mode / Details</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {ledgerEntries.length > 0 ? (
                ledgerEntries.map((tx) => (
                  <tr key={tx.id}>
                    <td>
                      <strong>{tx.receiptCode || `TXN-${tx.id.slice(0, 8).toUpperCase()}`}</strong>
                    </td>
                    <td>{new Date(tx.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
                    <td>
                      <span className={`badge ${tx.entry_type === 'PAYMENT' ? 'badge-success' : tx.entry_type === 'CHARGE' ? 'badge-neutral' : 'badge-warning'}`}>
                        {tx.entry_type}
                      </span>
                    </td>
                    <td>
                      <div>{tx.payment_mode || 'ANNUAL_TUITION'}</div>
                      {tx.notes && <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{tx.notes}</div>}
                    </td>
                    <td>
                      <strong>₹{parseFloat(tx.amountRupees).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                    </td>
                    <td>
                      <span className="badge badge-success">CONFIRMED</span>
                    </td>
                    <td>
                      {tx.entry_type === 'PAYMENT' ? (
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => {
                            setActiveReceipt({
                              receiptCode: tx.receiptCode || `REC/2026-2027/${String(tx.receipt_number || 101).padStart(6, '0')}`,
                              studentName: currentStudent ? `${currentStudent.first_name} ${currentStudent.last_name}` : 'Student',
                              rollNumber: currentStudent ? currentStudent.roll_number : '26AIDS001',
                              program: currentStudent?.program_code || 'AI-DS',
                              amountRupees: parseFloat(tx.amountRupees).toLocaleString('en-IN', { minimumFractionDigits: 2 }),
                              paymentMode: tx.payment_mode || 'UPI',
                              date: new Date(tx.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }),
                              notes: tx.notes,
                            });
                          }}
                        >
                          <Receipt size={14} />
                          <span>View Receipt</span>
                        </button>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>-</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    {loading ? 'Loading fee ledger entries...' : 'No ledger transactions recorded yet for this student.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: Record Fee Payment */}
      {isRecordModalOpen && (
        <div className="modal-overlay" onClick={() => !isSubmitting && setIsRecordModalOpen(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <CreditCard size={20} color="var(--accent)" />
                <span>Record Fee Payment</span>
              </div>
              <button className="modal-close-btn" onClick={() => !isSubmitting && setIsRecordModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div className="modal-body">
                {/* 1-Click Demo Fill */}
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
                    ⚡ Autofill standard installment (₹42,500.00 via UPI):
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleAutofillDemoPayment}
                    style={{ background: '#FFFFFF', borderColor: 'var(--accent)' }}
                  >
                    <Sparkles size={14} color="var(--accent)" />
                    <span>Autofill Sample</span>
                  </button>
                </div>

                {formError && (
                  <div className="form-alert form-alert-error">
                    <AlertCircle size={18} />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="form-grid">
                  <div className="form-group full-width">
                    <label className="form-label">Selected Student</label>
                    <input
                      type="text"
                      disabled
                      value={
                        currentStudent
                          ? `${currentStudent.first_name} ${currentStudent.last_name} (${currentStudent.roll_number})`
                          : 'No student loaded'
                      }
                      style={{ backgroundColor: 'var(--bg-page)', cursor: 'not-allowed' }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Payment Amount (in ₹) <span className="required">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      placeholder="e.g. 42500"
                      value={amountRupees}
                      onChange={(e) => setAmountRupees(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Payment Mode</label>
                    <select
                      value={paymentMode}
                      onChange={(e) => setPaymentMode(e.target.value as any)}
                      required
                    >
                      <option value="UPI">UPI (GooglePay / PhonePe / BHIM)</option>
                      <option value="NEFT_RTGS">NEFT / RTGS Net Banking</option>
                      <option value="DEMAND_DRAFT">Demand Draft (DD)</option>
                      <option value="CHEQUE">Bank Cheque</option>
                      <option value="CASH">Cash Deposit</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Financial Year</label>
                    <select
                      value={financialYear}
                      onChange={(e) => setFinancialYear(e.target.value)}
                    >
                      <option value="2026-2027">2026-2027</option>
                      <option value="2025-2026">2025-2026</option>
                    </select>
                  </div>

                  <div className="form-group full-width">
                    <label className="form-label">Transaction / UTR Reference Notes</label>
                    <input
                      type="text"
                      placeholder="e.g. UPI/928374918273/HDFC or DD No. 549102"
                      value={paymentNotes}
                      onChange={(e) => setPaymentNotes(e.target.value)}
                    />
                    <span className="form-helper">This reference will be permanently printed on the official fee receipt.</span>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsRecordModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Posting Payment...' : 'Generate Official Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Official Printable Receipt */}
      {activeReceipt && (
        <div className="modal-overlay" onClick={() => setActiveReceipt(null)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <div className="modal-title">
                <Receipt size={20} color="var(--accent)" />
                <span>Official Fee Receipt</span>
              </div>
              <button className="modal-close-btn" onClick={() => setActiveReceipt(null)}>
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
                  <h2 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--primary)', margin: '4px 0' }}>
                    Annasaheb Dange College of Engineering & Technology
                  </h2>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Ashta, Sangli, Maharashtra 416301 • Autonomous Institute • NAAC 'A++' Grade
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
                    FEE PAYMENT RECEIPT (ACCOUNTS SECTION)
                  </div>
                </div>

                {/* Receipt Identifiers */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '16px' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Receipt No:</span>{' '}
                    <strong style={{ color: 'var(--primary)' }}>{activeReceipt.receiptCode}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Date:</span>{' '}
                    <strong>{activeReceipt.date}</strong>
                  </div>
                </div>

                {/* Student Particulars */}
                <div
                  style={{
                    backgroundColor: 'var(--zebra-row)',
                    padding: '12px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '13px',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '8px',
                    marginBottom: '16px',
                  }}
                >
                  <div><strong>Student Name:</strong> {activeReceipt.studentName}</div>
                  <div><strong>Roll Number:</strong> {activeReceipt.rollNumber}</div>
                  <div><strong>Program:</strong> {activeReceipt.program}</div>
                  <div><strong>Payment Mode:</strong> {activeReceipt.paymentMode}</div>
                  {activeReceipt.notes && (
                    <div style={{ gridColumn: '1 / -1' }}>
                      <strong>Reference / UTR:</strong> {activeReceipt.notes}
                    </div>
                  )}
                </div>

                {/* Financial Total */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px',
                    backgroundColor: 'var(--success-bg)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid #BBF7D0',
                    marginBottom: '20px',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--success)', textTransform: 'uppercase' }}>
                      Amount Received with Thanks
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Full installment cleared</div>
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--success)' }}>
                    ₹{activeReceipt.amountRupees}
                  </div>
                </div>

                {/* Authorization Stamp */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: '16px', borderTop: '1px dashed var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--success)' }}>
                    <ShieldCheck size={18} />
                    <span>Digitally Verified & Locked in Audit Trail</span>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)' }}>Accountant / Registrar</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ADCET Ashta</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => window.print()}
              >
                <Printer size={16} />
                <span>Print Official Receipt</span>
              </button>
              <button className="btn btn-primary" onClick={() => setActiveReceipt(null)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
