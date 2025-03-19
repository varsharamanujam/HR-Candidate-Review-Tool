import React, { useState, useEffect } from "react";
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Flex,
  Text,
  Heading,
  Center,
  Spinner,
  Icon,
} from "@chakra-ui/react";
import { StarIcon, ArrowUpIcon, ArrowDownIcon } from "@chakra-ui/icons";
import { fetchCandidates } from "../api"; // Your API function to fetch candidate data

const CandidateTable = () => {
  // STATE: raw candidate data and sorted candidate data.
  const [candidates, setCandidates] = useState([]);
  const [sortedCandidates, setSortedCandidates] = useState([]);
  // STATE: loading flag.
  const [loading, setLoading] = useState(true);
  // STATE: sorting field and direction.
  const [sortField, setSortField] = useState("");
  const [sortDirection, setSortDirection] = useState("asc");

  // FETCH DATA: When the component mounts, fetch candidates from the API.
  useEffect(() => {
    const loadCandidates = async () => {
      try {
        const data = await fetchCandidates();
        setCandidates(data);
        setSortedCandidates(data);
      } catch (error) {
        console.error("Error fetching candidates:", error);
      }
      setLoading(false);
    };
    loadCandidates();
  }, []);

  // SORTING: When sortField, sortDirection, or candidates changes, sort the data.
  useEffect(() => {
    if (sortField) {
      const sorted = [...candidates].sort((a, b) => {
        let comparison = 0;
        if (sortField === "name") {
          comparison = a.name.localeCompare(b.name);
        } else if (sortField === "rating") {
          comparison = a.rating - b.rating;
        } else if (sortField === "stage") {
          comparison = a.stage.localeCompare(b.stage);
        } else if (sortField === "applied_role") {
          comparison = a.applied_role.localeCompare(b.applied_role);
        } else if (sortField === "application_date") {
          comparison = new Date(a.application_date) - new Date(b.application_date);
        }
        return sortDirection === "asc" ? comparison : -comparison;
      });
      setSortedCandidates(sorted);
    } else {
      setSortedCandidates(candidates);
    }
  }, [sortField, sortDirection, candidates]);

  // HANDLE SORT: Clicking on a header sets/toggles the sort field/direction.
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // SORT INDICATOR: Always display an arrow. If the column is active, show the correct arrow with full opacity.
  // If not, show an up arrow with lower opacity.
  const SortIndicator = ({ field }) => (
    <Icon
      as={sortField === field ? (sortDirection === "asc" ? ArrowUpIcon : ArrowDownIcon) : ArrowUpIcon}
      w={3}
      h={3}
      ml={1}
      color="purple.400"
      opacity={sortField === field ? 1 : 0.3}
    />
  );

  // HELPER: Format the date as DD/MM/YY.
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${String(date.getDate()).padStart(2, "0")}/${String(
      date.getMonth() + 1
    ).padStart(2, "0")}/${date.getFullYear().toString().substring(2)}`;
  };

  // If still loading, show a spinner.
  if (loading) {
    return (
      <Center h="200px">
        <Spinner size="xl" color="purple.400" thickness="4px" />
      </Center>
    );
  }

  // RENDER: Display the table with headers and sorted candidate rows.
  return (
    <Box bg="#151515" p={6} borderRadius="md">
      <Heading size="lg" color="white" mb={6}>
        Candidates
      </Heading>
      <Box overflowX="auto">
        <Table variant="simple" size="md">
          <Thead>
            <Tr bg="#242424">
              <Th color="white" fontSize="xs" cursor="pointer" onClick={() => handleSort("name")}>
                <Flex align="center">
                  Candidate Name
                  <SortIndicator field="name" />
                </Flex>
              </Th>
              <Th color="white" fontSize="xs" cursor="pointer" onClick={() => handleSort("rating")}>
                <Flex align="center">
                  Rating
                  <SortIndicator field="rating" />
                </Flex>
              </Th>
              <Th color="white" fontSize="xs" cursor="pointer" onClick={() => handleSort("stage")}>
                <Flex align="center">
                  Stage
                  <SortIndicator field="stage" />
                </Flex>
              </Th>
              <Th color="white" fontSize="xs" cursor="pointer" onClick={() => handleSort("applied_role")}>
                <Flex align="center">
                  Applied Role
                  <SortIndicator field="applied_role" />
                </Flex>
              </Th>
              <Th color="white" fontSize="xs" cursor="pointer" onClick={() => handleSort("application_date")}>
                <Flex align="center">
                  Application Date
                  <SortIndicator field="application_date" />
                </Flex>
              </Th>
              {/* Attachments column is not sortable */}
              <Th color="white" fontSize="xs">
                <Flex align="center">Attachments</Flex>
              </Th>
            </Tr>
          </Thead>
          <Tbody>
            {sortedCandidates.map((candidate) => (
              <Tr key={candidate.id} _hover={{ bg: "#2A2A2A" }}>
                <Td color="white">{candidate.name}</Td>
                <Td color="white">
                  <Flex align="center">
                    <StarIcon color="yellow.400" mr="1" />
                    <Text>{candidate.rating.toFixed(1)}</Text>
                  </Flex>
                </Td>
                <Td color="white">{candidate.stage}</Td>
                <Td color="white">{candidate.applied_role}</Td>
                <Td color="white">{formatDate(candidate.application_date)}</Td>
                <Td color="white">
                  <Flex align="center">{candidate.attachments} files</Flex>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>
    </Box>
  );
};

export default CandidateTable;
