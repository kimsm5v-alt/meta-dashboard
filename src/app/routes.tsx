import { Routes, Route, Navigate } from 'react-router-dom';
import { UploadPage } from '../features/upload';
import { TeacherDashboardPage } from '../features/teacher-dashboard';
import { ClassDashboardPage } from '../features/class-dashboard';
import { StudentDashboardPage } from '../features/student-dashboard';
import { AIRoomPage } from '../features/ai-room';

export const AppRoutes = () => (
  <Routes>
    <Route path="/upload" element={<UploadPage />} />
    <Route path="/dashboard" element={<TeacherDashboardPage />} />
    <Route path="/dashboard/class/:classId" element={<ClassDashboardPage />} />
    <Route path="/dashboard/class/:classId/student/:studentId" element={<StudentDashboardPage />} />
    <Route path="/ai-room" element={<AIRoomPage />} />
    <Route path="/" element={<Navigate to="/dashboard" replace />} />
    <Route path="*" element={<Navigate to="/dashboard" replace />} />
  </Routes>
);

export default AppRoutes;
