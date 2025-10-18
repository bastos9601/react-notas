import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Send, Calendar, Eye, BookOpen } from 'lucide-react';
import { adminService } from '../../services/adminService';
import AdminHistorialAcademico from './AdminHistorialAcademico';

const AdminAlumnos = () => {
  const [alumnos, setAlumnos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showHistorialModal, setShowHistorialModal] = useState(false);
  const [editingAlumno, setEditingAlumno] = useState(null);
  const [selectedAlumnoHistorial, setSelectedAlumnoHistorial] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCiclo, setSelectedCiclo] = useState(null);
  const [formData, setFormData] = useState({
    nombre_completo: '',
    dni: '',
    ciclo: '',
    email: '',
    password: ''
  });

  useEffect(() => {
    loadAlumnos();
  }, []);

  const loadAlumnos = async () => {
    try {
      const data = await adminService.getAlumnos();
      setAlumnos(data);
    } catch (error) {
      console.error('Error al cargar alumnos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAlumno) {
        // Para actualización, enviar null si password está vacío
        const updateData = { ...formData };
        if (updateData.password === '') {
          updateData.password = null;
        }
        await adminService.updateAlumno(editingAlumno.id, updateData);
        loadAlumnos();
        setShowModal(false);
        resetForm();
      } else {
        await adminService.createAlumno(formData);
        loadAlumnos();
        setShowModal(false);
        resetForm();
      }
    } catch (error) {
      console.error('Error al guardar alumno:', error);
      alert('Error al guardar el alumno. Verifica que los datos sean correctos.');
    }
  };

  const resetForm = () => {
    setFormData({
      nombre_completo: '',
      dni: '',
      ciclo: '',
      email: '',
      password: ''
    });
    setEditingAlumno(null);
  };

  const handleDeleteAlumno = async (alumnoId, alumnoNombre) => {
    try {
      await adminService.deleteAlumno(alumnoId);
      loadAlumnos(); // Recargar los datos después de eliminar
      alert(`Alumno ${alumnoNombre} eliminado correctamente`);
    } catch (error) {
      console.error('Error al eliminar alumno:', error);
      const errorMessage = error.response?.data?.detail || 'Error al eliminar el alumno. Inténtalo de nuevo.';
      alert(errorMessage);
    }
  };

  const handleEnviarContrasena = async (alumnoId, alumnoNombre) => {
    try {
      const response = await adminService.enviarContrasenaAlumno(alumnoId);
      
      if (response.email_sent) {
        // Email enviado exitosamente
        const successMessage = `
✅ ${response.message}

Alumno: ${response.alumno.nombre_completo}
Email: ${response.alumno.email}

El email con las credenciales ha sido enviado exitosamente.
        `;
        alert(successMessage);
      } else {
        // Email falló, mostrar contraseña temporal
        const fallbackMessage = `
⚠️ ${response.message}

Alumno: ${response.alumno.nombre_completo}
Email: ${response.alumno.email}
Contraseña temporal: ${response.alumno.temp_password}

Error del email: ${response.email_error}

${response.instructions}
        `;
        alert(fallbackMessage);
      }
    } catch (error) {
      console.error('Error al enviar contraseña:', error);
      const errorMessage = error.response?.data?.detail || 'Error al enviar la contraseña. Inténtalo de nuevo.';
      alert(`❌ Error: ${errorMessage}`);
    }
  };

  const handleRegistrarSiguienteCiclo = async (alumnoId, alumnoNombre) => {
    try {
      if (!window.confirm(`¿Deseas registrar a ${alumnoNombre} en el siguiente ciclo (si corresponde)?`)) return;
      const response = await adminService.registrarSiguienteCicloAlumno(alumnoId);
      
      // Verificar si el alumno puede avanzar
      if (response.puede_avanzar === false) {
        // Si no puede avanzar, mostrar mensaje de error
        alert(`No se puede registrar al alumno: ${response.mensaje}`);
      } else if (response.registrado) {
        // Si fue registrado exitosamente
        alert(`Éxito: ${response.mensaje}`);
        // Recargar la lista de alumnos para reflejar el cambio de ciclo
        loadAlumnos();
      } else {
        // Otro caso (por ejemplo, si ya está en el último ciclo)
        alert(response.mensaje || 'Operación completada');
      }
    } catch (error) {
      console.error('Error al registrar siguiente ciclo:', error);
      const errorMessage = error.response?.data?.detail || 'Error al registrar el siguiente ciclo. Inténtalo de nuevo.';
      alert(errorMessage);
    }
  };

  // Obtener ciclos únicos con contadores
  const ciclosConContadores = alumnos.reduce((acc, alumno) => {
    const ciclo = alumno.ciclo;
    if (!acc[ciclo]) {
      acc[ciclo] = 0;
    }
    acc[ciclo]++;
    return acc;
  }, {});

  const ciclos = Object.keys(ciclosConContadores).sort();

  const filteredAlumnos = alumnos.filter(alumno => {
    const matchesSearch = alumno.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alumno.dni.includes(searchTerm) ||
                         alumno.ciclo.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCiclo = selectedCiclo ? alumno.ciclo === selectedCiclo : true;
    
    return matchesSearch && matchesCiclo;
  }).sort((a, b) => a.nombre_completo.localeCompare(b.nombre_completo));

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
        <h1 className="text-2xl font-bold text-gray-900">Gestión de Alumnos</h1>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Alumno
        </button>
      </div>

      {/* Tarjetas de Ciclos */}
      {ciclos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {ciclos.map((ciclo) => (
            <div
              key={ciclo}
              className={`bg-white p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer hover:shadow-md ${
                selectedCiclo === ciclo 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedCiclo(selectedCiclo === ciclo ? null : ciclo)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-semibold text-gray-900">Ciclo {ciclo}</h3>
                    <p className="text-sm text-gray-500">
                      {ciclosConContadores[ciclo]} {ciclosConContadores[ciclo] === 1 ? 'alumno' : 'alumnos'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center text-blue-600">
                  <Eye className="h-4 w-4" />
                  <span className="ml-1 text-sm font-medium">Mostrar</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Solo mostrar tabla y búsqueda cuando hay un ciclo seleccionado */}
      {selectedCiclo && (
        <>
          {/* Filtros activos */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Filtro activo:</span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              Ciclo {selectedCiclo}
              <button
                onClick={() => {
                  setSelectedCiclo(null);
                  setSearchTerm(''); // Limpiar también la búsqueda
                }}
                className="ml-2 text-blue-600 hover:text-blue-800"
              >
                ×
              </button>
            </span>
          </div>

          {/* Búsqueda */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar por nombre, DNI o ciclo..."
              className="input-field pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Tabla de alumnos */}
          <div className="card">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nombre Completo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      DNI
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ciclo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAlumnos.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                        {selectedCiclo 
                          ? `No hay alumnos en el Ciclo ${selectedCiclo}${searchTerm ? ' que coincidan con la búsqueda' : ''}`
                          : searchTerm 
                            ? 'No se encontraron alumnos que coincidan con la búsqueda'
                            : 'No hay alumnos registrados'
                        }
                      </td>
                    </tr>
                  ) : (
                    filteredAlumnos.map((alumno) => (
                    <tr key={alumno.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {alumno.nombre_completo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {alumno.dni}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {alumno.ciclo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {alumno.usuario?.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleRegistrarSiguienteCiclo(alumno.id, alumno.nombre_completo)}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Registrar siguiente ciclo"
                          >
                            →
                          </button>
                          <button
                            onClick={() => {
                              setSelectedAlumnoHistorial(alumno);
                              setShowHistorialModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                            title="Ver historial académico"
                          >
                            <BookOpen className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingAlumno(alumno);
                              setFormData({
                                nombre_completo: alumno.nombre_completo,
                                dni: alumno.dni,
                                ciclo: alumno.ciclo,
                                email: alumno.usuario?.email,
                                password: ''
                              });
                              setShowModal(true);
                            }}
                            className="text-primary-600 hover:text-primary-900"
                            title="Editar alumno"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`¿Enviar contraseña temporal a ${alumno.nombre_completo}?`)) {
                                handleEnviarContrasena(alumno.id, alumno.nombre_completo);
                              }
                            }}
                            className="text-green-600 hover:text-green-900 transition-colors"
                            title="Enviar contraseña"
                          >
                            <Send className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`¿Estás seguro de eliminar al alumno ${alumno.nombre_completo}?`)) {
                                handleDeleteAlumno(alumno.id, alumno.nombre_completo);
                              }
                            }}
                            className="text-red-600 hover:text-red-900 transition-colors"
                            title="Eliminar alumno"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Mensaje cuando no hay ciclo seleccionado */}
      {!selectedCiclo && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">
            Selecciona un ciclo para ver los alumnos
          </div>
          <div className="text-gray-400 text-sm mt-2">
            Haz clic en una de las tarjetas de ciclo arriba para comenzar
          </div>
        </div>
      )}

      {/* Modal para crear/editar alumno */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingAlumno ? 'Editar Alumno' : 'Nuevo Alumno'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nombre y Apellido
                  </label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    value={formData.nombre_completo}
                    onChange={(e) => setFormData({...formData, nombre_completo: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    DNI
                  </label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    value={formData.dni}
                    onChange={(e) => setFormData({...formData, dni: e.target.value})}
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
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    className="input-field"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Contraseña {editingAlumno && <span className="text-gray-500">(opcional)</span>}
                  </label>
                  <input
                    type="password"
                    required={!editingAlumno}
                    className="input-field"
                    placeholder={editingAlumno ? "Dejar vacío para mantener la contraseña actual" : "Contraseña del alumno"}
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                  />
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
                    {editingAlumno ? 'Actualizar' : 'Crear'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal para ver historial académico */}
      {showHistorialModal && selectedAlumnoHistorial && (
        <AdminHistorialAcademico 
          alumno={selectedAlumnoHistorial} 
          onClose={() => setShowHistorialModal(false)} 
        />
      )}
    </div>
  );
};

export default AdminAlumnos;
