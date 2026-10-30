const SESSION_KEY = "benchflow_user";

export function getSessionUser() {
  const serializedUser = sessionStorage.getItem(SESSION_KEY);

  if (!serializedUser) {
    return null;
  }

  try {
    const user = JSON.parse(serializedUser);

    if (
      !user ||
      typeof user !== "object" ||
      !user.email ||
      !user.accountType
    ) {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }

    return user;
  } catch (error) {
    console.error("Unable to read BenchFlow session:", error);

    sessionStorage.removeItem(SESSION_KEY);

    return null;
  }
}

export function setSessionUser(user) {
  sessionStorage.setItem(
    SESSION_KEY,
    JSON.stringify(user)
  );
}

export function clearSessionUser() {
  sessionStorage.removeItem(SESSION_KEY);
}

export function getUserRole(user) {
  return user?.accountType === "admin"
    ? "admin"
    : "user";
}

export function isAuthenticated() {
  return Boolean(getSessionUser());
}