import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { getCourses, createCourse } from "../api/api";
import api, { loadTokens } from "../api/api";
import ChatRoom from "../components/ChatRoom";

export default function TeacherDashboard() {
  const [user] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [expandedCourses, setExpandedCourses] = useState({});
  const [selectedFiles, setSelectedFiles] = useState({});
  const [uploadMessages, setUploadMessages] = useState({});
  const [courseMaterials, setCourseMaterials] = useState({});

  // Load teacher courses and materials
  useEffect(() => {
    const loadCourses = async () => {
      try {
        const data = await getCourses();
        const teacherCourses = data.filter((course) =>
          typeof course.teacher === "string"
            ? course.teacher === user.username
            : course.teacher?.username === user.username
        );
        setCourses(teacherCourses);

        teacherCourses.forEach(async (course) => {
          try {
            const res = await api.get(`courses/materials/?course=${course.id}`);
            setCourseMaterials((prev) => ({ ...prev, [course.id]: res.data }));
          } catch (err) {
            console.error(`Failed to load materials for course ${course.id}`, err);
          }
        });
      } catch (err) {
        console.error(err);
        setError("Failed to load your courses.");
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === "teacher") loadCourses();
  }, [user]);

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    if (!title || !description) {
      setError("Title and description are required.");
      return;
    }

    try {
      const newCourse = await createCourse({ title, description });
      setCourses((prev) => [...prev, newCourse]);
      setTitle("");
      setDescription("");
      setMessage("✅ Course created successfully!");
      setTimeout(() => setMessage(""), 5000);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Failed to create course.");
    }
  };

  const handleSearch = async (query) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await api.get(`users/search/?q=${query}`);
      setSearchResults(res.data);
    } catch (err) {
      console.error("Search failed", err);
    }
  };

  const toggleStudentList = (courseId) => {
    setExpandedCourses((prev) => ({
      ...prev,
      [courseId]: !prev[courseId],
    }));
  };

  const handleFileSelect = (courseId, file) => {
    setSelectedFiles((prev) => ({ ...prev, [courseId]: file }));
  };

  const handleUpload = async (courseId) => {
    const file = selectedFiles[courseId];
    if (!file) {
      setUploadMessages((prev) => ({
        ...prev,
        [courseId]: "Please select a file first.",
      }));
      return;
    }

    try {
      const tokens = loadTokens();
      const formData = new FormData();
      formData.append("file", file);
      formData.append("course", courseId);

      await api.post("courses/materials/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${tokens.access}`,
        },
      });

      const res = await api.get(`courses/materials/?course=${courseId}`);
      setCourseMaterials((prev) => ({ ...prev, [courseId]: res.data }));

      setUploadMessages((prev) => ({
        ...prev,
        [courseId]: "✅ File uploaded successfully!",
      }));
      setTimeout(() => setUploadMessages(""), 5000);
    } catch (err) {
      console.error(err.response || err);
      setUploadMessages((prev) => ({
        ...prev,
        [courseId]: "❌ Upload failed.",
      }));
      setTimeout(() => setUploadMessages(""), 5000);
    }
  };

  if (!user) {
    return (
      <div>
        <Navbar />
        <div className="max-w-3xl mx-auto mt-10 p-6 bg-white rounded-xl shadow">
          <p className="text-gray-600">
            Please{" "}
            <a href="/login" className="text-blue-600 underline">
              log in
            </a>{" "}
            to access your dashboard.
          </p>
        </div>
      </div>
    );
  }

  if (user.role !== "teacher") {
    return (
      <div>
        <Navbar />
        <div className="max-w-3xl mx-auto mt-10 p-6 bg-white rounded-xl shadow">
          <p className="text-red-600 font-medium">
            ❌ Access denied. This is a teacher-only area.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="max-w-4xl mx-auto mt-10 p-6 bg-white shadow-lg rounded-xl">
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const tokens = loadTokens();

  return (
    <div>
      <Navbar />
      <div className="max-w-6xl mx-auto mt-10 p-6 bg-white shadow-lg rounded-xl">
        <h1 className="text-3xl font-bold mb-6">👩‍🏫 Teacher Dashboard</h1>
        {user && (
          <p className="text-gray-600 mb-6">
            Welcome, <strong>{user.username}</strong>
            <br />
            {user.email}
          </p>
        )}

        {message && <p className="text-green-600 mb-4">{message}</p>}
        {error && <p className="text-red-600 mb-4">{error}</p>}

        {/* Create Course */}
        <section className="mb-10 p-6 border rounded-lg bg-gray-50">
          <h2 className="text-xl font-semibold mb-4">Create New Course</h2>
          <form onSubmit={handleCreateCourse} className="space-y-4">
            <div>
              <label className="block mb-1 font-medium">Course Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2 border rounded-md focus:ring focus:ring-blue-300"
                placeholder="e.g. Advanced Web Development"
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2 border rounded-md focus:ring focus:ring-blue-300"
                rows="3"
                placeholder="Describe your course..."
              />
            </div>
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
            >
              Create Course
            </button>
          </form>
        </section>

        {/* My Courses */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">Your Courses</h2>
          {courses.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition"
                >
                  <h3 className="font-bold text-gray-800">{course.title}</h3>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {course.description}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    <strong>Enrolled:</strong>{" "}
                    {course.enrollments?.length || 0} students
                  </p>

                  {/* Students List */}
                  {course.enrollments?.length > 0 && (
                    <div className="mt-2">
                      <button
                        onClick={() => toggleStudentList(course.id)}
                        className="text-blue-600 text-sm underline mb-2"
                      >
                        {expandedCourses[course.id]
                          ? "Hide Students"
                          : "Show Students"}
                      </button>
                      {expandedCourses[course.id] && (
                        <ul className="list-disc list-inside text-sm text-gray-600">
                          {course.enrollments.map((e) => (
                            <li key={e.id}>
                              {e.student?.username} ({e.student?.email})
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}

                  {/* Upload Course Material */}
                  <div className="mt-3">
                    <input
                      type="file"
                      onChange={(e) =>
                        handleFileSelect(course.id, e.target.files[0])
                      }
                      className="mb-2"
                    />
                    <button
                      onClick={() => handleUpload(course.id)}
                      className="bg-green-600 text-white px-2 py-1 rounded-md hover:bg-green-700 text-sm"
                    >
                      Upload
                    </button>
                    {uploadMessages[course.id] && (
                      <p className="text-sm mt-1">
                        {uploadMessages[course.id]}
                      </p>
                    )}
                  </div>

                  {/* Uploaded Materials */}
                  {courseMaterials[course.id]?.length > 0 ? (
                    <div className="mt-3">
                      <h4 className="font-medium text-sm mb-1">
                        Course Materials:
                      </h4>
                      <ul className="list-disc list-inside text-sm">
                        {courseMaterials[course.id].map((material) => (
                          <li key={material.id}>
                            <a
                              href={material.file}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline truncate block w-48"
                              download
                            >
                              {material.title}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p className="mt-2 text-gray-500 text-sm">
                      No materials uploaded yet
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">
              You haven’t created any courses yet.
            </p>
          )}
        </section>

        {/* Search Users */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4">🔍 Search Users</h2>
          <input
            type="text"
            placeholder="Search students and teachers..."
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm"
            onChange={(e) => handleSearch(e.target.value)}
          />

          {searchResults.length > 0 && (
            <div className="mt-4 bg-gray-50 border rounded-md p-4 shadow">
              <h3 className="font-medium mb-2">Results:</h3>
              <ul className="space-y-2">
                {searchResults.map((u) => (
                  <li
                    key={u.id}
                    className="p-2 border-b last:border-none flex justify-between items-center"
                  >
                    <span>
                      <strong>{u.username}</strong> ({u.role})
                    </span>
                    <a
                      href={`/profile/${u.id}`}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      View →
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* Campus Chat */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">💬 Campus Chat</h2>
          <div className="border rounded-lg shadow bg-gray-50 h-[500px]">
            {tokens?.access ? (
              <ChatRoom
                accessToken={tokens.access}
                username={user.username}
                roomName="campus"
              />
            ) : (
              <p className="text-red-600 p-4">
                ⚠️ You must be logged in to use the chat.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}


