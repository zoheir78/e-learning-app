
import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import api, { loadTokens } from "../api/api";
import ChatRoom from "../components/ChatRoom";

const StudentDashboard = () => {
  const [user, setUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      setError("You must log in to view this page.");
      setLoading(false);
      return;
    }
    setUser(JSON.parse(storedUser));
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const tokens = loadTokens();
        if (!tokens) {
          setError("You must log in to view this page.");
          setLoading(false);
          return;
        }

        const [coursesRes, enrollRes] = await Promise.all([
          api.get("courses/courses/", {
            headers: { Authorization: `Bearer ${tokens.access}` },
          }),
          api.get("courses/enrollments/", {
            headers: { Authorization: `Bearer ${tokens.access}` },
          }),
        ]);

        const allCourses = coursesRes.data;
        setCourses(allCourses);

        const studentId = JSON.parse(localStorage.getItem("user")).id;
        const studentEnrollments = enrollRes.data
          .filter((e) => e.student?.id === studentId)
          .map((e) => ({
            ...e,
            course: allCourses.find((c) => c.id === e.course),
          }));

        setEnrollments(studentEnrollments);
      } catch (err) {
        console.error("Error loading dashboard data:", err);
        setError("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === "student") fetchData();
    else setLoading(false);
  }, [user]);

  const handleEnroll = async (courseId) => {
    try {
      const tokens = loadTokens();
      const response = await api.post(
        "courses/enrollments/",
        { course: courseId },
        { headers: { Authorization: `Bearer ${tokens.access}` } }
      );

      const enrolledCourse = courses.find((c) => c.id === courseId);
      setEnrollments((prev) => [
        ...prev,
        { ...response.data, course: enrolledCourse },
      ]);
      setSuccessMsg("✅ Enrolled successfully!");
      setTimeout(() => setSuccessMsg(""), 5000);
      setError("");
    } catch (err) {
      console.error("Enrollment failed:", err);
      setError(
        err.response?.data?.detail || "Enrollment failed. Please try again."
      );
    }
  };

  if (loading) return <p className="text-center mt-10">Loading...</p>;
  if (!user || user.role !== "student")
    return (
      <div>
        <Navbar />
        <div className="max-w-3xl mx-auto mt-10 p-6 bg-white rounded-xl shadow">
          <p className="text-red-600 font-medium">
            ❌ Access denied. This page is for students only.
          </p>
        </div>
      </div>
    );

  const enrolledCourseIds = new Set(enrollments.map((e) => e.course.id));
  const tokens = loadTokens();

  return (
    <div>
      <Navbar />
      <div className="max-w-6xl mx-auto mt-10 p-6 bg-white shadow-lg rounded-xl">
        <h1 className="text-3xl font-bold mb-6">🎓 Student Dashboard</h1>

        {user && (
          <p className="text-gray-700 mb-6">
            Welcome, <strong>{user.username}</strong>
            <br /> {user.email}
          </p>
        )}
        {error && <p className="text-red-600 mb-4">{error}</p>}
        {successMsg && <p className="text-green-600 mb-4">{successMsg}</p>}

        {/* Available Courses */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">Available Courses</h2>
          {courses.length > 0 ? (
            <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {courses.map((course) => (
                <li
                  key={course.id}
                  className="p-4 border rounded-lg shadow bg-white"
                >
                  <h3 className="text-lg font-medium">{course.title}</h3>
                  <p className="text-gray-600">{course.description}</p>
                  <button
                    onClick={() => handleEnroll(course.id)}
                    disabled={enrolledCourseIds.has(course.id)}
                    className={`mt-2 px-4 py-2 rounded-lg text-white ${
                      enrolledCourseIds.has(course.id)
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    {enrolledCourseIds.has(course.id) ? "Enrolled" : "Enroll"}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600">No new courses available.</p>
          )}
        </section>

        {/* Campus Chat */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">💬 Campus Chat</h2>
          <div className="border rounded-lg shadow bg-gray-50 h-[500px]">
            {tokens?.access ? (
              <ChatRoom
                accessToken={tokens.access}    // ✅ pass JWT token for auth
                username={user.username} // ✅ show username in chat
                roomName="campus"        // ✅ single global chat room
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
};

export default StudentDashboard;
