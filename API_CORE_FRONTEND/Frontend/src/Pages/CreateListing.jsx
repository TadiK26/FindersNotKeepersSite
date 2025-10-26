import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "/logo.svg";
import "./CreateListing.css";

/* =========================
   NEW: Category options
   ========================= */
const CATEGORIES = [
  { id: 1, label: "Student Card" },
  { id: 2, label: "Electronic Device" },
  { id: 3, label: "Clothing" },
  { id: 4, label: "Identification Document" },
  { id: 5, label: "Car Keys" },
  { id: 6, label: "Bag" },
  { id: 7, label: "Schooling Equipment" },
  { id: 8, label: "Other" },
];

export default function CreateListing() {
  const navigate = useNavigate();

  // Form state
  const [form, setForm] = useState({
    title: "",
    status: "LOST",      // LOST | FOUND | RETURNED
    where: "",
    when: "",            // yyyy-mm-dd
    /* CHANGED: category -> categoryId (numeric) */
    categoryId: "0",      // will hold the numeric id (1..8)
    description: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
  });

  // Photo upload
  const [photoDataUrl, setPhotoDataUrl] = useState("");
  const [uploadErr, setUploadErr] = useState("");
  const fileRef = useRef(null);

  //const setField = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  const setField = (k, v) =>
  setForm(prev => ({ ...prev, [k]: v ?? "" })); // ensure not undefined/null


  const onPickPhoto = (file) => {
    setUploadErr("");
    if (!file) return;
    const okType = /image\/(jpeg|png)/i.test(file.type);
    const okSize = file.size <= 3 * 1024 * 1024; // 3MB
    if (!okType) return setUploadErr("Please select a JPEG or PNG image.");
    if (!okSize) return setUploadErr("Max file size is 3MB.");

    const reader = new FileReader();
    reader.onload = (e) => setPhotoDataUrl(e.target.result);
    reader.readAsDataURL(file);
  };

  // Very light validation
  const [errors, setErrors] = useState({});
  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = "Title is required.";
    if (!form.status) e.status = "Status is required.";
    if (!form.where.trim()) e.where = "Location is required.";
    if (!form.when) e.when = "Date is required.";
    /* NEW: require category selection */
    if (!form.categoryId) e.categoryId = "Category is required.";
    if (!form.contactName.trim()) e.contactName = "Contact name is required.";
    if (!form.contactEmail.trim()) {
      e.contactEmail = "Contact email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail)) {
      e.contactEmail = "Enter a valid email.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const token = localStorage.getItem("access_token");
    const formData = new FormData();
    Object.keys(form).forEach(key => formData.append(key, form[key]));
    if (photoDataUrl) {
      // convert data URL to Blob
      const res = await fetch(photoDataUrl);
      const blob = await res.blob();
      formData.append("photo", blob, "listing.png");
    }

    try {
      const res = await fetch("http://127.0.0.1:5000/auth/listings", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      const data = await res.json();
      if (res.ok) {
        alert("Listing created!");
        navigate("/listings");
      } else {
        alert(data.error || "Failed to create listing");
      }
    } catch (err) {
      console.error(err);
      alert("Server error. Try again later.");
    }
  };


  return (
    <main className="create-wrap">
      {/* Header */}
      <header className="create-top">
        <img src={logo} alt="FindersNotKeepers" className="create-logo" />
        <h1 className="create-title">Create Listing</h1>
        <Link to="/listings" className="create-home">HOME</Link>
      </header>

      <div className="create-bar" />

      {/* Form grid */}
      <form className="create-grid" onSubmit={onSubmit} noValidate>
        {/* Left column */}
        <section className="create-col">
          <label className="cr-row">
            <span className="cr-label">Title *</span>
            <input
              className={`cr-input ${errors.title ? "cr-invalid" : ""}`}
              type="text"
              placeholder="e.g., Black Laptop Bag"
              value={form.title}
              onChange={(e)=>setField("title", e.target.value)}
            />
            {errors.title && <em className="cr-err">{errors.title}</em>}
          </label>

          <div className="cr-row-2">
            <label className="cr-mini">
              <span className="cr-label">Status *</span>
              <select
                className={`cr-input ${errors.status ? "cr-invalid" : ""}`}
                value={form.status}
                onChange={(e)=>setField("status", e.target.value)}
              >
                <option value="LOST">LOST</option>
                <option value="FOUND">FOUND</option>
                <option value="RETURNED">RETURNED</option>
              </select>
              {errors.status && <em className="cr-err">{errors.status}</em>}
            </label>

            <label className="cr-mini">
              <span className="cr-label">Date *</span>
              <input
                className={`cr-input ${errors.when ? "cr-invalid" : ""}`}
                type="date"
                value={form.when}
                onChange={(e)=>setField("when", e.target.value)}
              />
              {errors.when && <em className="cr-err">{errors.when}</em>}
            </label>
          </div>

          <label className="cr-row">
            <span className="cr-label">Where *</span>
            <input
              className={`cr-input ${errors.where ? "cr-invalid" : ""}`}
              type="text"
              placeholder="e.g., UP, Hatfield Campus"
              value={form.where}
              onChange={(e)=>setField("where", e.target.value)}
            />
            {errors.where && <em className="cr-err">{errors.where}</em>}
          </label>

          {/* =========================
              CHANGED: Category text input -> dropdown
              Stores numeric categoryId
              ========================= */}
          <label className="cr-row">
            <span className="cr-label">Category *</span>
            <select
              className={`cr-input ${errors.categoryId ? "cr-invalid" : ""}`}
              value={form.categoryId}
              onChange={(e) => setField("categoryId", e.target.value)}

            >
              <option value="">Select a category...</option>
              {CATEGORIES.map(c => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
            {errors.categoryId && <em className="cr-err">{errors.categoryId}</em>}
          </label>

          <label className="cr-row">
            <span className="cr-label">Description</span>
            <textarea
              className="cr-input"
              rows={5}
              placeholder="Add helpful detail (brand, color, identifiers, etc.)"
              value={form.description}
              onChange={(e)=>setField("description", e.target.value)}
              minLength={30}
              maxLength={300}
            />
            <small>{form.description.length}/300 characters</small>
          </label>
        </section>

        {/* Right column */}
        <aside className="create-col">
          <div className="cr-photo">
            <div
              className={`cr-photo-box ${photoDataUrl ? "has-img" : ""}`}
              onClick={() => fileRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e)=> (e.key === "Enter" || e.key === " ") && fileRef.current?.click()}
              aria-label="Upload listing image"
            >
              {photoDataUrl ? (
                <img src={photoDataUrl} alt="Listing preview" />
              ) : (
                <div className="cr-photo-hint">
                  <strong>Upload Photo</strong>
                  <span>JPEG or PNG</span>
                  <span>&lt; 3MB</span>
                </div>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/png, image/jpeg"
              hidden
              onChange={(e)=>onPickPhoto(e.target.files?.[0])}
            />
            {uploadErr && <p className="cr-err">{uploadErr}</p>}
          </div>

          <div className="cr-contact">
            <h3 className="cr-subtitle">Contact</h3>

            <label className="cr-row">
              <span className="cr-label">Name *</span>
              <input
                className={`cr-input ${errors.contactName ? "cr-invalid" : ""}`}
                type="text"
                placeholder="Your full name"
                value={form.contactName}
                onChange={(e)=>setField("contactName", e.target.value)}
              />
              {errors.contactName && <em className="cr-err">{errors.contactName}</em>}
            </label>

            <label className="cr-row">
              <span className="cr-label">Email *</span>
              <input
                className={`cr-input ${errors.contactEmail ? "cr-invalid" : ""}`}
                type="email"
                placeholder="name@example.com"
                value={form.contactEmail}
                onChange={(e)=>setField("contactEmail", e.target.value)}
              />
              {errors.contactEmail && <em className="cr-err">{errors.contactEmail}</em>}
            </label>

          </div>

          <div className="cr-actions">
            <button type="submit" className="primary-btn">Create Listing</button>
            <Link to="/listings" className="ghost-btn">Cancel</Link>
          </div>
        </aside>
      </form>
    </main>
  );
}
