import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import logo from "/logo.svg";
import "./Profile.css";

export default function Profile() {
  // demo user state (replace with real data later)
  const [name, setName] = useState("Ann Willows");
  const [email, setEmail] = useState("annwillows@gmail.com");
  const [password, setPassword] = useState("**********");

  // which fields are editable
  const [editable, setEditable] = useState({
    name: false,
    email: false,
    password: false,
  });

  // avatar upload
  const [avatarUrl, setAvatarUrl] = useState(""); // preview data URL
  const [uploadErr, setUploadErr] = useState("");
  const fileRef = useRef(null);

  const toggleEdit = (key) =>
    setEditable((e) => ({ ...e, [key]: !e[key] }));

  const onAvatarPick = (file) => {
    setUploadErr("");
    if (!file) return;
    const okType = /image\/(jpeg|png)/i.test(file.type);
    const okSize = file.size <= 2 * 1024 * 1024; // 2MB
    if (!okType) return setUploadErr("Please select a JPEG or PNG image.");
    if (!okSize) return setUploadErr("Max file size is 2MB.");

    const reader = new FileReader();
    reader.onload = (e) => setAvatarUrl(e.target.result);
    reader.readAsDataURL(file);
  };

  return (
    <main className="profile-wrap">
      {/* Header row */}
      <header className="profile-top">
        <img src={logo} alt="FindersNotKeepers" className="profile-logo" />
        <h1 className="profile-title">
          Profile <span className="profile-icon" aria-hidden>👤</span>
        </h1>
        <Link to="/listings" className="profile-home">HOME</Link>
      </header>

      <div className="profile-bar" />

      {/* Content: 2 columns */}
      <section className="profile-grid">
        {/* Left column: form */}
        <form className="profile-form" onSubmit={(e)=>e.preventDefault()}>
          <Field
            label="Name:"
            value={name}
            onChange={setName}
            editable={editable.name}
            onToggle={() => toggleEdit("name")}
          />
          <Field
            label="Email:"
            value={email}
            onChange={setEmail}
            editable={editable.email}
            onToggle={() => toggleEdit("email")}
            type="email"
          />
          <Field
            label="Password:"
            value={password}
            onChange={setPassword}
            editable={editable.password}
            onToggle={() => toggleEdit("password")}
            type="password"
          />
        </form>

        {/* Right column: avatar */}
        <aside className="profile-avatar">
          <div
            className={`avatar-circle ${avatarUrl ? "has-img" : ""}`}
            onClick={() => fileRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e)=> (e.key === "Enter" || e.key === " ") && fileRef.current?.click()}
            aria-label="Upload profile image"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="Profile" />
            ) : (
              <div className="avatar-hint">
                <strong>Insert Image</strong>
                <span>&lt;2MB</span>
                <span>JPEG or PNG</span>
              </div>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/png, image/jpeg"
            hidden
            onChange={(e) => onAvatarPick(e.target.files?.[0])}
          />
          {uploadErr && <p className="upload-err">{uploadErr}</p>}
        </aside>
      </section>

      {/* My Listings box */}
      <section className="my-listings">
        <h2>My Listings</h2>
        <div className="my-links">
          <Link to="/listings?filter=lost">Lost Items</Link>
          <span className="sep">|</span>
          <Link to="/listings?filter=returned">Returned Items</Link>
          <span className="sep">|</span>
          <Link to="/listings?filter=found">Found Items</Link>
        </div>
      </section>
    </main>
  );
}

/* ---------- small presentational component ---------- */
function Field({ label, value, onChange, editable, onToggle, type="text" }) {
  return (
    <label className="pf-row">
      <span className="pf-label">{label}</span>
      <div className="pf-input-wrap">
        <input
          className="pf-input"
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={!editable}
        />
        <button
          type="button"
          className="pf-edit"
          onClick={onToggle}
          aria-label={editable ? "Lock field" : "Edit field"}
          title={editable ? "Lock" : "Edit"}
        >
          ✎
        </button>
      </div>
    </label>
  );
}
