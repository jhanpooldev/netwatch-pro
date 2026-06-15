// ⚠️ Este archivo usa la variable de entorno inyectada en build time por Render.
// En angular.json se configura fileReplacements para que en --configuration=production
// se use ESTE archivo en lugar de environment.ts

export const environment = {
  production: true,
  apiUrl: 'https://netwatch-pro-4ujj.onrender.com/api',
  wsUrl: 'https://netwatch-pro-4ujj.onrender.com'
};
