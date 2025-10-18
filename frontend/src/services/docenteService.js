import api from './api';

export const docenteService = {
  // Asignaturas del docente
  async getMisAsignaturas() {
    const response = await api.get('/docente/mis-asignaturas');
    return response.data;
  },

  async getAlumnosPorAsignatura(asignaturaId) {
    const response = await api.get(`/docente/asignatura/${asignaturaId}/alumnos`);
    return response.data;
  },

  // Gestión de Notas
  async registrarNota(notaData) {
    const response = await api.post('/docente/notas', notaData);
    return response.data;
  },

  async actualizarNota(notaId, notaData) {
    const response = await api.put(`/docente/notas/${notaId}`, notaData);
    return response.data;
  },

  async eliminarNota(notaId) {
    const response = await api.delete(`/docente/notas/${notaId}`);
    return response.data;
  },

  async getNotasPorAsignatura(asignaturaId) {
    const response = await api.get(`/docente/asignaturas/${asignaturaId}/notas`);
    return response.data;
  },

  // Gestión de Alumnos por Ciclo
  async getAlumnosPorCiclo() {
    const response = await api.get('/docente/alumnos-por-ciclo');
    return response.data;
  },

  // Publicar Notas
  async publicarNota(notaId) {
    const response = await api.put(`/docente/notas/${notaId}/publicar`);
    return response.data;
  },

  async publicarTodasNotas(asignaturaId) {
    const response = await api.put(`/docente/asignaturas/${asignaturaId}/publicar-todas-notas`);
    return response.data;
  },
  
  // Guardar promedios
  async guardarPromedios(promediosData) {
    const response = await api.post('/docente/guardar-promedios', promediosData);
    return response.data;
  },
  
  // Eliminar promedios cuando no hay notas
  async eliminarPromedios(alumnoId, asignaturaId) {
    const response = await api.delete(`/docente/eliminar-promedios/${alumnoId}/${asignaturaId}`);
    return response.data;
  },

  async despublicarNota(notaId) {
    const response = await api.put(`/docente/notas/${notaId}/despublicar`);
    return response.data;
  },

  // Enviar todas las notas de un alumno
  async enviarTodasLasNotas(asignaturaId, alumnoId) {
    const response = await api.post(`/docente/asignaturas/${asignaturaId}/alumnos/${alumnoId}/enviar-notas`);
    return response.data;
  },

  // Mi Perfil
  async actualizarMiPerfil(perfilData) {
    const response = await api.put('/docente/mi-perfil', perfilData);
    return response.data;
  }
};
