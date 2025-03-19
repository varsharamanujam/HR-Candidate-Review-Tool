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
  Spinner,
  Center,
  useBreakpointValue,
  Icon,
} from "@chakra-ui/react";
import { StarIcon, ArrowUpIcon, ArrowDownIcon } from "@chakra-ui/icons";
import { fetchCandidates } from "../api"; // Import your API function

// The candidateList component now fetches candidates from the backend API.
const CandidateList = ({ onSelect }) => {
  // Color variables
  const bgColor = "#151515";
  const tableBgColor = "#1E1E1E";
  const headerBgColor = "#242424";
  const borderColor = "#333333";
  const hoverBg = "#2A2A2A";
  const primaryColor = "#6E38E0";

  // State variables
  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");
  const [displayCandidates, setDisplayCandidates] = useState([]);
  const [loading, setLoading] = useState(true);

  // Function to sort candidates in the same way as before
  const sortCandidates = (candidates, field, direction) => {
    return [...candidates].sort((a, b) => {
      let comparison = 0;

      if (field === "name") {
        comparison = a.name.localeCompare(b.name);
      } else if (field === "rating") {
        comparison = a.rating - b.rating;
      } else if (field === "stage") {
        comparison = a.stage.localeCompare(b.stage);
      } else if (field === "applied_role") {
        comparison = a.applied_role.localeCompare(b.applied_role);
      } else if (field === "application_date") {
        comparison = new Date(a.application_date) - new Date(b.application_date);
      } else if (field === "attachments") {
        comparison = a.attachments - b.attachments;
      }
      return direction === "asc" ? comparison : -comparison;
    });
  };

  // Handle sort indicator rendering
  const SortIndicator = ({ field }) => {
    const isActive = sortField === field;
    return (
      <Box ml={1} opacity={isActive ? 1 : 0.3}>
        <Icon
          as={sortDirection === "asc" ? ArrowUpIcon : ArrowDownIcon}
          w={3}
          h={3}
          color={isActive ? primaryColor : "gray.400"}
        />
      </Box>
    );
  };

  // Helper to get a color for each stage
  const getStageColor = (stage) => {
    switch (stage) {
      case "Screening":
        return "#3182CE";
      case "HR Round":
        return "#805AD5";
      case "Technical Round":
        return "#DD6B20";
      case "Design Challenge":
        return "#D53F8C";
      case "Round 2 Interview":
        return "#00B5D8";
      case "Rejected":
        return "#E53E3E";
      case "Selected":
        return "#38A169";
      default:
        return "#718096";
    }
  };

  // Helper to format dates (DD/MM/YY)
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${String(date.getDate()).padStart(2, "0")}/${String(
      date.getMonth() + 1
    ).padStart(2, "0")}/${date.getFullYear().toString().substring(2)}`;
  };

  // Fetch candidates from API on component mount or when sorting changes.
  useEffect(() => {
    const loadCandidates = async () => {
      setLoading(true);
      try {
        // Call the API to fetch candidate data.
        const data = await fetchCandidates();
        // Sort the fetched data
        const sorted = sortCandidates(data, sortField, sortDirection);
        setDisplayCandidates(sorted);
      } catch (error) {
        console.error("Error fetching candidates:", error);
      }
      setLoading(false);
    };

    loadCandidates();
  }, [sortField, sortDirection]);

  // Handle sort when header is clicked
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  if (loading) {
    return (
      <Center h="200px">
        <Spinner size="xl" color={primaryColor} thickness="4px" />
      </Center>
    );
  }

  return (
    <Box bg={bgColor} p={{ base: 3, md: 6 }} borderRadius="md">
      <Heading size="lg" fontFamily="urbanist" mb={6}>
        Candidates
      </Heading>

      <Box overflowX="auto" borderRadius="md" className="candidate-table-container">
        <Table variant="simple" size="md">
          <Thead>
            <Tr bg={headerBgColor}>
              <Th
                fontFamily="urbanist"
                color="white"
                cursor="pointer"
                onClick={() => handleSort("name")}
                textTransform="uppercase"
                fontSize="xs"
                borderColor={borderColor}
                _hover={{ bg: hoverBg }}
              >
                <Flex align="center">
                  Candidate Name
                  <SortIndicator field="name" />
                </Flex>
              </Th>
              <Th
                fontFamily="urbanist"
                color="white"
                cursor="pointer"
                onClick={() => handleSort("rating")}
                textTransform="uppercase"
                fontSize="xs"
                borderColor={borderColor}
                _hover={{ bg: hoverBg }}
              >
                <Flex align="center">
                  Rating
                  <SortIndicator field="rating" />
                </Flex>
              </Th>
              <Th
                fontFamily="urbanist"
                color="white"
                cursor="pointer"
                onClick={() => handleSort("stage")}
                textTransform="uppercase"
                fontSize="xs"
                borderColor={borderColor}
                _hover={{ bg: hoverBg }}
              >
                <Flex align="center">
                  Stages
                  <SortIndicator field="stage" />
                </Flex>
              </Th>
              <Th
                fontFamily="urbanist"
                color="white"
                cursor="pointer"
                onClick={() => handleSort("applied_role")}
                textTransform="uppercase"
                fontSize="xs"
                borderColor={borderColor}
                _hover={{ bg: hoverBg }}
              >
                <Flex align="center">
                  Applied Role
                  <SortIndicator field="applied_role" />
                </Flex>
              </Th>
              <Th
                fontFamily="urbanist"
                color="white"
                display={useBreakpointValue({ base: "none", md: "table-cell" })}
                cursor="pointer"
                onClick={() => handleSort("application_date")}
                textTransform="uppercase"
                fontSize="xs"
                borderColor={borderColor}
                _hover={{ bg: hoverBg }}
              >
                <Flex align="center">
                  Application Date
                  <SortIndicator field="application_date" />
                </Flex>
              </Th>
              <Th
                fontFamily="urbanist"
                color="white"
                display={useBreakpointValue({ base: "none", lg: "table-cell" })}
                cursor="pointer"
                onClick={() => handleSort("attachments")}
                textTransform="uppercase"
                fontSize="xs"
                borderColor={borderColor}
                _hover={{ bg: hoverBg }}
              >
                <Flex align="center">
                  Attachments
                  <SortIndicator field="attachments" />
                </Flex>
              </Th>
            </Tr>
          </Thead>
          <Tbody bg={tableBgColor}>
            {displayCandidates.map((candidate) => (
              <Tr
                key={candidate.id}
                _hover={{ bg: hoverBg }}
                className="candidate-row"
                onClick={() => onSelect && onSelect(candidate)}
              >
                <Td fontFamily="urbanist" borderColor={borderColor}>
                  <Flex align="center" gap="3">
                    <Box
                      w="8"
                      h="8"
                      borderRadius="full"
                      bg="gray.600"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      fontWeight="medium"
                    >
                      {candidate.name.charAt(0)}
                    </Box>
                    <Text fontWeight="medium">{candidate.name}</Text>
                  </Flex>
                </Td>
                <Td fontFamily="urbanist" borderColor={borderColor}>
                  <Flex align="center">
                    <StarIcon color="yellow.400" mr="1" />
                    <Text>{candidate.rating.toFixed(1)}</Text>
                  </Flex>
                </Td>
                <Td fontFamily="urbanist" borderColor={borderColor}>
                  <Text color={getStageColor(candidate.stage)}>
                    {candidate.stage}
                  </Text>
                </Td>
                <Td fontFamily="urbanist" borderColor={borderColor}>
                  {candidate.applied_role}
                </Td>
                <Td
                  fontFamily="urbanist"
                  display={useBreakpointValue({ base: "none", md: "table-cell" })}
                  borderColor={borderColor}
                >
                  {formatDate(candidate.application_date)}
                </Td>
                <Td
                  fontFamily="urbanist"
                  display={useBreakpointValue({ base: "none", lg: "table-cell" })}
                  borderColor={borderColor}
                >
                  <Flex align="center">
                    {candidate.attachments} files
                  </Flex>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>
    </Box>
  );
};

export default CandidateList;