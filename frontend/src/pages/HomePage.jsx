
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getCurrentUser } from "../api/api";

const HomePage = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const freshUser = await getCurrentUser();
        setUser(freshUser);

        // Save user in localStorage
        localStorage.setItem("user", JSON.stringify(freshUser));

        // Delay redirect by 2 seconds
        setTimeout(() => {
          if (freshUser?.role === "teacher") {
            navigate("/teacher-dashboard");
          } else if (freshUser?.role === "student") {
            navigate("/student-dashboard");
          }
        }, 2000); //  2 seconds delay
      } catch (err) {
        console.error("Error fetching user:", err);
        navigate("/login");
      }
    };

    fetchUser();
  }, [navigate]);

  return (
    <div>
      <Navbar />
      <div className="flex items-center justify-center h-screen">
        <h1 className="text-3xl font-bold">Welcome to the eLearning App</h1>
      </div>
    </div>
  );
};

export default HomePage;
