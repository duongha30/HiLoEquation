import app from './src/app.js';

const PORT = process.env.PORT || 4056;

const server = app.listen(PORT, () => {
  console.log(`WSV hiloequation starts with ${PORT}`);
});

process.on('SIGINT', () => {
  server.close(() => console.log('...Exit Server Express'));
});