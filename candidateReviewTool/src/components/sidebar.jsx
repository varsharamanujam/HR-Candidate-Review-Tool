import React from "react";

const Sidebar = () => {
  return (
    <div className="w-64 h-full text-white flex flex-col border-r border-[#272727] pr-5 pt-5 pb-5">

      {/* RECRUITMENT Section (Left-Aligned, Smaller) */}
      <h3 className="text-gray-500 uppercase text-xs tracking-widest mb-4 pl-5">Recruitment</h3>

      {/* Candidates Button (Fully Left, Rounded on Right) */}
      <div className="bg-gradient-to-r from-[#6E38E0] to-[#FF5F36] text-white flex items-center space-x-3 py-3 pl-4 pr-6 rounded-r-full text-lg font-semibold cursor-pointer w-[100%]">
        {/* Icon */}
        <img src="https://img.icons8.com/ios-filled/50/ffffff/conference-call.png" alt="Candidates Icon" className="w-5 h-5"/>
        {/* Text */}
        <span>Candidates</span>
      </div>
    </div>
  );
};

export default Sidebar;
