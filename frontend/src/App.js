import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AdminAlumnos from './pages/admin/AdminAlumnos';
import AdminDocentes from './pages/admin/AdminDocentes';
import AdminAsignaturas from './pages/admin/AdminAsignaturas';
import AdminMatriculas from './pages/admin/AdminMatriculas';
import AdminNotas from './pages/admin/AdminNotas';
import AdminPerfil from './pages/admin/AdminPerfil';
import AdminHistorial from './pages/admin/AdminHistorial';
import AdminReportes from './pages/admin/AdminReportes';
import DocenteAsignaturas from './pages/docente/DocenteAsignaturas';
import DocenteNotas from './pages/docente/DocenteNotas';
import DocenteAlumnos from './pages/docente/DocenteAlumnos';
import DocenteAlumnosCiclo from './pages/docente/DocenteAlumnosCiclo';
import DocentePerfil from './pages/docente/DocentePerfil';
import DocenteReportes from './pages/docente/DocenteReportes';
import AlumnoAsignaturas from './pages/alumno/AlumnoAsignaturas';
import AlumnoNotas from './pages/alumno/AlumnoNotas';
import AlumnoPromedios from './pages/alumno/AlumnoPromedios';
import AlumnoPerfil from './pages/alumno/AlumnoPerfil';
import AlumnoHistorial from './pages/alumno/AlumnoHistorial';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              
              {/* Rutas de Admin */}
              <Route path="admin/alumnos" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminAlumnos />
                </ProtectedRoute>
              } />
              <Route path="admin/docentes" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDocentes />
                </ProtectedRoute>
              } />
              <Route path="admin/asignaturas" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminAsignaturas />
                </ProtectedRoute>
              } />
              <Route path="admin/matriculas" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminMatriculas />
                </ProtectedRoute>
              } />
              <Route path="admin/notas" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminNotas />
                </ProtectedRoute>
              } />
              <Route path="admin/reportes" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminReportes />
                </ProtectedRoute>
              } />
              <Route path="admin/perfil" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminPerfil />
                </ProtectedRoute>
              } />
              <Route path="admin/historial" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminHistorial />
                </ProtectedRoute>
              } />
              
              {/* Rutas de Docente */}
              <Route path="docente/asignaturas" element={
                <ProtectedRoute allowedRoles={['docente']}>
                  <DocenteAsignaturas />
                </ProtectedRoute>
              } />
              <Route path="docente/alumnos-ciclo" element={
                <ProtectedRoute allowedRoles={['docente']}>
                  <DocenteAlumnosCiclo />
                </ProtectedRoute>
              } />
              <Route path="docente/alumnos/:asignaturaId" element={
                <ProtectedRoute allowedRoles={['docente']}>
                  <DocenteAlumnos />
                </ProtectedRoute>
              } />
              <Route path="docente/notas" element={
                <ProtectedRoute allowedRoles={['docente']}>
                  <DocenteNotas />
                </ProtectedRoute>
              } />
              <Route path="docente/notas/:asignaturaId" element={
                <ProtectedRoute allowedRoles={['docente']}>
                  <DocenteNotas />
                </ProtectedRoute>
              } />
              <Route path="docente/notas/:asignaturaId/:alumnoId" element={
                <ProtectedRoute allowedRoles={['docente']}>
                  <DocenteNotas />
                </ProtectedRoute>
              } />
              <Route path="docente/perfil" element={
                <ProtectedRoute allowedRoles={['docente']}>
                  <DocentePerfil />
                </ProtectedRoute>
              } />
              <Route path="docente/reportes" element={
                <ProtectedRoute allowedRoles={['docente']}>
                  <DocenteReportes />
                </ProtectedRoute>
              } />
              
              {/* Rutas de Alumno */}
              <Route path="alumno/asignaturas" element={
                <ProtectedRoute allowedRoles={['alumno']}>
                  <AlumnoAsignaturas />
                </ProtectedRoute>
              } />
              <Route path="alumno/notas" element={
                <ProtectedRoute allowedRoles={['alumno']}>
                  <AlumnoNotas />
                </ProtectedRoute>
              } />
              <Route path="alumno/notas/:asignaturaId" element={
                <ProtectedRoute allowedRoles={['alumno']}>
                  <AlumnoNotas />
                </ProtectedRoute>
              } />
              <Route path="alumno/promedios" element={
                <ProtectedRoute allowedRoles={['alumno']}>
                  <AlumnoPromedios />
                </ProtectedRoute>
              } />
              <Route path="alumno/perfil" element={
                <ProtectedRoute allowedRoles={['alumno']}>
                  <AlumnoPerfil />
                </ProtectedRoute>
              } />
              <Route path="alumno/historial" element={
                <ProtectedRoute allowedRoles={['alumno']}>
                  <AlumnoHistorial />
                </ProtectedRoute>
              } />
            </Route>
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
