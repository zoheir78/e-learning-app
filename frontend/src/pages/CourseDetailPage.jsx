import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { getCourseDetail, enrollInCourse, leaveFeedback } from "../api/api";

export default function CourseDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [enrolled, setEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Feedback form state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  useEffect(() => {
    const loadCourse = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getCourseDetail(id);
        setCourse(data);

        if (user?.role === "student") {
          const isEnrolled = data.enrollments?.some((e) => e.student.id === user.id);
          setEnrolled(isEnrolled);
        }
      } catch (err) {
        console.error("Failed to load course", err);
        setError("Course not found or server error.");
      } finally {
        setLoading(false);
      }
    };

    loadCourse();
  }, [id, user]);

  const handleEnroll = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (user.role !== "student") {
      setError("Only students can enroll in this course.");
      return;
    }

    try {
      await enrollInCourse(parseInt(id));
      setEnrolled(true);
      setMessage("Successfully enrolled in the course!");
      setError("");
    } catch (err) {
      console.error("Enrollment failed", err);
      setError("Enrollment failed. You may already be enrolled.");
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    try {
      await leaveFeedback({
        course: parseInt(id),
        rating,
        comment,
      });

      // reload course details so new feedback appears
      const updatedCourse = await getCourseDetail(id);
      setCourse(updatedCourse);

      setMessage("Thank you for your feedback!");
      setComment("");
      setRating(5);
    } catch (err) {
      setError("Failed to submit feedback. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[80vh] px-4">
          <p className="text-lg text-gray-600">Loading course details...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[80vh] px-4">
          <p className="text-lg text-red-600">{error || "Course not found."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Course Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">{course.title}</h1>
          <p className="text-gray-600 mt-2">{course.description}</p>
          <p className="text-sm text-gray-500 mt-3">
            <strong>Teacher:</strong>{" "}
            {typeof course.teacher === "string"
              ? course.teacher
              : course.teacher?.username || "Unknown"}
          </p>
        </header>

        {/* Messages */}
        {message && (
          <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md text-sm mb-6">
            {message}
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm mb-6">
            {error}
          </div>
        )}

        {/* Enroll Button */}
        {user?.role === "student" && !enrolled && (
          <div className="mb-8">
            <button
              onClick={handleEnroll}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-6 rounded-md shadow transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
            >
              Enroll in Course
            </button>
          </div>
        )}

        {/* Already Enrolled Badge */}
        {enrolled && (
          <div className="mb-8">
            <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
              ✅ You are enrolled in this course.
            </span>
          </div>
        )}

        {/* Course Materials */}
        {course.materials && course.materials.length > 0 && (
          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">📚 Course Materials</h2>
            <ul className="space-y-3">
              {course.materials.map((material) => (
                <li key={material.id} className="flex items-start">
                  <svg
                    className="w-5 h-5 text-blue-500 mr-3 mt-1 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                      clipRule="evenodd"
                    />
                  </svg>

                  <a
                    href={material.file}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {material.title}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Feedback Section */}
        {enrolled && user?.role === "student" && (
          <section className="mb-10 border-t pt-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">📝 Leave Feedback</h2>
            <form onSubmit={handleFeedbackSubmit} className="space-y-5">
              <div>
                <label htmlFor="rating" className="block text-sm font-medium text-gray-700 mb-1">
                  Rating (1-5)
                </label>
                <select
                  id="rating"
                  value={rating}
                  onChange={(e) => setRating(parseInt(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {[1, 2, 3, 4, 5].map((num) => (
                    <option key={num} value={num}>
                      {num} Star{num > 1 ? "s" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-1">
                  Comment
                </label>
                <textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows="3"
                  placeholder="Share your thoughts about the course..."
                  className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-5 rounded-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-green-400"
              >
                Submit Feedback
              </button>
            </form>
          </section>
        )}

        {/* Display Existing Feedback */}
        {course.feedbacks && course.feedbacks.length > 0 && (
          <section className="border-t pt-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">💬 Student Feedback</h2>
            <div className="space-y-4">
              {course.feedbacks.map((fb) => (
                <div
                  key={fb.id}
                  className="bg-white border-l-4 border-blue-400 pl-5 pr-5 py-4 rounded-r shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-gray-800">{fb.student}</p>
                    <small className="text-gray-500">
                      {new Date(fb.created_at).toLocaleDateString()}
                    </small>
                  </div>
                  <div className="text-yellow-500 text-lg mt-1">
                    {"★".repeat(fb.rating)}
                    {"☆".repeat(5 - fb.rating)}
                  </div>
                  <p className="text-gray-700 mt-2">{fb.comment}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
