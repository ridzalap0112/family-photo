// ==================================
// PREMIUM UI UPGRADE VERSION
// ==================================

import { useEffect, useState } from "react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import logoWeb from "./assets/logo-web.png";
import logoLogin from "./assets/logo.png";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  orderBy,
  where,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCJhVIkSeE4MZFD-u10-7rBdGeRs7qv24M",
  authDomain: "family-photo-dfb24.firebaseapp.com",
  projectId: "family-photo-dfb24",
  storageBucket: "family-photo-dfb24.firebasestorage.app",
  messagingSenderId: "48478776888",
  appId: "1:48478776888:web:3e5446adac1914d54a80cd",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const CLOUD_NAME = "dswnss8op";
const UPLOAD_PRESET = "family-photo";

const STUDENT_PASSWORDS = ["6A", "6B"];
const ADMIN_PASSWORD = "admin1290";

function getDeviceId() {
  let id = localStorage.getItem("deviceId");
  if (!id) {
    id = "dev-" + Math.random().toString(36).substr(2, 9);
    localStorage.setItem("deviceId", id);
  }
  return id;
}

export default function App() {
  const [photos, setPhotos] = useState([]);
  const [myPhotos, setMyPhotos] = useState([]);
  const [preview, setPreview] = useState([]);
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(null);
  const [kelas, setKelas] = useState(null);
  const deviceId = getDeviceId();

  function login() {
    const pass = password.toUpperCase();

    if (STUDENT_PASSWORDS.includes(pass)) {
      setRole("siswa");
      setKelas(pass);
      localStorage.setItem("role", "siswa");
      localStorage.setItem("kelas", pass);
    } else if (password === ADMIN_PASSWORD) {
      setRole("admin");
      localStorage.setItem("role", "admin");
    } else {
      alert("Wrong password");
    }
  }

  function logout() {
    setRole(null);
    setPassword("");
    setKelas(null);
    localStorage.removeItem("role");
    localStorage.removeItem("kelas");
  }

  async function fetchPhotos() {
    if (role === "admin") {
      const q = query(collection(db, "photos"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      setPhotos(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    }

    if (role === "siswa" && kelas) {
      const q = query(
        collection(db, "photos"),
        where("kelas", "==", kelas),
        where("ownerId", "==", deviceId),
        orderBy("createdAt", "desc"),
      );
      const snapshot = await getDocs(q);
      setMyPhotos(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    }
  }

  useEffect(() => {
    const savedRole = localStorage.getItem("role");
    const savedKelas = localStorage.getItem("kelas");

    if (savedRole) {
      setRole(savedRole);
      if (savedRole === "siswa") setKelas(savedKelas);
    }
  }, []);

  useEffect(() => {
    if (role) fetchPhotos();
  }, [role]);

  function handlePreview(files) {
    const previews = Array.from(files).map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));
    setPreview(previews);
  }

  async function uploadFiles() {
    if (!kelas) return;
    if (myPhotos.length + preview.length > 3) return alert("Max 3 photos");

    for (const item of preview) {
      const formData = new FormData();
      formData.append("file", item.file);
      formData.append("upload_preset", UPLOAD_PRESET);

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        { method: "POST", body: formData },
      );

      const data = await res.json();

      await addDoc(collection(db, "photos"), {
        name: item.file.name,
        url: data.secure_url,
        kelas,
        ownerId: deviceId,
        createdAt: Date.now(),
      });
    }

    setPreview([]);
    fetchPhotos();
  }

  async function deletePhoto(p) {
    await deleteDoc(doc(db, "photos", p.id));
    fetchPhotos();
  }

  async function downloadAllByClass(cls) {
    const zip = new JSZip();
    const classPhotos = photos.filter((p) => p.kelas === cls);

    for (const p of classPhotos) {
      const res = await fetch(p.url);
      const blob = await res.blob();
      zip.file(p.name || `photo-${p.id}.jpg`, blob);
    }

    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, `Class-${cls}-Photos.zip`);
  }

  // ================= LOGIN =================
  if (!role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-200 via-blue-100 to-white">
        <div className="backdrop-blur-xl bg-white/80 border border-white/40 shadow-2xl rounded-3xl p-10 w-[380px] text-center transition-all duration-500">
          {/* LOGIN LOGO (place file in /public/logo-login.png) */}
          <img
            src={logoLogin}
            alt="School Logo"
            className="w-24 mx-auto mb-4 drop-shadow-md hover:scale-105 transition duration-300"
          />

          <h2 className="text-2xl font-semibold text-gray-700 mb-6">
            FotoKita
          </h2>

          <input
            type="password"
            placeholder="Enter password"
            className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-sky-300 outline-none mb-4 text-center transition"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            className="w-full bg-gradient-to-r from-sky-400 to-blue-500 text-white py-2 rounded-xl shadow hover:scale-[1.03] hover:shadow-lg transition duration-300"
            onClick={login}
          >
            Enter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-100 p-6">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          {/* HEADER LOGO (place file in /public/logo-web.png) */}
          <img
            src={logoWeb}
            alt="Logo"
            className="w-10 h-10 object-contain hover:rotate-3 transition duration-300"
          />
          <h1 className="text-2xl font-bold text-gray-700">FotoKita</h1>
        </div>

        <button
          className="bg-white shadow px-4 py-2 rounded-xl hover:bg-gray-100 hover:shadow-md transition"
          onClick={logout}
        >
          Logout
        </button>
      </div>

      {role === "siswa" && (
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">
              Upload Photos (Class {kelas})
            </h2>

            <input
              type="file"
              multiple
              className="w-full border p-3 rounded-xl mb-4"
              onChange={(e) => handlePreview(e.target.files)}
            />

            {preview.length > 0 && (
              <div>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {preview.map((p, i) => (
                    <img
                      key={i}
                      src={p.url}
                      className="rounded-xl h-28 object-cover"
                    />
                  ))}
                </div>

                <button
                  className="bg-green-500 text-white px-5 py-2 rounded-xl shadow"
                  onClick={uploadFiles}
                >
                  Upload
                </button>
              </div>
            )}

            <p className="text-sm text-gray-400 mt-4">
              Limit: {myPhotos.length}/3
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {myPhotos.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-2xl shadow hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
              >
                <img src={p.url} className="h-40 w-full object-cover" />
                <div className="p-3 flex justify-between items-center">
                  <span className="text-xs truncate">{p.name}</span>
                  <button
                    className="text-red-500"
                    onClick={() => deletePhoto(p)}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {role === "admin" && (
        <div className="max-w-6xl mx-auto">
          <h2 className="text-xl font-semibold mb-6">Admin Dashboard</h2>

          {["6A", "6B"].map((cls) => (
            <div key={cls} className="mb-10">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Class {cls}</h3>
                <button
                  onClick={() => downloadAllByClass(cls)}
                  className="bg-indigo-500 text-white px-3 py-1 rounded-lg text-xs shadow"
                >
                  Download All
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {photos
                  .filter((p) => p.kelas === cls)
                  .map((p) => (
                    <div
                      key={p.id}
                      className="bg-white rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                    >
                      <img src={p.url} className="h-44 w-full object-cover" />
                      <div className="p-3">
                        <p className="text-xs mb-1 truncate">{p.name}</p>
                        <p className="text-[10px] text-gray-400 mb-2">
                          {p.ownerId}
                        </p>
                        <div className="flex gap-2">
                          <a
                            href={p.url}
                            download
                            target="_blank"
                            rel="noreferrer"
                            className="bg-blue-500 text-white w-full py-1 rounded-lg text-xs text-center"
                          >
                            Download
                          </a>

                          <button
                            className="bg-red-500 text-white w-full py-1 rounded-lg text-xs"
                            onClick={() => deletePhoto(p)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
