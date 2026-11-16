import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, BookOpen, Shield, School, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/common/Card';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between font-sans">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-blue-700 flex items-center justify-center text-white shadow-sm">
              <School className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-tight">School Study Material Portal</h1>
              <span className="text-xs text-slate-500">Official Academic Resource Center</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-12 flex-1 flex flex-col justify-center">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
            Welcome to the Study Portal
          </h2>
          <p className="mt-4 text-base text-slate-600 leading-relaxed">
            Select your portal to access educational presentations, PDF notes, reference guides, and Google Forms assignments.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Student Access */}
          <Link to="/student/login" className="group block focus:outline-none">
            <Card className="h-full border-2 border-transparent hover:border-blue-600 hover:shadow-md transition-all duration-200">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <GraduationCap className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Student Portal</h3>
                <p className="text-sm text-slate-500 mt-2">
                  Computer lab access using the common school lab password. Download notes and open assignments.
                </p>
                <div className="mt-6 flex items-center text-sm font-semibold text-blue-700 group-hover:translate-x-1 transition-transform">
                  <span>Enter Student Portal</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Teacher Access */}
          <Link to="/teacher/login" className="group block focus:outline-none">
            <Card className="h-full border-2 border-transparent hover:border-indigo-600 hover:shadow-md transition-all duration-200">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <BookOpen className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Teacher Portal</h3>
                <p className="text-sm text-slate-500 mt-2">
                  Faculty authentication to publish course materials, upload files, and link Google Forms.
                </p>
                <div className="mt-6 flex items-center text-sm font-semibold text-indigo-700 group-hover:translate-x-1 transition-transform">
                  <span>Faculty Login</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Administrator Access */}
          <Link to="/admin/login" className="group block focus:outline-none">
            <Card className="h-full border-2 border-transparent hover:border-slate-800 hover:shadow-md transition-all duration-200">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center mb-4 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                  <Shield className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Administrator</h3>
                <p className="text-sm text-slate-500 mt-2">
                  System settings, teacher account provisioning, academic class mappings, and audit records.
                </p>
                <div className="mt-6 flex items-center text-sm font-semibold text-slate-900 group-hover:translate-x-1 transition-transform">
                  <span>Admin Login</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} School Study Material Management Portal &bull; Designed for Zero-Cost Institutional Reliability.
      </footer>
    </div>
  );
};
