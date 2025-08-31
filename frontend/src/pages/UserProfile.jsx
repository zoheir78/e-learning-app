
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import api, { loadTokens, getStatusUpdates, postStatusUpdate, getUserProfile, deleteStatusUpdate } from "../api/api";

const UserProfile = () => {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [statusUpdates, setStatusUpdates] = useState([]);
  const [newStatus, setNewStatus] = useState("");

  const loggedInUser = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        //  Load user profile
        const data = await getUserProfile(id);
        setProfile(data);

        //  Load status updates from feedback app
        const updates = await getStatusUpdates(data.id);
        setStatusUpdates(updates);

        const tokens = loadTokens();
        if (!tokens) return;

        //  Load enrollments if student
        if (data.role === "student") {
          const [coursesRes, enrollRes] = await Promise.all([
            api.get("courses/courses/", {
              headers: { Authorization: `Bearer ${tokens.access}` },
            }),
            api.get("courses/enrollments/", {
              headers: { Authorization: `Bearer ${tokens.access}` },
            }),
          ]);

          const allCourses = coursesRes.data;
          const studentEnrollments = enrollRes.data
            .filter((e) => e.student?.id === data.id)
            .map((e) => ({
              ...e,
              course: allCourses.find((c) => c.id === e.course),
            }));

          setEnrollments(studentEnrollments);
        }

        //  Load courses if teacher
        if (data.role === "teacher") {
          const coursesRes = await api.get("courses/courses/", {
            headers: { Authorization: `Bearer ${tokens.access}` },
          });
          const teacherCourses = coursesRes.data.filter((c) =>
            typeof c.teacher === "string"
              ? c.teacher === data.username
              : c.teacher?.username === data.username
          );
          setCourses(teacherCourses);
        }
      } catch (err) {
        console.error("Failed to load user profile", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id]);

  const handlePostStatus = async () => {
    if (!newStatus.trim()) return;
    try {
      // Post to feedback app
      const created = await postStatusUpdate(newStatus);
      // Prepend to existing status updates
      setStatusUpdates([created, ...statusUpdates]);
      setNewStatus("");
    } catch (err) {
      console.error("Failed to post status update", err);
    }
  };

  if (loading) return <p className="text-center mt-10">Loading...</p>;
  if (!profile) return <p className="text-center mt-10">User not found</p>;

  return (
    <div>
      <Navbar />
      <div className="max-w-4xl mx-auto mt-10 p-6 bg-white shadow rounded-lg">
        <h1 className="text-2xl font-bold mb-4">{profile.username}’s Profile</h1>
        <p>
          <strong>Email:</strong> {profile.email}
        </p>
        <p>
          <strong>Role:</strong> {profile.role}
        </p>

        {profile.bio && (
          <p className="mt-2">
            <strong>Bio:</strong> {profile.bio}
          </p>
        )}

        {/* Status Updates */}
        <div className="mt-6">
          <h2 className="font-semibold text-lg">📌 Status Updates</h2>

          {/* Only allow logged-in student to post on their own page */}
          {loggedInUser?.id === profile.id && loggedInUser?.role === "student" && (
            <div className="mt-2">
              <textarea
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full border rounded p-2 mb-2"
                placeholder="What's on your mind?"
              />
              <button
                onClick={handlePostStatus}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Post
              </button>
            </div>
          )}

          {statusUpdates.length > 0 ? (
            <ul className="list-disc list-inside mt-2">
              {statusUpdates.map((s) => (
                <li key={s.id} className="flex justify-between items-start">
                  {s.content}{" "}
                  <span className="text-gray-500 text-sm">
                    ({new Date(s.created_at).toLocaleString()})
                  </span>
                  {loggedInUser?.id === profile.id && (
                    <button
                      onClick={async () => {
                        try {
                          await deleteStatusUpdate(s.id);
                          setStatusUpdates(statusUpdates.filter((su) => su.id !== s.id));
                        } catch (err) {
                          console.error("Failed to delete status update", err);
                        }
                      }}
                      className="text-red-600 ml-2 hover:underline"
                    >
                      Delete
                    </button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600 mt-2">No status updates yet.</p>
          )}
        </div>

        {/* Student Enrollments */}
        {profile.role === "student" && (
          <div className="mt-6">
            <h2 className="text-xl font-semibold">🎓 Enrolled Courses</h2>
            {enrollments.length > 0 ? (
              <ul className="list-disc list-inside mt-2">
                {enrollments.map((enroll) => (
                  <li key={enroll.id}>
                    <Link
                      to={`/courses/${enroll.course?.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      {enroll.course?.title}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-600">No enrolled courses.</p>
            )}
          </div>
        )}

        {/* Teacher Courses */}
        {profile.role === "teacher" && (
          <div className="mt-6">
            <h2 className="text-xl font-semibold">📚 Courses Created</h2>
            {courses.length > 0 ? (
              <ul className="list-disc list-inside mt-2">
                {courses.map((course) => (
                  <li key={course.id}>
                    <Link
                      to={`/courses/${course.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      {course.title}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-600">No courses created yet.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
