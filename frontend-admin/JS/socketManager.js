export const socket = new WebSocket("ws://192.168.91.68:3000");

const listeners = new Set();

socket.addEventListener("message", (event) => {
  listeners.forEach(listener => listener(event));
});

export function addSocketListener(handler) {
  listeners.add(handler);
}

export function removeSocketListener(handler) {
  listeners.delete(handler);
}