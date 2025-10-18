import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { adminService } from '../services/adminService';
import { docenteService } from '../services/docenteService';
import { alumnoService } from '../services/alumnoService';
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  FileText,
  TrendingUp,
  Award
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        let data = null;
        
        if (user?.rol === 'admin') {
          data = await adminService.getDashboard();
        } else if (user?.rol === 'docente') {
          const asignaturas = await docenteService.getMisAsignaturas();
          data = {
            total_asignaturas: asignaturas.length,
            total_alumnos: 0, // Se puede calcular sumando alumnos de todas las asignaturas
            total_notas: 0 // Se puede calcular sumando notas de todas las asignaturas
          };
        } else if (user?.rol === 'alumno') {
          const asignaturas = await alumnoService.getMisAsignaturas();
          const notas = await alumnoService.getMisNotas();
          const promedio = await alumnoService.getMiPromedio();
          data = {
            total_asignaturas: asignaturas.length,
            total_notas: notas.length,
            promedio: promedio.promedio
          };
        }
        
        setStats(data);
      } catch (error) {
        console.error('Error al cargar datos del dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user]);

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'docente':
        return 'Docente';
      case 'alumno':
        return 'Alumno';
      default:
        return role;
    }
  };

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    let greeting = '';
    
    if (hour < 12) {
      greeting = 'Buenos días';
    } else if (hour < 18) {
      greeting = 'Buenas tardes';
    } else {
      greeting = 'Buenas noches';
    }
    
    return `${greeting}, ${user?.nombre}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header de bienvenida */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {getWelcomeMessage()}
        </h1>
        <p className="text-gray-600 mt-1">
          Bienvenido al Sistema de Gestión de Notas como {getRoleDisplayName(user?.rol)}
        </p>
      </div>

      {/* Estadísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {user?.rol === 'admin' && (
            <>
              <div className="card">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Alumnos</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.total_alumnos}</p>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <GraduationCap className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Docentes</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.total_docentes}</p>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <BookOpen className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Asignaturas</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.total_asignaturas}</p>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <FileText className="h-8 w-8 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Notas</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.total_notas}</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {user?.rol === 'docente' && (
            <>
              <div className="card">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <BookOpen className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Mis Asignaturas</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.total_asignaturas}</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {user?.rol === 'alumno' && (
            <>
              <div className="card">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <BookOpen className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Asignaturas Matriculadas</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.total_asignaturas}</p>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <FileText className="h-8 w-8 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Notas</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.total_notas}</p>
                  </div>
                </div>
              </div>

              {/* <div className="card">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <TrendingUp className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Promedio General</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.promedio}</p>
                  </div>
                </div>
              </div> */}
            </>
          )}
        </div>
      )}

      {/* Acciones rápidas */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {user?.rol === 'admin' && (
            <>
              <a href="/admin/alumnos" className="btn-primary text-center">
                Gestionar Alumnos
              </a>
              <a href="/admin/docentes" className="btn-primary text-center">
                Gestionar Docentes
              </a>
              <a href="/admin/asignaturas" className="btn-primary text-center">
                Gestionar Asignaturas
              </a>
              <a href="/admin/notas" className="btn-primary text-center">
                Ver Notas
              </a>
            </>
          )}
          
          {user?.rol === 'docente' && (
            <>
              <a href="/docente/asignaturas" className="btn-primary text-center">
                Ver Mis Asignaturas
              </a>
              <a href="/docente/notas" className="btn-primary text-center">
                Registrar Notas
              </a>
            </>
          )}
          
          {user?.rol === 'alumno' && (
            <>
              <a href="/alumno/asignaturas" className="btn-primary text-center">
                Ver Mis Asignaturas
              </a>
              <a href="/alumno/notas" className="btn-primary text-center">
                Ver Mis Notas
              </a>
              <a href="/alumno/historial" className="btn-primary text-center">
                Ver Mi Historial Académico
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
