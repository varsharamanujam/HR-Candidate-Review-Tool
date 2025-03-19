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

// Mock data for candidates
const mockCandidates = [
  {
    id: 1,
    name: "Charlie Kristen",
    email: "charlie@example.com",
    rating: 4.0,
    stage: "Design Challenge",
    applied_role: "Sr. UX Designer",
    application_date: "2023-02-12",
    attachments: 3,
    status: "In Process"
  },
  {
    id: 2,
    name: "Malaika Brown",
    email: "malaika@example.com",
    rating: 3.5,
    stage: "Screening",
    applied_role: "Growth Manager",
    application_date: "2023-02-18",
    attachments: 1,
    status: "In Process"
  },
  {
    id: 3,
    name: "Simon Minter",
    email: "simon@example.com",
    rating: 2.8,
    stage: "Design Challenge",
    applied_role: "Financial Analyst",
    application_date: "2023-01-04",
    attachments: 2,
    status: "In Process"
  },
  {
    id: 4,
    name: "Ashley Brooke",
    email: "ashley@example.com",
    rating: 4.5,
    stage: "HR Round",
    applied_role: "Financial Analyst",
    application_date: "2023-03-05",
    attachments: 3,
    status: "Selected"
  },
  {
    id: 5,
    name: "Nishant Talwar",
    email: "nishant@example.com",
    rating: 5.0,
    stage: "Round 2 Interview",
    applied_role: "Sr. UX Designer",
    application_date: "2022-12-24",
    attachments: 2,
    status: "Selected"
  },
  {
    id: 6,
    name: "Mark Jacobs",
    email: "mark@example.com",
    rating: 2.0,
    stage: "Rejected",
    applied_role: "Growth Manager",
    application_date: "2023-02-13",
    attachments: 1,
    status: "Rejected"
  }
];

const CandidateList = ({ candidates = null, onSelect }) => {
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

  // Use mock data if no candidates provided
  useEffect(() => {
    setLoading(true);
    const dataToUse = candidates?.length > 0 ? candidates : mockCandidates;
    const sorted = sortCandidates(dataToUse, sortField, sortDirection);
    setDisplayCandidates(sorted);
    setLoading(false);
  }, [candidates, sortField, sortDirection]);

  // Handle sort action
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Sort the candidates
  const sortCandidates = (candidates, field, direction) => {
    return [...candidates].sort((a, b) => {
      let comparison = 0;
      
      if (field === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (field === 'rating') {
        comparison = a.rating - b.rating;
      } else if (field === 'stage') {
        comparison = a.stage.localeCompare(b.stage);
      } else if (field === 'applied_role') {
        comparison = a.applied_role.localeCompare(b.applied_role);
      } else if (field === 'application_date') {
        comparison = new Date(a.application_date) - new Date(b.application_date);
      } else if (field === 'attachments') {
        comparison = a.attachments - b.attachments;
      }
      
      return direction === 'asc' ? comparison : -comparison;
    });
  };

  // Sort indicator component
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

  // Get color for stage badge
  const getStageColor = (stage) => {
    switch(stage) {
      case 'Screening': return '#3182CE';
      case 'HR Round': return '#805AD5';
      case 'Technical Round': return '#DD6B20';
      case 'Design Challenge': return '#D53F8C';
      case 'Round 2 Interview': return '#00B5D8';
      case 'Rejected': return '#E53E3E';
      case 'Selected': return '#38A169';
      default: return '#718096';
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${(date.getDate()).toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear().toString().substring(2)}`;
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
                <Td fontFamily="urbanist" borderColor={borderColor}>{candidate.applied_role}</Td>
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