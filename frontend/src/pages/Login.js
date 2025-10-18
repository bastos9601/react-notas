import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, X } from 'lucide-react';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoveryMessage, setRecoveryMessage] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(formData.email, formData.password);
    
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  const handleRecovery = async (e) => {
    e.preventDefault();
    setRecoveryLoading(true);
    setRecoveryMessage('');

    try {
      const response = await fetch('http://localhost:8000/auth/recuperar-contrasena', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: recoveryEmail }),
      });

      const data = await response.json();

      if (response.ok) {
        setRecoveryMessage('Se ha enviado un enlace de recuperación a tu email');
        setRecoveryEmail('');
        setShowModal(false);
      } else {
        setRecoveryMessage(data.detail || 'Error al enviar el enlace de recuperación');
      }
    } catch (err) {
      setRecoveryMessage('Error de conexión. Inténtalo de nuevo.');
    } finally {
      setRecoveryLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-md">
        <div>
          <h2 className="mt-2 text-center text-3xl font-bold text-gray-800">
            Sistema de Notas
          </h2>
          <p className="mt-3 text-center text-sm text-gray-600 border-b pb-4">
            Inicia sesión en tu cuenta
          </p>
        </div>
        
        {/* Formulario principal */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-5">
            {/* Campo email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-blue-500" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="w-full px-3 py-3 pl-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors border-gray-300 bg-white shadow-sm"
                  placeholder="tu@email.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>

             {/* Campo contraseña */}
             <div>
               <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                 Contraseña
               </label>
               <div className="relative">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                   <Lock className="h-5 w-5 text-blue-500" />
                 </div>
                 <input
                   id="password"
                   name="password"
                   type={showPassword ? 'text' : 'password'}
                   autoComplete="current-password"
                   required
                   className={`w-full px-3 py-3 pl-10 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors shadow-sm ${
                     showPassword 
                       ? 'border-blue-300 bg-blue-50' 
                       : 'border-gray-300 bg-white'
                   }`}
                   placeholder="Tu contraseña"
                   value={formData.password}
                   onChange={handleChange}
                 />
                 {/* Botón para mostrar/ocultar contraseña - Dentro del input */}
                 <button
                   type="button"
                   onClick={() => setShowPassword(!showPassword)}
                   title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                   className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-blue-500 focus:outline-none"
                 >
                   {showPassword ? '🙈' : '👁️'}
                 </button>
               </div>
             </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Botón de inicio de sesión */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </div>

          {/* Enlace recuperación */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => setShowModal(true)}
              style={{ 
                background: '#EFF6FF',
                border: '2px solid #3B82F6',
                borderRadius: '8px',
                cursor: 'pointer',
                padding: '12px 24px',
                fontSize: '14px',
                color: '#1E40AF',
                fontWeight: '600',
                margin: '16px 0'
              }}
              onMouseOver={(e) => {
                e.target.style.background = '#DBEAFE';
                e.target.style.borderColor = '#1D4ED8';
              }}
              onMouseOut={(e) => {
                e.target.style.background = '#EFF6FF';
                e.target.style.borderColor = '#3B82F6';
              }}
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
        </form>

        {/* Modal de recuperación de contraseña */}
        {showModal && (
          <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative animate-fadeIn">
              {/* Botón de cerrar */}
              <button 
                onClick={() => {
                  setShowModal(false);
                  setRecoveryMessage('');
                  setRecoveryEmail('');
                }}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
              
              {/* Título y descripción */}
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Recuperar Contraseña</h3>
                <p className="text-sm text-gray-600 mt-2">
                  Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña.
                </p>
              </div>
              
              {/* Mensaje de respuesta */}
              {recoveryMessage && (
                <div className={`mb-6 p-4 rounded-lg ${
                  recoveryMessage.includes('enviado') 
                    ? 'bg-green-50 border border-green-200 text-green-600' 
                    : 'bg-red-50 border border-red-200 text-red-600'
                }`}>
                  {recoveryMessage}
                </div>
              )}

              {/* Formulario */}
              <form onSubmit={handleRecovery} className="space-y-6">
                <div>
                  <label htmlFor="recoveryEmail" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-blue-500" />
                    </div>
                    <input
                      id="recoveryEmail"
                      type="email"
                      value={recoveryEmail}
                      onChange={(e) => setRecoveryEmail(e.target.value)}
                      required
                      className="w-full px-3 py-3 pl-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors border-gray-300 bg-white shadow-sm"
                      placeholder="tu@email.com"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    type="submit"
                    disabled={recoveryLoading}
                    className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors shadow-md"
                  >
                    {recoveryLoading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mx-auto"></div>
                    ) : (
                      'Enviar Enlace'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setRecoveryMessage('');
                      setRecoveryEmail('');
                    }}
                    className="flex-1 bg-gray-200 text-gray-800 py-3 px-4 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Usuarios de prueba */}

          {/* <h3 className="text-sm font-medium text-blue-800 mb-3 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
            </svg>
            Usuarios de prueba
          </h3> */}
          <div className="space-y-3 text-sm text-gray-700">
            <div className="p-2 bg-white rounded border border-blue-100 flex items-center">
              <div className="bg-blue-100 p-2 rounded-full mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-700" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <span className="font-semibold text-blue-800">Admin:</span> admin@sistema.com / admin12
              </div>
            </div>
            {/* <div className="p-2 bg-white rounded border border-blue-100 flex items-center">
              <div className="bg-blue-100 p-2 rounded-full mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-700" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                </svg>
              </div>
              <div>
                <span className="font-semibold text-blue-800">Docente:</span> juan.docente@sistema.com / docente123
              </div>
            </div> */}
            {/* <div className="p-2 bg-white rounded border border-blue-100 flex items-center">
              <div className="bg-blue-100 p-2 rounded-full mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-700" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                </svg>
              </div>
              <div>
                <span className="font-semibold text-blue-800">Alumno:</span> carlos.alumno@sistema.com / alumno123
              </div>
            </div> */}
          </div>
        </div>
      </div>
    
  );
};

export default Login;
