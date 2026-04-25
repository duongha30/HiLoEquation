import app from './src/app';
import initialSocket from './src/socket/socket';

const PORT = process.env.PORT || 4056;

const server = app.listen(PORT, () => {
    console.log(`WSV hiloequation starts with ${PORT}`);
});

initialSocket(server);

process.on('SIGINT', () => {
    server.close(() => console.log('...Exit Server Express'));
});
