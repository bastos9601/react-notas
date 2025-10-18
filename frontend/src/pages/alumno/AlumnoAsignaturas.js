import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, User, Calendar } from 'lucide-react';
import { alumnoService } from '../../services/alumnoService';

const AlumnoAsignaturas = () => {
  const navigate = useNavigate();
  const [asignaturas, setAsignaturas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAsignaturas();
  }, []);

  const loadAsignaturas = async () => {
    try {
      // Pasar true para obtener solo asignaturas del ciclo actual
      const data = await alumnoService.getMisAsignaturas(true);
      setAsignaturas(data);
    } catch (error) {
      console.error('Error al cargar asignaturas:', error);
    } finally {
      setLoading(false);
    }
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Mis Asignaturas</h1>
      </div>

      {/* Grid de asignaturas */}
      {asignaturas.length === 0 ? (
        <div className="card text-center py-12">
          <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No tienes asignaturas matriculadas</h3>
          <p className="mt-1 text-sm text-gray-500">
            Contacta con el administrador para matricularte en asignaturas.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {asignaturas.map((asignatura) => (
            <div key={asignatura.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <BookOpen className="h-8 w-8 text-primary-600 mr-3" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    {asignatura.nombre}
                  </h3>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>Ciclo {asignatura.ciclo}</span>
                </div>
                
                <div className="flex items-center text-sm text-gray-600">
                  <User className="h-4 w-4 mr-2" />
                  <span>{asignatura.docente?.nombre_completo}</span>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => navigate(`/alumno/notas/${asignatura.id}`)}
                  className="w-full btn-primary text-sm"
                >
                  Ver Mis Notas
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Información adicional */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Resumen</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600">{asignaturas.length}</div>
            <div className="text-sm text-gray-500">Asignaturas Matriculadas</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">-</div>
            <div className="text-sm text-gray-500">Notas Registradas</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">-</div>
            <div className="text-sm text-gray-500">Promedio General</div>
          </div>
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => navigate('/alumno/notas')}
            className="btn-primary text-center"
          >
            Ver Todas Mis Notas
          </button>
          <button
            onClick={() => navigate('/alumno/promedios')}
            className="btn-secondary text-center"
          >
            Ver Mis Promedios
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlumnoAsignaturas;
