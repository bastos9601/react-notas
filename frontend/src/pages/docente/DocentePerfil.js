import React, { useState, useEffect } from 'react';
import { User, Lock, Eye, EyeOff, Save, AlertCircle } from 'lucide-react';
import { docenteService } from '../../services/docenteService';

const DocentePerfil = () => {
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    password_actual: '',
    nueva_password: '',
    confirmar_password: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    loadPerfil();
  }, []);

  const loadPerfil = async () => {
    try {
      // Obtener información del docente desde el contexto o localStorage
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      setPerfil({
        nombre_completo: userInfo.nombre || 'Docente',
        email: userInfo.email || '',
        rol: 'docente'
      });
    } catch (error) {
      console.error('Error al cargar perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar errores cuando el usuario empiece a escribir
    if (passwordError) {
      setPasswordError('');
    }
    if (passwordSuccess) {
      setPasswordSuccess('');
    }
  };

  const validatePassword = () => {
    if (!passwordForm.password_actual) {
      setPasswordError('La contraseña actual es requerida');
      return false;
    }
    
    if (!passwordForm.nueva_password) {
      setPasswordError('La nueva contraseña es requerida');
      return false;
    }
    
    if (passwordForm.nueva_password.length < 6) {
      setPasswordError('La nueva contraseña debe tener al menos 6 caracteres');
      return false;
    }
    
    if (passwordForm.nueva_password !== passwordForm.confirmar_password) {
      setPasswordError('Las contraseñas nuevas no coinciden');
      return false;
    }
    
    if (passwordForm.password_actual === passwordForm.nueva_password) {
      setPasswordError('La nueva contraseña debe ser diferente a la actual');
      return false;
    }
    
    return true;
  };

  const handleSubmitPassword = async (e) => {
    e.preventDefault();
    
    if (!validatePassword()) {
      return;
    }
    
    setIsChangingPassword(true);
    setPasswordError('');
    setPasswordSuccess('');
    
    try {
      const response = await docenteService.actualizarMiPerfil({
        password_actual: passwordForm.password_actual,
        nueva_password: passwordForm.nueva_password
      });
      
      setPasswordSuccess('Contraseña actualizada exitosamente');
      setPasswordForm({
        password_actual: '',
        nueva_password: '',
        confirmar_password: ''
      });
      
    } catch (error) {
      console.error('Error al actualizar contraseña:', error);
      const errorMessage = error.response?.data?.detail || 'Error al actualizar la contraseña. Inténtalo de nuevo.';
      setPasswordError(errorMessage);
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mi Perfil</h1>
          <p className="mt-2 text-gray-600">Gestiona tu información personal y configuración de cuenta</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Información del Perfil */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="text-center">
                <div className="mx-auto h-20 w-20 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <User className="h-10 w-10 text-blue-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {perfil?.nombre_completo || 'Docente'}
                </h2>
                <p className="text-gray-600 mb-1">{perfil?.email}</p>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Docente
                </span>
              </div>
            </div>
          </div>

          {/* Cambio de Contraseña */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center mb-6">
                <Lock className="h-6 w-6 text-gray-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">Cambiar Contraseña</h3>
              </div>

              {passwordError && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-red-400 mr-2 mt-0.5" />
                    <p className="text-sm text-red-700">{passwordError}</p>
                  </div>
                </div>
              )}

              {passwordSuccess && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-green-400 mr-2 mt-0.5" />
                    <p className="text-sm text-green-700">{passwordSuccess}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmitPassword} className="space-y-6">
                {/* Contraseña Actual */}
                <div>
                  <label htmlFor="password_actual" className="block text-sm font-medium text-gray-700 mb-2">
                    Contraseña Actual
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      id="password_actual"
                      name="password_actual"
                      value={passwordForm.password_actual}
                      onChange={handlePasswordChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 pr-10"
                      placeholder="Ingresa tu contraseña actual"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Nueva Contraseña */}
                <div>
                  <label htmlFor="nueva_password" className="block text-sm font-medium text-gray-700 mb-2">
                    Nueva Contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      id="nueva_password"
                      name="nueva_password"
                      value={passwordForm.nueva_password}
                      onChange={handlePasswordChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 pr-10"
                      placeholder="Ingresa tu nueva contraseña"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirmar Nueva Contraseña */}
                <div>
                  <label htmlFor="confirmar_password" className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmar Nueva Contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmar_password"
                      name="confirmar_password"
                      value={passwordForm.confirmar_password}
                      onChange={handlePasswordChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 pr-10"
                      placeholder="Confirma tu nueva contraseña"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Botón de Envío */}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isChangingPassword}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isChangingPassword ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Actualizando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Actualizar Contraseña
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocentePerfil;
