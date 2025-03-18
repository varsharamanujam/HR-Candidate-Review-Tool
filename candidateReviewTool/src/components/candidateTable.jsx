import React, { useEffect, useState } from "react";
import { fetchCandidates } from "../api";

const CandidateTable = ({ onSelect }) => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch candidates when the component mounts
  useEffect(() => {
    const loadCandidates = async () => {
      try {
        const data = await fetchCandidates();
        setCandidates(data);
      } catch (error) {
        console.error("Error fetching candidates:", error);
      } finally {
        setLoading(false);
      }
    };
    loadCandidates();
  }, []);

  if (loading) {
    return <p className="text-white text-center">Loading candidates...</p>;
  }

  return (
    <div className="bg-darkBg text-white p-5 rounded-lg">
      <h2 className="text-lg font-semibold mb-3">Candidates</h2>
      {/* <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-800">
            <th className="p-3">Candidate Name</th>
            <th className="p-3">Rating</th>
            <th className="p-3">Stage</th>
            <th className="p-3">Applied Role</th>
            <th className="p-3">Application Date</th>
            <th className="p-3">Attachments</th>
          </tr>
        </thead>
        <tbody>
          {candidates.map((candidate) => (
            <tr 
              key={candidate.id} 
              className="text-center border-t border-gray-700 hover:bg-gray-800 cursor-pointer"
              onClick={() => onSelect(candidate)}
            >
              <td className="p-3">{candidate.name}</td>
              <td className="p-3">{candidate.rating} ⭐</td>
              <td className="p-3">{candidate.stages}</td>
              <td className="p-3">{candidate.role}</td>
              <td className="p-3">{candidate.application_date}</td>
              <td className="p-3">{candidate.files} file(s)</td>
            </tr>
          ))}
        </tbody>
      </table> */}
    </div>
  );
};

export default CandidateTable;
