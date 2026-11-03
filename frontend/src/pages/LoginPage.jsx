import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../hooks/ThemeProvider.jsx";
import "./LoginPage.css";

/*
|--------------------------------------------------------------------------
| Demo Accounts
|--------------------------------------------------------------------------
|
| Temporary authentication data.
|
*/

const DEMO_PASSWORD = "capdev2026";

const demoAccounts = [
  {
    initials: "JM",
    name: "Juan Marcos Garcia",
    role: "Individual · L6 · Azure PaaS",
    color: "#9300ff",
    email: "juan.marcos@accenture.com",
    accountType: "individual",
    redirectTo: "/user/dashboard",
  },
  {
    initials: "KC",
    name: "Karoline S. Cayetano",
    role: "People Lead · L8 · Cloud Ops",
    color: "#149b78",
    email: "karoline.cayetano@accenture.com",
    accountType: "people-lead",
    redirectTo: "/user/dashboard",
  },
  {
    initials: "OP",
    name: "Oscar R. Punsalan",
    role: "Managing Director · L10 · IIS Philippines",
    color: "#6c6bd9",
    email: "oscar.punsalan@accenture.com",
    accountType: "managing-director",
    redirectTo: "/user/dashboard",
  },
  {
    initials: "AD",
    name: "Admin User",
    role: "Administrator · Demo Admin",
    color: "#62738c",
    email: "admin@accenture.com",
    accountType: "admin",
    redirectTo: "/admin/dashboard",
  },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [alert, setAlert] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const showAlert = (message) => {
    setAlert({ message, type: "error" });
  };

  const closeAlert = () => {
    setAlert(null);
  };

  useEffect(() => {
    if (!alert) return undefined;

    const timer = window.setTimeout(() => {
      setAlert(null);
    }, 4000);

    return () => window.clearTimeout(timer);
  }, [alert]);

  /*
  |--------------------------------------------------------------------------
  | Temporary Demo Authentication
  |--------------------------------------------------------------------------
  |
  | This function simulates what the backend will eventually do.
  |
  */

  const authenticateDemoUser = (emailAddress, enteredPassword) => {
    const normalizedEmail = emailAddress.trim().toLowerCase();

    const matchedAccount = demoAccounts.find(
      (account) => account.email.toLowerCase() === normalizedEmail
    );

    if (!matchedAccount) {
      return {
        success: false,
        message: "Account not found. Please check your email address.",
      };
    }

    if (enteredPassword !== DEMO_PASSWORD) {
      return {
        success: false,
        message: "Incorrect password. Please try again.",
      };
    }

    return {
      success: true,
      user: matchedAccount,
    };
  };

  /*
  |--------------------------------------------------------------------------
  | Store Temporary Login Session
  |--------------------------------------------------------------------------
  |
  | sessionStorage is being used only for the demo.
  |
  */

  const createDemoSession = (user) => {
    const sessionUser = {
      name: user.name,
      email: user.email,
      role: user.role,
      accountType: user.accountType,
      isDemo: true,
    };

    sessionStorage.setItem(
      "benchflow_user",
      JSON.stringify(sessionUser)
    );

    /*
    --------------------------------------------------------------------------
    FUTURE BACKEND VERSION
    --------------------------------------------------------------------------

    When your backend is ready, you could store/authenticate using whatever
    mechanism your backend requires.

    Prefer secure HttpOnly cookies for real authentication instead of
    storing sensitive tokens directly in browser storage.

    Example:

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Unable to sign in.");
    }

    --------------------------------------------------------------------------
    */
  };

  /*
  |--------------------------------------------------------------------------
  | Normal Email + Password Login
  |--------------------------------------------------------------------------
  */

  const handleSubmit = async (event) => {
    event.preventDefault();

    closeAlert();

    const trimmedEmail = email.trim();

    if (!trimmedEmail && !password) {
      showAlert("Please enter your email and password.");
      return;
    }

    if (!trimmedEmail) {
      showAlert("Please enter your email address.");
      return;
    }

    if (!password) {
      showAlert("Please enter your password.");
      return;
    }

    setIsLoading(true);

    try {
      /*
      ------------------------------------------------------------------------
      FUTURE BACKEND AUTHENTICATION
      ------------------------------------------------------------------------

      Uncomment/replace this section when the backend exists.

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Invalid email or password.");
      }

      navigate("/dashboard");

      return;

      ------------------------------------------------------------------------
      */

      /*
      |--------------------------------------------------------------------------
      | TEMPORARY DEMO LOGIN
      |--------------------------------------------------------------------------
      */

      const result = authenticateDemoUser(trimmedEmail, password);

      if (!result.success) {
        showAlert(result.message);
        return;
      }

      createDemoSession(result.user);

      navigate(result.user.redirectTo);
    } catch (err) {
      console.error("Login failed:", err);

      showAlert(err.message || "Something went wrong while signing in.");
    } finally {
      setIsLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Demo Account Quick Login
  |--------------------------------------------------------------------------
  */

  const handleDemoLogin = (account) => {
    closeAlert();

    /*
     * Populate the form so the login visually behaves like
     * a real account selection.
     */

    setEmail(account.email);
    setPassword(DEMO_PASSWORD);

    /*
     * Create our temporary authenticated session.
     */

    createDemoSession(account);

    /*
     * Redirect based on account type.
     */

    navigate(account.redirectTo);
  };

  return (
    <main className={`login-page ${theme === "dark" ? "dark" : ""}`}>
      {alert && (
        <div
          className={`login-toast login-toast--${alert.type}`}
          role="alert"
          aria-live="assertive"
        >
          <div className="login-toast__icon" aria-hidden="true">
            !
          </div>

          <div className="login-toast__content">
            <strong>Sign in failed</strong>
            <span>{alert.message}</span>
          </div>

          <button
            type="button"
            className="login-toast__close"
            onClick={closeAlert}
            aria-label="Close alert"
          >
            ×
          </button>
        </div>
      )}
      <div className="login-container">

        {/* ================= BRAND HEADER ================= */}

        <header className="brand-card">
          <div className="brand">
            <div className="brand-logo">
              <span className="logo-top" />
              <span className="logo-bottom" />
            </div>

            <div className="brand-copy">
              <h1>BenchFlow</h1>
              <p>BENCH MANAGEMENT SYSTEM</p>
            </div>
          </div>

          <button
            className="theme-toggle"
            type="button"
            aria-pressed={theme === "dark"}
            onClick={toggleTheme}
          >
            <span className="theme-icon">
              {theme === "dark" ? (
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M20.2 15.3A8.5 8.5 0 0 1 8.7 3.8 8.5 8.5 0 1 0 20.2 15.3Z" />
                </svg>
              )}
            </span>

            {theme === "dark" ? "Light" : "Dark"}
          </button>
        </header>

        {/* ================= LOGIN CARD ================= */}

        <section className="login-card">
          <div className="login-header">
            <h2>Sign in to your account</h2>

            <p>
              Use your Accenture email and demo password.
            </p>
          </div>

          <div className="divider" />

          {/* ================= LOGIN FORM ================= */}

          <form
            className="login-form"
            onSubmit={handleSubmit}
          >
            <div className="field">
              <label htmlFor="email">
                EMAIL ADDRESS
              </label>

              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  closeAlert();
                }}
                placeholder="you@accenture.com"
                autoComplete="email"
                disabled={isLoading}
              />
            </div>

            <div className="field">
              <label htmlFor="password">
                PASSWORD
              </label>

              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  closeAlert();
                }}
                placeholder="••••••••"
                autoComplete="current-password"
                disabled={isLoading}
              />
            </div>

            <button
              className="sign-in-button"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          {/* ================= DIVIDER ================= */}

          <div className="demo-separator">
            <span />

            <p>OR JUMP IN AS A DEMO USER</p>

            <span />
          </div>

          {/* ================= DEMO ACCOUNTS ================= */}

          <div className="demo-section">
            <h3>DEMO ACCOUNTS</h3>

            <div className="demo-list">
              {demoAccounts.map((account) => (
                <button
                  type="button"
                  className="demo-account"
                  key={account.email}
                  onClick={() =>
                    handleDemoLogin(account)
                  }
                  disabled={isLoading}
                >
                  <div
                    className="avatar"
                    style={{
                      backgroundColor: account.color,
                    }}
                  >
                    {account.initials}
                  </div>

                  <div className="account-info">
                    <strong>
                      {account.name}
                    </strong>

                    <span>
                      {account.role}
                    </span>
                  </div>

                  <span className="arrow">
                    →
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* ================= FOOTER ================= */}

          <footer className="login-footer">
            <span className="sso-badge">
              SSO COMING SOON
            </span>

            <p>
              Demo password for all accounts:{" "}
              <strong>capdev2026</strong>
            </p>
          </footer>
        </section>
      </div>
    </main>
  );
}