export const tokenService = {
    get() {
        if (!window.token) {
            window.token = localStorage.getItem("token");
        }
        return window.token;
    },
    set(token) {
        window.token = token;
        localStorage.setItem("token", token);
    },
    clear() {
        window.token = null;
        localStorage.removeItem("token");
    }
};