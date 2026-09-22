import { apiFetch } from "./apiFetch.js"

export async function loginWithGoogle(googleToken) {
    return apiFetch("/api/auth/google", "POST", { token: googleToken })
}

