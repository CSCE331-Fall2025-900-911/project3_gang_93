import { useState, useEffect } from "react";
import { API_BASE_URL } from "../config/api";
import "./KioskLoginPage.css";

function KioskLoginPage({ onLoginSuccess, onCancel }) {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Check if user is already authenticated or handling OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const email = urlParams.get("email");
    const name = urlParams.get("name");
    const sub = urlParams.get("sub");
    const error = urlParams.get("error");

    // Debug logging
    console.log("[KioskLoginPage] OAuth callback params:", { email, name, sub, error });
    console.log("[KioskLoginPage] Full URL params:", window.location.search);

    if (error) {
      setError("Authentication failed. Please try again.");
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (email) {
      // User successfully authenticated via OAuth callback
      const userInfo = {
        email: decodeURIComponent(email),
        name: decodeURIComponent(name || ""),
        picture: urlParams.get("picture") ? decodeURIComponent(urlParams.get("picture")) : "",
        sub: sub ? decodeURIComponent(sub) : email, // Use email as fallback for sub
        firstName: decodeURIComponent(name || "").split(" ")[0] || null,
        lastName: decodeURIComponent(name || "").split(" ").slice(1).join(" ") || null,
      };
      
      console.log("[KioskLoginPage] User info extracted:", userInfo);
      
      // Store in localStorage for session persistence
      localStorage.setItem("kiosk_user", JSON.stringify(userInfo));
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Notify parent component
      console.log("[KioskLoginPage] Calling onLoginSuccess");
      onLoginSuccess(userInfo);
    } else {
      // Check if user is already logged in from previous session
      const storedUser = localStorage.getItem("kiosk_user");
      if (storedUser) {
        try {
          const userInfo = JSON.parse(storedUser);
          onLoginSuccess(userInfo);
        } catch (e) {
          localStorage.removeItem("kiosk_user");
        }
      }
    }
  }, [onLoginSuccess]);

  const handleGoogleLogin = () => {
    setLoading(true);
    setError(null);

    // Redirect to backend OAuth endpoint
    window.location.href = `${API_BASE_URL}/api/auth/google/login`;
  };

  return (
    <div className="kiosk-login-page">
      <div className="kiosk-login-container">
        <div className="kiosk-login-header">
          <h1 className="kiosk-login-title">Welcome to Self-Service Kiosk</h1>
          <p className="kiosk-login-subtitle">Please sign in with your Google account to continue</p>
        </div>

        <div className="kiosk-login-content">
          {error && (
            <div className="kiosk-login-error">
              <span className="error-icon">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <button
            className="google-login-button"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <svg
                  className="google-icon"
                  viewBox="0 0 24 24"
                  width="24"
                  height="24"
                >
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Sign in with Google</span>
              </>
            )}
          </button>

          <div className="kiosk-login-footer">
            <p className="kiosk-login-info">
              By signing in, you agree to use this self-service kiosk system.
            </p>
            {onCancel && (
              <button
                className="kiosk-login-cancel"
                onClick={onCancel}
              >
                Continue without signing in
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default KioskLoginPage;

