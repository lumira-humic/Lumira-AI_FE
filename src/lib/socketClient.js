import { io } from "socket.io-client";

import { pinia } from "@/lib/pinia";
import { useAppStore } from "@/stores/appStore";


let socket;

export const getSocket = () => socket;

export const connectSocket = () => {
    if (socket?.connected) {
        return socket;
    }

    const appStore = useAppStore(pinia);

    socket = io(import.meta.env.VITE_WS_BASE_URL, {
        autoConnect: true,
        transports: ["websocket"],
        auth: {
            token: appStore.accessToken || undefined,
        },
    });

    return socket;
};

export const disconnectSocket = () => {
    if (!socket) return;

    socket.disconnect();
    socket = undefined;
};
