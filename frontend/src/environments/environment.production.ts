// ⚠️ Este archivo usa la variable de entorno inyectada en build time por Render.
// En angular.json se configura fileReplacements para que en --configuration=production
// se use ESTE archivo en lugar de environment.ts

export const environment = {
  production: true,
  // Render inyecta BACKEND_URL como variable de entorno en el build del Static Site
  apiUrl: 'https://netwatch-pro-api.onrender.com/api',
  wsUrl: 'https://netwatch-pro-api.onrender.com'
};
