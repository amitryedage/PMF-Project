import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  GraduationCap,
  CreditCard,
  FileSpreadsheet,
  Building2,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const role = user?.role;

  const isStaff = ['ADMIN', 'SUPER_ADMIN', 'FACULTY', 'ACCOUNTS'].includes(role || '');
  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(role || '');
  const isAccounts = ['ACCOUNTS', 'ADMIN', 'SUPER_ADMIN'].includes(role || '');

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <Building2 size={28} color="var(--primary)" />
        <div>
          <div className="sidebar-brand">ADCET Ashta</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Dept of AI & Data Science</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </NavLink>

        {isStaff && (
          <NavLink to="/students" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Users size={18} />
            <span>Students</span>
          </NavLink>
        )}

        <NavLink to="/attendance" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <CalendarCheck size={18} />
          <span>Attendance</span>
        </NavLink>

        <NavLink to="/marks" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <GraduationCap size={18} />
          <span>Exams & Marks</span>
        </NavLink>

        {(isAccounts || role === 'STUDENT') && (
          <NavLink to="/fees" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <CreditCard size={18} />
            <span>Fees & Dues</span>
          </NavLink>
        )}

        {isStaff && (
          <NavLink to="/reports" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <FileSpreadsheet size={18} />
            <span>Reports & Exports</span>
          </NavLink>
        )}
      </nav>

      <div style={{ padding: '16px', borderTop: '1px solid var(--border-color)', fontSize: '12px', color: 'var(--text-muted)' }}>
        Group 5 · ISE Activity 2<br />
        v1.0 (Light Theme)
      </div>
    </aside>
  );
};
