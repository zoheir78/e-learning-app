
import axios from "axios";

// Create axios instance with base URL
const api = axios.create({
  baseURL: "http://localhost:8081/api/", // Django backend
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: false, // JWT is sent via Authorization header
});

// -------------------
// AUTH HELPERS
// -------------------

// Save tokens to localStorage and set header
const setAuthTokens = (data) => {
  if (data.access) {
    localStorage.setItem("authTokens", JSON.stringify(data));
    api.defaults.headers.common["Authorization"] = `Bearer ${data.access}`;
  }
};

// Load tokens from localStorage
export const loadTokens = () => {
  const tokensStr = localStorage.getItem("authTokens");
  if (tokensStr) {
    const tokens = JSON.parse(tokensStr);
    api.defaults.headers.common["Authorization"] = `Bearer ${tokens.access}`;
    return tokens;
  }
  return null;
};

// Refresh token if access token expires
export const refreshAccessToken = async () => {
  const tokens = JSON.parse(localStorage.getItem("authTokens"));
  if (!tokens || !tokens.refresh) return null;

  try {
    const response = await api.post("users/token/refresh/", {
      refresh: tokens.refresh,
    });
    const newTokens = { ...tokens, access: response.data.access };
    localStorage.setItem("authTokens", JSON.stringify(newTokens));
    api.defaults.headers.common["Authorization"] = `Bearer ${response.data.access}`;
    return newTokens;
  } catch (error) {
    console.error("Token refresh failed", error);
    logoutUser();
    return null;
  }
};

// Remove tokens and clear auth
const removeAuthTokens = () => {
  localStorage.removeItem("authTokens");
  delete api.defaults.headers.common["Authorization"];
};

// -------------------
// API FUNCTIONS
// -------------------

//  Register a new user
export const registerUser = async (userData) => {
  const response = await api.post("users/register/", userData);
  return response.data;
};

//  Login user and save tokens + user data
export const loginUser = async (credentials) => {
  const response = await api.post("users/login/", credentials);

  if (response.data.access) {
    setAuthTokens(response.data); // Save tokens
    // Save user object too 
    if (response.data.user) {
      localStorage.setItem("user", JSON.stringify(response.data.user));
    }
  }

  return response.data.user; // return the user object
};

//  Logout user (frontend-only for JWT)
export const logoutUser = () => {
  removeAuthTokens();
  localStorage.removeItem("user");
};


//  Get current logged-in user
export const getCurrentUser = async () => {
  const response = await api.get("users/me/");
  return response.data;
};


//  Get user profile by id
export const getUserProfile = async (userId) => {
  const response = await api.get(`users/${userId}/`);
  return response.data;
};


// -------------------
// COURSES
// -------------------

//  Get all courses
export const getCourses = async () => {
  const response = await api.get("courses/courses/");
  return response.data;
};

//  Get single course detail
export const getCourseDetail = async (courseId) => {
  const response = await api.get(`courses/courses/${courseId}/`);
  return response.data;
};

//  Enroll in a course
export const enrollInCourse = async (courseId) => {
  const response = await api.post("courses/enrollments/", {
    course: courseId,
  });
  return response.data;
};

//  Teacher: Create a new course
export const createCourse = async (courseData) => {
  const response = await api.post("courses/courses/", courseData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

//  Get courses (for teachers: their own, students: all)
export const getTeacherCourses = async () => {
  const response = await api.get("courses/courses/");
  return response.data.filter(course => course.teacher === localStorage.getItem("username"));
  // Note: Backend already filters for teachers, so this is optional
};

// -------------------
// FEEDBACK
// -------------------

//  Submit feedback for a course
export const leaveFeedback = async (feedbackData) => {
  const response = await api.post("feedback/feedbacks/", feedbackData);
  return response.data;
};

//  Get all status updates (optionally filter by student id)
export const getStatusUpdates = async (userId) => {
  const response = await api.get("feedback/status-updates/", {
    params: { student_id: userId }
  });
  return response.data;
};


//  Post a new status update
export const postStatusUpdate = async (content) => {
  const response = await api.post("feedback/status-updates/", { content });
  return response.data;
};

//  Delete a status update by ID
export const deleteStatusUpdate = async (id) => {
  const response = await api.delete(`feedback/status-updates/${id}/`);
  return response.data;
};

// -------------------
// NOTIFICATIONS
// -------------------

//  Get user notifications
export const getNotifications = async () => {
  const response = await api.get("notifications/notifications/");
  return response.data;
};

//  Mark notification as read
export const markAsRead = async (id) => {
  const response = await api.patch(`notifications/notifications/${id}/`, {
    is_read: true,
  });
  return response.data;
};

// -------------------
// CHAT
// -------------------

//  Get user's chat rooms
export const getChatRooms = async () => {
  const response = await api.get("chat/rooms/");
  return response.data;
};

//  Get messages in a room
export const getMessages = async (roomId) => {
  const response = await api.get(`chat/messages/?room=${roomId}`);
  return response.data;
};

export default api;