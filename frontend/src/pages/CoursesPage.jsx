import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import CourseCard from "../components/CourseCard";
import { useAuth } from "../context/AuthContext";
import { getCourses, enrollInCourse } from "../api/api";

export default function CoursesPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const loadCourses = async () => {
      try {
        setLoading(true);
        setError("");

        const coursesData = await getCourses();

        setCourses(coursesData);

        if (user?.role === "student") {
          const userEnrollments = coursesData
            .filter((course) =>
              course.enrollments?.some((e) => e.student === user.id)
            )
            .map((c) => c.id);
          setEnrolledCourseIds(new Set(userEnrollments));
        }
      } catch (err) {
        console.error("Failed to load courses", err);
        setError("Could not load courses. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    loadCourses();
  }, [user]);

  const handleEnroll = async (courseId) => {
    if (!user) {
      setError("Please log in to enroll.");
      return;
    }
    if (user.role !== "student") {
      setError("Only students can enroll in courses.");
      return;
    }

    try {
      await enrollInCourse(courseId);
      setEnrolledCourseIds((prev) => new Set(prev).add(courseId));
      setMessage("Successfully enrolled in course!");
      setError("");
    } catch (err) {
      console.error("Enrollment failed", err);
      setError("Enrollment failed. You may already be enrolled.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[80vh] px-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800">Loading Courses...</h1>
            <p className="text-gray-600 mt-2">Please wait while we fetch available courses.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-800">Available Courses</h1>
          <p className="text-lg text-gray-600 mt-2">Explore and enroll in interactive courses</p>
        </div>

        {/* Messages */}
        {message && (
          <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md text-sm mb-6 text-center">
            {message}
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm mb-6 text-center">
            {error}
          </div>
        )}

        {/* Course Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.length > 0 ? (
            courses.map((course) => (
              <div
                key={course.id}
                className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow duration-200 flex flex-col"
              >
                <CourseCard course={course} />

                {/* Enroll Button */}
                {user?.role === "student" && !enrolledCourseIds.has(course.id) && (
                  <button
                    onClick={() => handleEnroll(course.id)}
                    className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
                  >
                    Enroll
                  </button>
                )}

                {/* Already Enrolled Badge */}
                {enrolledCourseIds.has(course.id) && (
                  <span className="mt-4 inline-flex items-center justify-center px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full self-start">
                    ✅ Enrolled
                  </span>
                )}
              </div>
            ))
          ) : (
            <p className="col-span-full text-center text-gray-500 italic">
              No courses available at the moment.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}