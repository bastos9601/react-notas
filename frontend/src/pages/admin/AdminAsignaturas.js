import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Calendar, Eye } from 'lucide-react';
import { adminService } from '../../services/adminService';

const AdminAsignaturas = () => {
  const [asignaturas, setAsignaturas] = useState([]);
  const [docentes, setDocentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAsignatura, setEditingAsignatura] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCiclo, setSelectedCiclo] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    ciclo: '',
    docente_id: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [asignaturasData, docentesData] = await Promise.all([
        adminService.getAsignaturas(),
        adminService.getDocentes()
      ]);
      console.log('Asignaturas cargadas:', asignaturasData);
      console.log('Docentes cargados:', docentesData);
      setAsignaturas(asignaturasData);
      setDocentes(docentesData);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAsignatura) {
        await adminService.updateAsignatura(editingAsignatura.id, {
          ...formData,
          docente_id: parseInt(formData.docente_id)
        });
        loadData();
        setShowModal(false);
        resetForm();
      } else {
        await adminService.createAsignatura({
          ...formData,
          docente_id: parseInt(formData.docente_id)
        });
        loadData();
        setShowModal(false);
        resetForm();
      }
    } catch (error) {
      console.error('Error al guardar asignatura:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      ciclo: '',
      docente_id: ''
    });
    setEditingAsignatura(null);
  };

  const handleDeleteAsignatura = async (asignaturaId, asignaturaNombre) => {
    try {
      await adminService.deleteAsignatura(asignaturaId);
      loadData(); // Recargar los datos después de eliminar
      alert(`Asignatura ${asignaturaNombre} eliminada correctamente`);
    } catch (error) {
      console.error('Error al eliminar asignatura:', error);
      const errorMessage = error.response?.data?.detail || 'Error al eliminar la asignatura. Inténtalo de nuevo.';
      alert(errorMessage);
    }
  };

  const filteredAsignaturas = asignaturas.filter(asignatura => {
    const matchesSearch = asignatura.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asignatura.docente?.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asignatura.ciclo.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCiclo = selectedCiclo ? asignatura.ciclo === selectedCiclo : true;

    return matchesSearch && matchesCiclo;
  });

  // Obtener ciclos únicos con contadores de asignaturas
  const ciclosConContadores = asignaturas.reduce((acc, asignatura) => {
    const ciclo = asignatura.ciclo;
    if (ciclo) {
      if (!acc[ciclo]) {
        acc[ciclo] = 0;
      }
      acc[ciclo]++;
    }
    return acc;
  }, {});

  const ciclos = Object.keys(ciclosConContadores).sort();

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
        <h1 className="text-2xl font-bold text-gray-900">Gestión de Asignaturas</h1>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nueva Asignatura
        </button>
      </div>

      {/* Mostrar tarjetas de ciclos si no hay ciclo seleccionado */}
      {!selectedCiclo ? (
        ciclos.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ciclos.map((ciclo) => (
                <div key={ciclo} className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Calendar className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-semibold text-gray-900">Ciclo {ciclo}</h3>
                        <p className="text-sm text-gray-500">
                          {ciclosConContadores[ciclo]} {ciclosConContadores[ciclo] === 1 ? 'asignatura' : 'asignaturas'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedCiclo(ciclo)}
                      className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Mostrar
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Mensaje de instrucción */}
            <div className="bg-white p-12 rounded-lg border border-gray-200 text-center">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Selecciona un ciclo para ver las asignaturas</h3>
              <p className="mt-1 text-sm text-gray-500">
                Haz clic en una de las tarjetas de ciclo arriba para comenzar
              </p>
            </div>
          </>
        ) : (
          <div className="bg-white p-12 rounded-lg border border-gray-200 text-center">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay asignaturas registradas</h3>
            <p className="mt-1 text-sm text-gray-500">
              No se han registrado asignaturas en el sistema aún.
            </p>
          </div>
        )
      ) : (
        <>
          {/* Filtro activo */}
          <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-blue-600 mr-2" />
              <span className="text-blue-800 font-medium">
                Mostrando asignaturas del Ciclo {selectedCiclo}
              </span>
            </div>
            <button
              onClick={() => {
                setSelectedCiclo(null);
                setSearchTerm('');
              }}
              className="text-blue-600 hover:text-blue-800 transition-colors"
            >
              Ver todos los ciclos
            </button>
          </div>

          {/* Búsqueda */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar por nombre o docente..."
              className="input-field pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </>
      )}

      {/* Tabla de asignaturas - solo mostrar cuando hay ciclo seleccionado */}
      {selectedCiclo && (
        <>
          {/* Tabla de asignaturas */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ciclo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Docente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAsignaturas.map((asignatura) => (
                <tr key={asignatura.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {asignatura.nombre}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                      {asignatura.ciclo}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {asignatura.docente?.nombre_completo}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setEditingAsignatura(asignatura);
                          setFormData({
                            nombre: asignatura.nombre,
                            ciclo: asignatura.ciclo,
                            docente_id: asignatura.docente_id.toString()
                          });
                          setShowModal(true);
                        }}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`¿Estás seguro de eliminar la asignatura ${asignatura.nombre}?`)) {
                            handleDeleteAsignatura(asignatura.id, asignatura.nombre);
                          }
                        }}
                        className="text-red-600 hover:text-red-900 transition-colors"
                        title="Eliminar asignatura"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
        </>
      )}

      {/* Modal para crear/editar asignatura */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingAsignatura ? 'Editar Asignatura' : 'Nueva Asignatura'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nombre de la Asignatura
                  </label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    value={formData.nombre}
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Ciclo
                  </label>
                  <select
                    required
                    className="input-field"
                    value={formData.ciclo}
                    onChange={(e) => setFormData({...formData, ciclo: e.target.value})}
                  >
                    <option value="">Seleccionar ciclo</option>
                    <option value="I">I</option>
                    <option value="II">II</option>
                    <option value="III">III</option>
                    <option value="IV">IV</option>
                    <option value="V">V</option>
                    <option value="VI">VI</option>
                  </select>
                  {formData.ciclo && (
                    <div className="mt-2 text-xs text-green-600 font-medium">
                      Los alumnos de Ciclo {formData.ciclo} serán matriculados automáticamente en esta asignatura
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Docente
                  </label>
                  <select
                    required
                    className="input-field"
                    value={formData.docente_id}
                    onChange={(e) => setFormData({...formData, docente_id: e.target.value})}
                  >
                    <option value="">Seleccionar docente</option>
                    {docentes.length > 0 ? (
                      docentes.map((docente) => (
                        <option key={docente.id} value={docente.id}>
                          {docente.nombre_completo}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>No hay docentes disponibles</option>
                    )}
                  </select>
                  {docentes.length === 0 && (
                    <div className="text-sm text-red-600 mt-1">
                      No hay docentes disponibles. Crea un docente primero.
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="btn-secondary"
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary">
                    {editingAsignatura ? 'Actualizar' : 'Crear'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAsignaturas;
