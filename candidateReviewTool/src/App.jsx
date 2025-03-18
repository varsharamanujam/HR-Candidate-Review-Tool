import React, { useState } from "react";
import Sidebar from "./components/sidebar";
import CandidateTable from "./components/candidateTable";
import Carousel from "./components/Carousel";

function App() {
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  return (
    <div className="h-screen w-screen bg-[#151515] text-white flex flex-col">
      {/* Header */}
      <header className="flex border-b border-[#272727] h-16">
        <div className="w-64 border-r border-[#272727] flex items-center px-6">
          <h2 className="text-xl font-bold">RSKD Talent</h2>
        </div>
        <div className="flex-1 flex justify-between items-center px-6 bg-[#151515]">
          <div className="relative flex items-center bg-[#1E1E1E] rounded-full px-4 py-2 w-[340px]">
            <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" strokeWidth="2"
              viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M21 21l-4.35-4.35m-1.65-2.65a7 7 0 1 0-10 0 7 7 0 0 0 10 0z"></path>
            </svg>
            <input type="text" placeholder="Search for jobs, candidates and more..." 
              className="bg-transparent focus:outline-none w-full text-gray-400 placeholder-gray-600"/>
          </div>
          <div className="flex items-center space-x-6">
            <div className="bg-[#1E1E1E] p-2 rounded-full cursor-pointer">
              <img src="https://img.icons8.com/ios/50/898989/settings--v1.png" alt="Settings" className="w-5 h-5"/>
            </div>
            <div className="relative bg-[#1E1E1E] p-2 rounded-full cursor-pointer">
              <img src="https://img.icons8.com/ios/50/898989/appointment-reminders--v1.png" alt="Notification" className="w-5 h-5"/>
              <span className="absolute top-0 right-0 bg-[#00B85E] w-2.5 h-2.5 rounded-full"></span>
            </div>
            <div className="bg-[#1E1E1E] p-2 rounded-full cursor-pointer">
              <img src="https://img.icons8.com/ios/50/898989/user-male-circle.png" alt="Profile" className="w-5 h-5"/>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1">
        <Sidebar />
        <div className="flex-1 p-10 overflow-auto">
          <Carousel />
          <CandidateTable onSelect={setSelectedCandidate} />
        </div>
      </div>
    </div>
  );
}

export default App;
