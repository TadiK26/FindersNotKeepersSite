import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "/logo.svg";
import "./Settings.css";

export default function Settings() {
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");
  const [passwordMsgType, setPasswordMsgType] = useState(""); // "success" or "error"
  const [logoutMsg, setLogoutMsg] = useState("");

  const token = localStorage.getItem("access_token");

  // ---------------- Change Password ----------------
  const handlePasswordSave = async () => {
    if (newPassword !== confirmPassword) {
      setPasswordMsg("New password and confirmation do not match.");
      setPasswordMsgType("error");
      return;
    }

    if (!currentPassword || !newPassword) {
      setPasswordMsg("Please fill in both current and new password.");
      setPasswordMsgType("error");
      return;
    }

    try {
      const res = await fetch("http://127.0.0.1:5000/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      const text = await res.text();
      let data = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { message: text || "Password change response received" };
      }

      setPasswordMsg(data.message || "Failed to change password.");
      setPasswordMsgType(res.ok ? "success" : "error");

      if (res.ok) {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }

    } catch (err) {
      setPasswordMsg("Error: " + err.message);
      setPasswordMsgType("error");
    }
  };

  // ---------------- Logout ----------------
// ---------------- Logout ----------------
const handleLogout = async () => {
  try {
    const res = await fetch("http://127.0.0.1:5000/auth/logout", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      localStorage.removeItem("access_token");
      setLogoutMsg("Logged out successfully. Redirecting...");
      setTimeout(() => navigate("/"), 1000); // Redirect to Landing page
    } else {
      const text = await res.text();
      setLogoutMsg(text || "Failed to logout.");
    }
  } catch (err) {
    setLogoutMsg("Error: " + err.message);
  }
};


  return (
    <main className="settings-wrap">
      <header className="settings-top">
        <img src={logo} alt="FindersNotKeepers" className="settings-logo" />
        <h1 className="settings-title">
          Settings <span className="gear">⚙️</span>
        </h1>
        <button className="settings-home" onClick={() => navigate("/listings")}>
          HOME
        </button>
      </header>

      <div className="settings-bar" />

      <section className="settings-list">

        {/* Change Password */}
        <details className="settings-item">
          <summary>Change Password</summary>
          <div className="settings-form">
            {passwordMsg && (
              <p
                className="settings-msg"
                style={{ color: passwordMsgType === "success" ? "#2ecc71" : "#e74c3c" }}
              >
                {passwordMsg}
              </p>
            )}
            <input
              type="password"
              placeholder="Current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
            <input
              type="password"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={6}
            />
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={6}
            />
            <button className="btn-save" onClick={handlePasswordSave}>
              Save password
            </button>
          </div>
        </details>

        {/* Logout */}
        <details className="settings-item">
          <summary>Logout</summary>
          <div className="settings-form">
            {logoutMsg && (
              <p className="settings-msg" style={{ color: "#e74c3c" }}>
                {logoutMsg}
              </p>
            )}
            <button className="btn-logout" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </details>

      </section>
    </main>
  );
}
