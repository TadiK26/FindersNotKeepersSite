import { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import logo from "/logo.svg";
import "./Profile.css";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [editable, setEditable] = useState({ email: false, password: false });
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploadErr, setUploadErr] = useState("");
  const fileRef = useRef(null);

  // useEffect(() => {
  //   const token = localStorage.getItem("access_token");
  //   console.log("Access token:", token);

  //   if (!token) return;

  //   fetch("http://127.0.0.1:5000/auth/profile", {
  //     headers: { Authorization: `Bearer ${token}` },
  //   })
  //     .then(res => {
  //       console.log("Profile fetch status:", res.status); 
  //       return res.json();
  //     })
  //     .then(data => {
  //       console.log("Profile data received:", data); // 🔹 Check email
  //       setProfile({ ...data, password: "********" });
  //     })
  //     .catch(err => console.error(err));
  // }, []);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    fetch("http://127.0.0.1:5000/auth/profile", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        // Backend now returns full avatar URL already
        setProfile({ ...data, password: "********" });
        setAvatarUrl(data.avatar || "");
      })
      .catch(err => console.error(err));
  }, []);



  const toggleEdit = (key) => setEditable(e => ({ ...e, [key]: !e[key] }));

const onAvatarPick = async (file) => {
  setUploadErr("");
  if (!file) return;

  const okType = /image\/(jpeg|png)/i.test(file.type);
  const okSize = file.size <= 2 * 1024 * 1024; 
  if (!okType) return setUploadErr("Please select a JPEG or PNG image.");
  if (!okSize) return setUploadErr("Max file size is 2MB.");

  const token = localStorage.getItem("access_token");
  const formData = new FormData();
  formData.append("avatar", file);

  try {
// Inside onAvatarPick
    const res = await fetch("http://127.0.0.1:5000/auth/upload-avatar", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });


    const data = await res.json();
    if (res.ok) {
      setAvatarUrl(data.avatar);
      setProfile(prev => ({ ...prev, avatar: data.avatar }));
    } else {
      setUploadErr(data.error || "Upload failed");
    }
  } catch (err) {
    setUploadErr("Upload failed");
    console.error(err);
  }
};




  if (!profile) return <p>Loading profile...</p>;

  return (
    <main className="profile-wrap">
      <header className="profile-top">
        <img src={logo} alt="FindersNotKeepers" className="profile-logo" />
        <h1 className="profile-title">Profile <span aria-hidden>👤</span></h1>
        <Link to="/listings" className="profile-home">HOME</Link>
      </header>

      <div className="profile-bar" />

      <section className="profile-grid">
        <form className="profile-form" onSubmit={(e) => e.preventDefault()}>
          <Field
            label="Email:"
            value={profile?.email || ""}
            onChange={(val) => setProfile({...profile, email: val})}
            editable={editable.email}
            onToggle={() => toggleEdit("email")}
            type="email"
          />

          {/* <Field
            label="Password:"
            value={profile?.password || ""}
            onChange={(val) => setProfile({...profile, password: val})}
            editable={editable.password}
            onToggle={() => toggleEdit("password")}
            type="password"
          /> */}
        </form>

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

      <Link to="/mylistings" className="my-listings">
        <h2>My Listings</h2>
        <p className="my-listings-text">Lost Items | Returned Items | Found Items</p>
      </Link>
    </main>
  );
}

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
