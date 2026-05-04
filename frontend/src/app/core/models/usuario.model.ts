export interface Usuario {
  id: string;
  nombre: string;
  correo: string;
  rol: 'admin' | 'tecnico' | 'observador';
}

export interface LoginRequest {
  correo: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  usuario: Usuario;
}
