import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { logoutUser as apiLogout } from "../api/api";

const Navbar = () => {
  const navigate = useNavigate();

  // read user from localStorage
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });

  // keep navbar in sync if user changes in another tab
  useEffect(() => {
    const onStorage = () => {
      const saved = localStorage.getItem("user");
      setUser(saved ? JSON.parse(saved) : null);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const handleLogout = () => {
    apiLogout(); // clears tokens + localStorage "user"
    setUser(null);
    navigate("/login");
  };

  // state for mobile menu
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        {/* Logo */}
        <Link
          to="/"
          className="text-xl font-bold text-white hover:text-gray-200 transition duration-200"
        >
          eLearning
        </Link>

        {/* Hamburger button (small screens) */}
        <button
          className="md:hidden flex flex-col space-y-1 focus:outline-none"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="block w-6 h-0.5 bg-white"></span>
          <span className="block w-6 h-0.5 bg-white"></span>
          <span className="block w-6 h-0.5 bg-white"></span>
        </button>

        {/* Desktop menu */}
        <div className="hidden md:flex items-center space-x-6">
          <Link
            to="/courses"
            className="text-white hover:text-gray-200 transition duration-200 font-medium"
          >
            Courses
          </Link>

          {user?.role === "teacher" && (
            <Link
              to="/teacher-dashboard"
              className="text-white hover:text-gray-200 transition duration-200 font-medium"
            >
              Teacher Dashboard
            </Link>
          )}

          {user?.role === "student" && (
            <Link
              to="/student-dashboard"
              className="text-white hover:text-gray-200 transition duration-200 font-medium"
            >
              Student Dashboard
            </Link>
          )}

          {user && (
            <Link
              to={`/profile/${user.id}`}
              className="text-white hover:text-blue-200 transition duration-200 font-medium"
            >
              Profile
            </Link>
          )}

          {user ? (
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white text-sm font-semibold px-4 py-1.5 rounded-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
            >
              Logout
            </button>
          ) : (
            <div className="flex items-center space-x-3">
              <Link
                to="/login"
                className="text-white hover:text-gray-200 font-medium transition duration-200"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold px-4 py-1.5 rounded-md transition duration-200 shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile menu (same colors as desktop) */}
      {isOpen && (
        <div className="md:hidden px-4 pb-3 space-y-2 bg-blue-600">
          <Link
            to="/courses"
            className="block text-white hover:text-gray-200 font-medium"
            onClick={() => setIsOpen(false)}
          >
            Courses
          </Link>

          {user?.role === "teacher" && (
            <Link
              to="/teacher-dashboard"
              className="block text-white hover:text-gray-200 font-medium"
              onClick={() => setIsOpen(false)}
            >
              Teacher Dashboard
            </Link>
          )}

          {user?.role === "student" && (
            <Link
              to="/student-dashboard"
              className="block text-white hover:text-gray-200 font-medium"
              onClick={() => setIsOpen(false)}
            >
              Student Dashboard
            </Link>
          )}

          {user && (
            <Link
              to={`/profile/${user.id}`}
              className="block text-white hover:text-blue-200 font-medium"
              onClick={() => setIsOpen(false)}
            >
              Profile
            </Link>
          )}

          {user ? (
            <button
              onClick={() => {
                handleLogout();
                setIsOpen(false);
              }}
              className="w-full text-left bg-red-500 hover:bg-red-600 text-white text-sm font-semibold px-4 py-1.5 rounded-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
            >
              Logout
            </button>
          ) : (
            <div className="flex flex-col space-y-2">
              <Link
                to="/login"
                className="block text-white hover:text-gray-200 font-medium"
                onClick={() => setIsOpen(false)}
              >
                Login
              </Link>
              <Link
                to="/register"
                className="block bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold px-4 py-1.5 rounded-md transition duration-200 shadow-sm hover:shadow"
                onClick={() => setIsOpen(false)}
              >
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
