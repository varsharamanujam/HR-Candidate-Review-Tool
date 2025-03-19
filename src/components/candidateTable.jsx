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
  Avatar,
  Center,
  Spinner,
  Icon,
} from "@chakra-ui/react";
import { StarIcon, ArrowUpIcon, ArrowDownIcon } from "@chakra-ui/icons";
import { fetchCandidates } from "../api";

const CandidateTable = () => {
  // STATE: raw candidate data and a loading flag.
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);

  // STATE: sorting field and direction.
  const [sortField, setSortField] = useState("");
  const [sortDirection, setSortDirection] = useState("asc");

  // STATE: sorted candidate data.
  const [sortedCandidates, setSortedCandidates] = useState([]);

  // FETCH DATA: When the component mounts, fetch candidate data from the API.
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

  // SORTING: When candidates or the sort settings change, sort the data.
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
      // If no sort field is set, display the data as is.
      setSortedCandidates(candidates);
    }
  }, [sortField, sortDirection, candidates]);

  // HANDLE SORT: Clicking on a header toggles the sort direction or sets a new sort field.
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // SORT INDICATOR: Always show an arrow; if this column is active, use full opacity and show the correct arrow.
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

  // HELPER: Format date as DD/MM/YY.
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear().toString().substring(2)}`;
  };

  if (loading) {
    return (
      <Center h="200px">
        <Spinner size="xl" color="purple.400" thickness="4px" />
      </Center>
    );
  }

  // RENDER: Display a heading and the table with sorted candidate rows.
  return (
    <Box bg="#151515" p={6} borderRadius="md">
      <Heading size="lg" color="white" mb={6}>
        Candidates
      </Heading>
      <Box overflowX="auto">
        <Table variant="simple" size="md">
          <Thead>
            <Tr>
              {/* Sortable columns */}
              <Th
                color="gray.500"
                fontSize="xs"
                textTransform="uppercase"
                cursor="pointer"
                onClick={() => handleSort("name")}
              >
                <Flex align="center">
                  Candidate Name <SortIndicator field="name" />
                </Flex>
              </Th>
              <Th
                color="gray.500"
                fontSize="xs"
                textTransform="uppercase"
                cursor="pointer"
                onClick={() => handleSort("rating")}
              >
                <Flex align="center">
                  Rating <SortIndicator field="rating" />
                </Flex>
              </Th>
              <Th
                color="gray.500"
                fontSize="xs"
                textTransform="uppercase"
                cursor="pointer"
                onClick={() => handleSort("stage")}
              >
                <Flex align="center">
                  Stages <SortIndicator field="stage" />
                </Flex>
              </Th>
              <Th
                color="gray.500"
                fontSize="xs"
                textTransform="uppercase"
                cursor="pointer"
                onClick={() => handleSort("applied_role")}
              >
                <Flex align="center">
                  Applied Role <SortIndicator field="applied_role" />
                </Flex>
              </Th>
              <Th
                color="gray.500"
                fontSize="xs"
                textTransform="uppercase"
                cursor="pointer"
                onClick={() => handleSort("application_date")}
              >
                <Flex align="center">
                  Application Date <SortIndicator field="application_date" />
                </Flex>
              </Th>
              {/* Non-sortable column */}
              <Th color="gray.500" fontSize="xs" textTransform="uppercase">
                Attachments
              </Th>
            </Tr>
          </Thead>
          <Tbody>
            {sortedCandidates.map((candidate) => (
              <Tr key={candidate.id} _hover={{ bg: "#1A1A1A" }}>
                <Td>
                  <Flex align="center" gap={3}>
                    <Avatar size="sm" name={candidate.name} />
                    <Text color="white">{candidate.name}</Text>
                  </Flex>
                </Td>
                <Td>
                  <Flex align="center" gap={1}>
                    <StarIcon color="yellow.400" boxSize={4} />
                    <Text color="white">{candidate.rating.toFixed(1)}</Text>
                  </Flex>
                </Td>
                <Td>
                  <Text color="white">{candidate.stage}</Text>
                </Td>
                <Td>
                  <Text color="white">{candidate.applied_role}</Text>
                </Td>
                <Td>
                  <Text color="white">{formatDate(candidate.application_date)}</Text>
                </Td>
                <Td>
                  <Text color="white">{candidate.attachments} files</Text>
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
