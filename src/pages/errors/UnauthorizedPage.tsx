import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldX } from 'lucide-react';
import { Button } from '@/components/common/Button';

export const UnauthorizedPage: React.FC = () => {
  const location = useLocation();
  const reason = (location.state as any)?.reason;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 font-sans">
      <div className="w-16 h-16 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mb-4">
        <ShieldX className="w-10 h-10" />
      </div>
      <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Access Restricted</h1>
      <p className="mt-2 text-sm text-slate-600 max-w-md text-center leading-relaxed">
        {reason || 'You do not have the required permissions or your account has been temporarily restricted.'}
      </p>

      <div className="mt-6 flex space-x-4">
        <Link to="/">
          <Button variant="outline">Return to Home</Button>
        </Link>
        <Link to="/student/login">
          <Button variant="primary">Student Login</Button>
        </Link>
      </div>
    </div>
  );
};
