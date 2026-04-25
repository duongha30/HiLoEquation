import localforage from 'localforage';
import { io, Socket } from 'socket.io-client';
import config from '../../config/config.json'

let socket: Socket | null = null;
const socketURL = config.SOCKET_URL;

export const connectSocket = async (): Promise<Socket> => {
    if (!socket) {
        socket = io(socketURL, {
            withCredentials: true, // Enable cookies to be sent with socket requests
        });

        await new Promise((resolve, reject) => {
            socket?.on('connect', () => {
                console.log('Socket connected:', socket?.id);
                resolve(true);
            });
            socket?.on('connect_error', (err) => {
                console.error('Socket connection error:', err);
                reject(err);
            });
        });

        socket.on('disconnect', (reason) => {
            console.log('Socket disconnected:', reason);
            socket = null; // reset socket on disconnect
        });
    }

    return socket;
}

export const getSocket = (): Socket => {    // get actual socket instance, throw if not connected
    if (!socket) {
        throw new Error('Socket not connected');
    }
    return socket;
}

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
}