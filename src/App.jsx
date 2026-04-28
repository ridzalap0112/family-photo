// ==================================
// PREMIUM UI UPGRADE (FIXED + SMOOTH UX)
// ==================================

import { useEffect, useState, useRef } from "react";
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
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [success, setSuccess] = useState(false);
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(null);
  const [kelas, setKelas] = useState(null);
  const deviceId = getDeviceId();
  const dropRef = useRef();

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
    localStorage.clear();
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

  function removePreview(index) {
    setPreview((prev) => prev.filter((_, i) => i !== index));
  }

  async function uploadFiles() {
    if (!kelas) return;
    if (myPhotos.length + preview.length > 3) return alert("Max 3 photos");

    setLoading(true);
    setProgress(0);

    let count = 0;

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

      count++;
      setProgress(Math.round((count / preview.length) * 100));
    }

    setPreview([]);
    setLoading(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2000);
    fetchPhotos();
  }

  async function downloadDirect(url, name) {
    const res = await fetch(url);
    const blob = await res.blob();
    saveAs(blob, name || "photo.jpg");
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

  // DRAG DROP
  useEffect(() => {
    const dropArea = dropRef.current;
    if (!dropArea) return;

    dropArea.ondragover = (e) => e.preventDefault();
    dropArea.ondrop = (e) => {
      e.preventDefault();
      handlePreview(e.dataTransfer.files);
    };
  }, []);

  if (!role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-200 to-white">
        <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-xl w-[360px] text-center">
          <img src={logoLogin} className="w-20 mx-auto mb-2" />
          <h1 className="text-lg font-semibold text-gray-700 mb-1">
            Grade 6 Family Photo
          </h1>
          <p className="text-xs text-gray-500 mb-1">
            Upload & manage class memories
          </p>
          <p className="text-[10px] text-gray-400 tracking-wide uppercase">
            SD Nasional Plus BPK PENABUR Sentul City – Bogor
          </p>
          <input
            type="password"
            className="w-full p-3 border rounded-xl mb-4"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            onClick={login}
            className="w-full bg-blue-500 text-white p-2 rounded-xl"
          >
            Enter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between mb-6">
        <div className="flex flex-col">
          <div className="flex gap-2 items-center">
            <img src={logoWeb} className="w-8" />
            <h1 className="font-bold">Family Photo</h1>
          </div>
          <p className="text-[11px] text-gray-500 ml-10">
            SD Nasional Plus BPK PENABUR Sentul City – Bogor
          </p>
        </div>
        <button onClick={logout}>Logout</button>
      </div>

      {role === "siswa" && (
        <div className="max-w-xl mx-auto">
          <div
            ref={dropRef}
            className="border-2 border-dashed p-6 rounded-xl text-center mb-4"
          >
            Drag & Drop or Select Files
            <input
              type="file"
              multiple
              className="block mt-2"
              onChange={(e) => handlePreview(e.target.files)}
            />
          </div>

          {preview.map((p, i) => (
            <div key={i} className="flex items-center gap-2 mb-2">
              <img src={p.url} className="w-16 h-16 object-cover rounded" />
              <span className="text-sm flex-1">{p.file.name}</span>
              <button onClick={() => removePreview(i)}>✕</button>
            </div>
          ))}

          {loading && (
            <div className="w-full bg-gray-200 h-2 rounded mt-3">
              <div
                className="bg-blue-500 h-2 rounded"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {success && <p className="text-green-500 mt-2">Upload success ✓</p>}

          <button
            onClick={uploadFiles}
            className="bg-green-500 text-white px-4 py-2 mt-4 rounded"
            disabled={loading}
          >
            Upload
          </button>
        </div>
      )}

      {role === "admin" && (
        <div className="space-y-10">
          {["6A", "6B"].map((cls) => (
            <div key={cls} className="bg-white rounded-2xl shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Class {cls}</h2>
                <button
                  onClick={() => downloadAllByClass(cls)}
                  className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm"
                >
                  Download All
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {photos
                  .filter((p) => p.kelas === cls)
                  .map((p) => (
                    <div
                      key={p.id}
                      className="bg-gray-50 rounded-xl shadow-sm overflow-hidden hover:shadow-md transition"
                    >
                      <img src={p.url} className="w-full h-40 object-cover" />

                      <div className="p-3 space-y-2">
                        <p className="text-xs text-gray-600 truncate">
                          {p.name || "No name"}
                        </p>

                        <div className="flex gap-2">
                          <button
                            onClick={() => downloadDirect(p.url, p.name)}
                            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-xs py-1 rounded-lg"
                          >
                            Download
                          </button>

                          <button
                            onClick={() => deletePhoto(p)}
                            className="flex-1 bg-red-500 hover:bg-red-600 text-white text-xs py-1 rounded-lg"
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
