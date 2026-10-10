"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Invalid password");
        setIsLoading(false);
        return;
      }

      // Store admin token in localStorage
      localStorage.setItem("adminToken", data.token);
      
      // Redirect to admin dashboard
      router.push("/admin/dashboard");
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-login-container">
      <div className="admin-login-box">
        <h1>Admin Portal</h1>
        <p>Enter your admin password to access the dashboard</p>

        <form onSubmit={handleLogin}>
          <input
            type="password"
            placeholder="Admin Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            autoFocus
          />
          
          {error && <div className="error-message">{error}</div>}
          
          <button type="submit" disabled={isLoading}>
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="login-help">
          Need help? Contact the site administrator.
        </p>
      </div>

      <style jsx>{`
        .admin-login-container {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }

        .admin-login-box {
          background: white;
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
          padding: 40px;
          width: 100%;
          max-width: 400px;
        }

        h1 {
          margin: 0 0 8px 0;
          font-size: 28px;
          font-weight: 700;
          color: #1a1a1a;
        }

        > p {
          color: #666;
          margin: 0 0 30px 0;
          font-size: 14px;
        }

        form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        input[type="password"] {
          padding: 12px 14px;
          border: 1px solid #e0e0e0;
          border-radius: 6px;
          font-size: 14px;
          transition: border-color 0.2s;
        }

        input[type="password"]:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        input[type="password"]:disabled {
          background: #f5f5f5;
          cursor: not-allowed;
        }

        button {
          padding: 12px;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }

        button:hover:not(:disabled) {
          background: #5568d3;
        }

        button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .error-message {
          color: #e74c3c;
          font-size: 13px;
          background: #fadbd8;
          padding: 10px 12px;
          border-radius: 4px;
          text-align: center;
        }

        .login-help {
          font-size: 12px;
          color: #999;
          margin: 20px 0 0 0;
          text-align: center;
        }
      `}</style>
    </div>
  );
}
