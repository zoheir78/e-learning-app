import React from "react";
import { Link } from "react-router-dom";

const CourseCard = ({ course }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
      <h2 className="text-xl font-bold text-gray-800">{course.title}</h2>
      <p className="mt-2 text-gray-600 text-sm leading-relaxed line-clamp-2">
        {course.description}
      </p>
      <p className="mt-3 text-xs text-gray-500">
        <strong>Teacher:</strong>{" "}
        {typeof course.teacher === "string"
          ? course.teacher
          : course.teacher?.username || "Unknown"}
      </p>
      <Link
        to={`/courses/${course.id}`}
        className="mt-4 inline-block text-blue-600 hover:text-blue-800 font-medium text-sm transition"
      >
        View Details →
      </Link>
    </div>
  );
};

export default CourseCard;