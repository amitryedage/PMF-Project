import React from 'react';
import { CreditCard, CheckCircle, Receipt, ArrowUpRight } from 'lucide-react';

export const Fees: React.FC = () => {
  const sampleTransactions = [
    { receipt: 'REC/2026-2027/000104', date: '15/09/2026', type: 'PAYMENT', mode: 'UPI', amount: '₹42,500.00', status: 'CONFIRMED' },
    { receipt: 'REC/2026-2027/000042', date: '01/08/2026', type: 'PAYMENT', mode: 'NEFT_RTGS', amount: '₹42,500.00', status: 'CONFIRMED' },
    { receipt: '-', date: '15/07/2026', type: 'CHARGE', mode: 'ANNUAL_TUITION', amount: '₹85,000.00', status: 'POSTED' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--primary)' }}>Fee Ledger & Receipts</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            Academic year fee structure, payment history, and receipt issuance
          </p>
        </div>
        <button className="btn btn-primary">
          <CreditCard size={16} />
          <span>Record Payment</span>
        </button>
      </div>

      <div className="grid-cols-4">
        <div className="stat-card">
          <span className="stat-title">Total Annual Fees</span>
          <div className="stat-value">₹85,000.00</div>
          <div style={{ marginTop: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>AY 2026-2027</div>
        </div>

        <div className="stat-card">
          <span className="stat-title">Total Paid</span>
          <div className="stat-value" style={{ color: 'var(--success)' }}>₹85,000.00</div>
          <div style={{ marginTop: '8px', fontSize: '13px', color: 'var(--success)' }}>Cleared in 2 installments</div>
        </div>

        <div className="stat-card">
          <span className="stat-title">Waivers / Scholarship</span>
          <div className="stat-value">₹0.00</div>
          <div style={{ marginTop: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>OPEN Category</div>
        </div>

        <div className="stat-card">
          <span className="stat-title">Outstanding Balance</span>
          <div className="stat-value">₹0.00</div>
          <div style={{ marginTop: '8px' }}>
            <span className="badge badge-success">No Dues Certificate Ready</span>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: 'var(--primary)' }}>
          Transaction & Payment Ledger
        </h3>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Receipt No</th>
                <th>Posting Date</th>
                <th>Entry Type</th>
                <th>Payment Mode</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Receipt</th>
              </tr>
            </thead>
            <tbody>
              {sampleTransactions.map((tx, idx) => (
                <tr key={idx}>
                  <td><strong>{tx.receipt}</strong></td>
                  <td>{tx.date}</td>
                  <td>
                    <span className={`badge ${tx.type === 'PAYMENT' ? 'badge-success' : 'badge-neutral'}`}>
                      {tx.type}
                    </span>
                  </td>
                  <td>{tx.mode}</td>
                  <td><strong>{tx.amount}</strong></td>
                  <td>
                    <span className="badge badge-success">{tx.status}</span>
                  </td>
                  <td>
                    {tx.receipt !== '-' ? (
                      <button className="btn btn-secondary btn-sm">
                        <Receipt size={14} />
                        <span>Print</span>
                      </button>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
