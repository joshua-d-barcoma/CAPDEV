import { useState } from "react";
import {
  getSessionUser,
  getUserRole,
} from "../utils/auth.js";

export function getRoleFromSession(user) {
  return getUserRole(user);
}

export function useRole() {
  const [user] = useState(() => {
    return getSessionUser();
  });

  const role = getRoleFromSession(user);

  return {
    user,
    role,
    isAuthenticated: Boolean(user),
  };
}