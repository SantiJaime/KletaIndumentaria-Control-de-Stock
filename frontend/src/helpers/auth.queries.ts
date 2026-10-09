import { api } from "../lib/api";
import type { User } from "../types";

/** Inicia sesión: el backend responde con el usuario y deja las cookies (access y refresh token). */
export const login = async (credentials: {
  username: string;
  password: string;
}) => {
  const { data } = await api.post<User>("/auth/login", credentials);
  return data;
};

/** Usuario de la sesión actual. Se usa al abrir o recargar la página para recuperar la sesión desde las cookies. */
export const getMe = async () => {
  const { data } = await api.get<User>("/auth/me");
  return data;
};

/** Cierra la sesión en el backend y borra las cookies. */
export const logout = async () => {
  await api.post("/auth/logout");
};
