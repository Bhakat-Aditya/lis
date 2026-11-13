import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('lis_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('lis_auth_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Validate session on load
    if (token) {
      api.get('/auth/me')
        .then((res) => {
          if (res.data?.user) {
            setUser(res.data.user);
            localStorage.setItem('lis_user', JSON.stringify(res.data.user));
          }
        })
        .catch(() => {
          logout();
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [token]);

  // Prevent multiple concurrent login/logout invocations
  const loginInProgressRef = React.useRef(false);
  const logoutInProgressRef = React.useRef(false);

  const login = async (loginId, password, totp = null) => {
    if (loginInProgressRef.current) {
      return { success: false, message: 'Login already in progress...' };
    }
    loginInProgressRef.current = true;

    try {
      const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'Browser Client';
      const res = await api.post('/auth/login', {
        loginId,
        password,
        totp,
        userAgent,
      });

      if (res.data?.token && res.data?.user) {
        setToken(res.data.token);
        setUser(res.data.user);
        localStorage.setItem('lis_auth_token', res.data.token);
        localStorage.setItem('lis_user', JSON.stringify(res.data.user));
        return { success: true, user: res.data.user };
      }
      return { success: false, message: res.data?.Message || 'Login failed' };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.Message || err.message || 'Login connection failed',
      };
    } finally {
      loginInProgressRef.current = false;
    }
  };

  const logout = async () => {
    if (logoutInProgressRef.current) return;
    logoutInProgressRef.current = true;

    try {
      if (token) {
        await api.post('/auth/logout');
      }
    } catch {
      // Ignore network errors on logout
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('lis_auth_token');
      localStorage.removeItem('lis_user');
      logoutInProgressRef.current = false;
    }
  };

  const role = user?.role || 'Receptionist';

  /**
   * Permission Evaluator implementing official handwritten access rules:
   * 1. Reception / Office: Patient Entry, Add Test, Received Sample, Delete Report, Restore Report, Send WhatsApp
   * 2. Branch: Patient Entry/Update, Add Test, Payment Receive, Send WhatsApp, [X] Log Patient, [X] EMR Patient
   * 3. Technician: Set Default Result, Upload Order, Download Result, Calculate Result, Receive Sample, Release Report, Report Update
   * 4. Microbiology User: Update specific live Microbiology Dept
   * 5. Master Control - Setting: View/Update Master static Data
   * 6. Super: All Access (X) except Update Master Data static settings
   */
  const can = (action) => {
    if (!user) return false;
    const r = user.role;

    switch (action) {
      // 1. Reception / Office & 2. Branch: Patient Entry (Add/Update)
      case 'patient_entry':
      case 'add_patient':
      case 'update_patient':
        return ['Super', 'Receptionist', 'Office', 'Branch'].includes(r);

      // 1. Reception / Office & 2. Branch: Add Test (ADD TEST MULTIPLE)
      case 'add_test':
      case 'add_test_multiple':
        return ['Super', 'Receptionist', 'Office', 'Branch'].includes(r);

      // 1. Reception / Office & 3. Technician: Received Sample
      case 'receive_sample':
        return ['Super', 'Receptionist', 'Office', 'Technician'].includes(r);

      // 1. Reception / Office: Delete Report & Restore Report
      case 'delete_report':
      case 'restore_report':
        return ['Super', 'Receptionist', 'Office'].includes(r);

      // 1. Reception / Office & 2. Branch: Send WhatsApp
      case 'send_whatsapp':
        return ['Super', 'Receptionist', 'Office', 'Branch', 'Technician', 'Doctor'].includes(r);

      // 2. Branch: Payment Receive
      case 'payment_receive':
      case 'deposit':
        return ['Super', 'Receptionist', 'Office', 'Branch'].includes(r);

      // 2. Branch: X Log Patient & X EMR Patient (Explicitly Forbidden for Branch)
      case 'log_patient':
      case 'patient_logs':
        return r !== 'Branch';

      case 'emr_patient':
      case 'patient_emr':
        return r !== 'Branch';

      // 3. Technician permissions
      case 'set_default_result':
        return ['Super', 'Technician', 'Doctor'].includes(r);

      case 'upload_order':
        return ['Super', 'Technician'].includes(r);

      case 'download_result':
        return ['Super', 'Technician', 'Doctor'].includes(r);

      case 'calculate_result':
        return ['Super', 'Technician'].includes(r);

      case 'release_report':
        return ['Super', 'Technician', 'Doctor'].includes(r);

      case 'recall_report':
        return ['Super', 'Technician', 'Doctor'].includes(r);

      case 'report_update':
      case 'update_report':
        return ['Super', 'Technician', 'Doctor', 'Microbiology'].includes(r);

      // 4. Microbiology User: Update specific live Microbiology Dept
      case 'microbiology_update':
        return ['Super', 'Technician', 'Microbiology'].includes(r);

      // 5. Master Control - Setting: View / Update Master static Data
      case 'view_master':
        return true; // All roles can view

      // 6. Super & Setting: Update Master Data static settings & templates
      case 'update_master':
        return ['Setting', 'Super'].includes(r);

      default:
        return r === 'Super';
    }
  };

  const hasRole = (allowedRoles = []) => {
    if (!user) return false;
    return allowedRoles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token && !!user,
        login,
        logout,
        hasRole,
        can,
        canUpdateMaster: role === 'Setting',
        canViewPatientLogs: role !== 'Branch',
        canViewPatientEmr: role !== 'Branch',
        isSuper: role === 'Super',
        isBranch: role === 'Branch',
        isTechnician: role === 'Technician',
        isMicrobiology: role === 'Microbiology',
        isSetting: role === 'Setting',
        isReceptionOrOffice: role === 'Receptionist' || role === 'Office',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
