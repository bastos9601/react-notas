import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Eye, EyeOff, Mail } from 'lucide-react';
import { adminService } from '../../services/adminService';

const AdminDocentes = () => {
  const [docentes, setDocentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDocente, setEditingDocente] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    nombre_completo: '',
    dni: '',
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    loadDocentes();
  }, []);

  const loadDocentes = async () => {
    try {
      const data = await adminService.getDocentes();
      setDocentes(data);
    } catch (error) {
      console.error('Error al cargar docentes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnviarContrasena = async (docenteId, docenteNombre) => {
    if (window.confirm(`¿Enviar contraseña temporal a ${docenteNombre}?`)) {
      try {
        const response = await adminService.enviarContrasenaDocente(docenteId);
        
        if (response.email_sent) {
          // Email enviado exitosamente
          const successMessage = `
✅ ${response.message}

Docente: ${response.docente.nombre_completo}
Email: ${response.docente.email}

La contraseña temporal ha sido enviada por email.
          `;
          alert(successMessage);
        } else {
          // Email falló, pero la contraseña se generó
          const fallbackMessage = `
⚠️ ${response.message}

Docente: ${response.docente.nombre_completo}
Email: ${response.docente.email}
Contraseña temporal: ${response.docente.temp_password}

${response.instructions}
          `;
          alert(fallbackMessage);
        }
      } catch (error) {
        console.error('Error al enviar contraseña:', error);
        const errorMessage = error.response?.data?.detail || 'Error al enviar la contraseña. Inténtalo de nuevo.';
        alert(`❌ Error: ${errorMessage}`);
      }
    }
  };

  const handleEliminarDocente = async (docenteId, docenteNombre) => {
    if (window.confirm(`¿Estás seguro de eliminar al docente "${docenteNombre}"?\n\nEsta acción no se puede deshacer.`)) {
      try {
        await adminService.deleteDocente(docenteId);
        loadDocentes(); // Recargar la lista de docentes
        alert(`✅ Docente "${docenteNombre}" eliminado correctamente`);
      } catch (error) {
        console.error('Error al eliminar docente:', error);
        const errorMessage = error.response?.data?.detail || 'Error al eliminar el docente. Inténtalo de nuevo.';
        alert(`❌ Error: ${errorMessage}`);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingDocente) {
        console.log('Actualizando docente:', editingDocente.id, formData);
        await adminService.updateDocente(editingDocente.id, formData);
        loadDocentes();
        setShowModal(false);
        resetForm();
        alert('Docente actualizado correctamente');
      } else {
        await adminService.createDocente(formData);
        loadDocentes();
        setShowModal(false);
        resetForm();
        alert('Docente creado correctamente');
      }
    } catch (error) {
      console.error('Error al guardar docente:', error);
      console.error('Error details:', error.response?.data);
      alert('Error al guardar el docente. Verifica que los datos sean correctos.');
    }
  };

  const resetForm = () => {
    setFormData({
      nombre_completo: '',
      dni: '',
      email: '',
      password: ''
    });
    setEditingDocente(null);
    setShowPassword(false);
  };

  const filteredDocentes = docentes.filter(docente =>
    docente.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    docente.dni.includes(searchTerm)
  );

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
        <h1 className="text-2xl font-bold text-gray-900">Gestión de Docentes</h1>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Docente
        </button>
      </div>

      {/* Búsqueda */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Buscar por nombre o DNI..."
          className="input-field pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Tabla de docentes */}
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
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDocentes.map((docente) => (
                <tr key={docente.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {docente.nombre_completo}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {docente.dni}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {docente.usuario?.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setEditingDocente(docente);
                          setFormData({
                            nombre_completo: docente.nombre_completo,
                            dni: docente.dni,
                            email: docente.usuario?.email,
                            password: ''
                          });
                          setShowModal(true);
                        }}
                        className="text-primary-600 hover:text-primary-900"
                        title="Editar docente"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEnviarContrasena(docente.id, docente.nombre_completo)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Enviar contraseña por email"
                      >
                        <Mail className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEliminarDocente(docente.id, docente.nombre_completo)}
                        className="text-red-600 hover:text-red-900"
                        title="Eliminar docente"
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

      {/* Modal para crear/editar docente */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingDocente ? 'Editar Docente' : 'Nuevo Docente'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nombre Completo
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
                    Contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required={!editingDocente}
                      className="input-field pr-10"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  </div>
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
                    {editingDocente ? 'Actualizar' : 'Crear'}
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

export default AdminDocentes;
