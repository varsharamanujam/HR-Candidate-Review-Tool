import React, { useEffect, useState } from "react";
import Slider from "react-slick";
import { fetchOpenings } from "../api";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

// Import SVG assets
import figmaIcon from "../assets/figma.svg";
import rocketIcon from "../assets/rocket.svg";
import coinIcon from "../assets/coin.svg";
import arrowIcon from "../assets/arrow.svg";
import locationIcon from "../assets/location.svg";
import educationIcon from "../assets/education.svg";

const dummyOpenings = [
  { 
    id: 1, title: "Sr. UX Designer", location: "Bengaluru", experience: "3 years", 
    applications: 45, newApps: 25, postedDays: 2, color: "#29C5EE", icon: figmaIcon
  },
  { 
    id: 2, title: "Growth Manager", location: "Remote", experience: "2+ years", 
    applications: 38, newApps: 10, postedDays: 5, color: "#CF1A2C", icon: rocketIcon
  },
  { 
    id: 3, title: "Financial Analyst", location: "Mumbai", experience: "5+ years", 
    applications: 25, newApps: 25, postedDays: 10, color: "#EAB04D", icon: coinIcon
  },
];

const Carousel = () => {
  const [openings, setOpenings] = useState([]);
  const [sortBy, setSortBy] = useState("latest");

  useEffect(() => {
    const loadOpenings = async () => {
      const data = await fetchOpenings();
      setOpenings(data.length > 0 ? data : dummyOpenings);
    };
    loadOpenings();
  }, []);

  // Sorting Function
  const handleSort = (criteria) => {
    setSortBy(criteria);
    const sorted = [...openings].sort((a, b) => {
      if (criteria === "latest") return a.postedDays - b.postedDays;
      if (criteria === "oldest") return b.postedDays - a.postedDays;
      return 0;
    });
    setOpenings(sorted);
  };

  const settings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    responsive: [
      { breakpoint: 1024, settings: { slidesToShow: 2 } },
      { breakpoint: 768, settings: { slidesToShow: 1 } },
    ],
  };

  return (
    <div className="w-full">
      {/* Header Row */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-white font-urbanist">Current Openings</h2>

        {/* Sort By Dropdown */}
        <select
          className="bg-[#1E1E1E] text-gray-400 px-4 py-2 rounded-lg cursor-pointer"
          value={sortBy}
          onChange={(e) => handleSort(e.target.value)}
        >
          <option value="latest">Sort By: Latest</option>
          <option value="oldest">Sort By: Oldest</option>
        </select>
      </div>

      {/* Carousel */}
      <Slider {...settings}>
        {openings.map((job) => (
          <div key={job.id} className="px-2 relative">
            <div 
              className="relative bg-[#1E1E1E] rounded-xl p-5 shadow-lg backdrop-blur-lg bg-opacity-90 border border-[#272727]"
              style={{ 
                background: `linear-gradient(to right, rgba(30,30,30,0.8), rgba(30,30,30,0.4))`
              }}
            >
              {/* Left Accent Border */}
              <div 
                className="absolute top-0 left-0 h-full w-2 rounded-l-xl"
                style={{ backgroundColor: job.color }}
              ></div>

              {/* Top Right Watercolor Effect */}
              <div 
                className="absolute top-[-10px] right-[-10px] w-28 h-28 rounded-full opacity-20 blur-xl"
                style={{ backgroundColor: job.color }}
              ></div>

              {/* Trend Arrow (Arrow from Assets) */}
              <div className="absolute top-3 right-3 rounded-full p-2">
                <img src={arrowIcon} alt="Trend" className="w-10 h-10"/>
              </div>

              {/* Job Title & Posted Days */}
              <div className="flex items-center mb-2">
                <img src={job.icon} alt="Job Icon" className="w-10 h-10" />
                <h3 className="text-xl font-bold font-urbanist ml-2">{job.title}</h3>
              </div>
              <p className="text-gray-400 text-sm font-urbanist">Posted {job.postedDays} days ago</p>

              {/* Location & Experience Tags */}
              <div className="flex space-x-2 my-3">
                <div className="flex items-center bg-[#282828] text-gray-300 px-3 py-1 rounded-full text-xs">
                  <img src={locationIcon} className="w-4 h-4 mr-1"/>
                  <span>{job.location}</span>
                </div>
                <div className="flex items-center bg-[#282828] text-gray-300 px-3 py-1 rounded-full text-xs">
                  <img src={educationIcon} className="w-4 h-4 mr-1"/>
                  <span>{job.experience} exp.</span>
                </div>
              </div>

              {/* Applications Count */}
              <div className="mt-4 flex justify-between items-center">
                <p className="text-4xl font-bold text-white font-urbanist">{job.applications}</p>
                <p className="text-sm text-[#00B85E] font-urbanist">{job.newApps} in last week</p>
              </div>
            </div>
          </div>
        ))}
      </Slider>
    </div>
  );
};

export default Carousel;
