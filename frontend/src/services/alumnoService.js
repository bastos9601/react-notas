import api from './api';

export const alumnoService = {
  // Asignaturas del alumno
  async getMisAsignaturas(soloCicloActual = true) {
    const response = await api.get(`/alumno/mis-asignaturas?solo_ciclo_actual=${soloCicloActual}`);
    return response.data;
  },

  // Notas del alumno
  async getMisNotas(soloCicloActual = true) {
    const response = await api.get(`/alumno/mis-notas?solo_ciclo_actual=${soloCicloActual}`);
    return response.data;
  },

  async getNotasPorAsignatura(asignaturaId) {
    const response = await api.get(`/alumno/asignaturas/${asignaturaId}/notas`);
    return response.data;
  },

  // Promedios
  async getMiPromedio() {
    const response = await api.get('/alumno/promedio');
    return response.data;
  },

  async getPromedioPorAsignatura(soloCicloActual = true) {
    const response = await api.get(`/alumno/promedio-por-asignatura?solo_ciclo_actual=${soloCicloActual}`);
    return response.data;
  },

  // Perfil
  async getMiPerfil() {
    const response = await api.get('/alumno/perfil');
    return response.data;
  },

  async cambiarContrasena(contrasenaData) {
    const response = await api.put('/alumno/cambiar-contrasena', contrasenaData);
    return response.data;
  },

  // Historial académico
  async getHistorialAcademico() {
    const response = await api.get('/historial/alumnos/me/historial');
    return response.data;
  }
};
