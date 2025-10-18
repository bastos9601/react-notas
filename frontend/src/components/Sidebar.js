import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  BookOpen, 
  UserCheck,
  FileText,
  TrendingUp,
  User,
  X,
  BarChart
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();

  const getNavigationItems = () => {
    const baseItems = [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'docente', 'alumno'] }
    ];

    if (user?.rol === 'admin') {
      return [
        ...baseItems,
        { name: 'Gestionar Alumnos', href: '/admin/alumnos', icon: Users, roles: ['admin'] },
        { name: 'Gestionar Docentes', href: '/admin/docentes', icon: GraduationCap, roles: ['admin'] },
        { name: 'Gestionar Asignaturas', href: '/admin/asignaturas', icon: BookOpen, roles: ['admin'] },
        { name: 'Matricular Alumnos', href: '/admin/matriculas', icon: UserCheck, roles: ['admin'] },
        // { name: 'Ver Notas', href: '/admin/notas', icon: FileText, roles: ['admin'] },
        { name: 'Historial Académico', href: '/admin/historial', icon: GraduationCap, roles: ['admin'] },
        { name: 'Reportes', href: '/admin/reportes', icon: BarChart, roles: ['admin'] },
        { name: 'Mi Perfil', href: '/admin/perfil', icon: User, roles: ['admin'] }
      ];
    }

    if (user?.rol === 'docente') {
      return [
        ...baseItems,
        { name: 'Mis Asignaturas', href: '/docente/asignaturas', icon: BookOpen, roles: ['docente'] },
        { name: 'Gestionar Alumnos', href: '/docente/alumnos-ciclo', icon: Users, roles: ['docente'] },
        { name: 'Registrar Notas', href: '/docente/notas', icon: FileText, roles: ['docente'] },
        { name: 'Reportes', href: '/docente/reportes', icon: BarChart, roles: ['docente'] },
        { name: 'Mi Perfil', href: '/docente/perfil', icon: User, roles: ['docente'] }
      ];
    }

    if (user?.rol === 'alumno') {
      return [
        ...baseItems,
        { name: 'Mis Asignaturas', href: '/alumno/asignaturas', icon: BookOpen, roles: ['alumno'] },
        { name: 'Mis Notas', href: '/alumno/notas', icon: FileText, roles: ['alumno'] },
        { name: 'Mis Promedios', href: '/alumno/promedios', icon: TrendingUp, roles: ['alumno'] },
        { name: 'Mi Historial Académico', href: '/alumno/historial', icon: GraduationCap, roles: ['alumno'] },
        { name: 'Mi Perfil', href: '/alumno/perfil', icon: User, roles: ['alumno'] }
      ];
    }

    return baseItems;
  };

  const navigationItems = getNavigationItems();

  return (
    <>
      {/* Sidebar para desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200 pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4">
            <h2 className="text-lg font-semibold text-gray-900">Menú</h2>
          </div>
          <div className="mt-5 flex-grow flex flex-col">
            <nav className="flex-1 px-2 space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className={({ isActive }) =>
                      `sidebar-item ${isActive ? 'active' : ''}`
                    }
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </NavLink>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Sidebar para móvil */}
      <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:hidden ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between px-4 py-5 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Menú</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `sidebar-item ${isActive ? 'active' : ''}`
                  }
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </NavLink>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
