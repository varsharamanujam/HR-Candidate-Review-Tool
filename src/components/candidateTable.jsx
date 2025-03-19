import React, { useState, useEffect } from "react";
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Flex,
  Text,
  Button,
  Heading,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Spinner,
  Center,
  useBreakpointValue,
  Icon,
  Divider
} from "@chakra-ui/react";
import { 
  StarIcon, 
  SearchIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from "@chakra-ui/icons";
import { updateCandidateStatus } from "../api";
import { saveAs } from "file-saver";

// Sample data to match the screenshot
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

// Generate all months for the last 2 years
const generateMonthOptions = () => {
  const options = [];
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  
  for (let year = currentYear; year >= currentYear - 2; year--) {
    for (let month = 11; month >= 0; month--) {
      // Skip future months in current year
      if (year === currentYear && month > currentDate.getMonth()) continue;
      
      const date = new Date(year, month, 1);
      const monthName = date.toLocaleString('default', { month: 'long' });
      options.push({
        value: `${year}-${month+1}`,
        label: `${monthName} ${year}`
      });
    }
  }
  return options;
};

// API function for sorting
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

const CandidateTable = ({ refreshData }) => {
  // Color variables
  const bgColor = "#151515"; // Page bg
  const tableBgColor = "#1E1E1E"; // Table bg
  const headerBgColor = "#898989"; // Header row bg
  const gradient = "linear-gradient(90deg, #6E38E0 0%, #FF5F36 100%)";
  const borderColor = "gray.700";
  const inputBg = "gray.800";
  const hoverBg = "gray.800";

  // State variables for filters
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [filteredCandidates, setFilteredCandidates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [allCandidates, setAllCandidates] = useState(mockCandidates);
  const [tabIndex, setTabIndex] = useState(0);

  // State variables for sorting
  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");
  
  // Month/year filter
  const monthOptions = generateMonthOptions();
  const [monthYearFilter, setMonthYearFilter] = useState(monthOptions[0]?.value || "");

  const applyFilters = () => {
    setIsLoading(true);
    let filtered = [...allCandidates];

    // Filter by tab selection
    if (tabIndex === 1) {
      filtered = filtered.filter(candidate => candidate.status === "Selected");
    } else if (tabIndex === 2) {
      filtered = filtered.filter(candidate => candidate.status === "Rejected");
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (candidate) =>
          candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          candidate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          candidate.applied_role.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply role filter
    if (roleFilter) {
      filtered = filtered.filter(
        (candidate) => candidate.applied_role === roleFilter
      );
    }

    // Apply stage filter
    if (stageFilter) {
      filtered = filtered.filter(
        (candidate) => candidate.stage === stageFilter
      );
    }
    
    // Apply month/year filter
    if (monthYearFilter) {
      const [year, month] = monthYearFilter.split('-').map(Number);
      
      filtered = filtered.filter(candidate => {
        const candidateDate = new Date(candidate.application_date);
        return candidateDate.getFullYear() === year && 
               candidateDate.getMonth() === month - 1;
      });
    }

    // Apply sorting
    filtered = sortCandidates(filtered, sortField, sortDirection);

    setFilteredCandidates(filtered);
    setIsLoading(false);
  };

  // Handle sorting when a column header is clicked
  const handleSort = (field) => {
    if (sortField === field) {
      // Toggle direction if same field clicked
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Set new field and default to ascending
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Sort indicator component
  const SortIndicator = ({ field }) => {
    if (sortField !== field) return null;
    
    return sortDirection === "asc" ? (
      <Icon as={ArrowUpIcon} w={3} h={3} ml={1} />
    ) : (
      <Icon as={ArrowDownIcon} w={3} h={3} ml={1} />
    );
  };

  useEffect(() => {
    applyFilters();
  }, [searchTerm, roleFilter, stageFilter, sortField, sortDirection, tabIndex, monthYearFilter]);

  const handleTabsChange = (index) => {
    setTabIndex(index);
  };

  const handleUpdateStatus = async (candidateId, newStatus) => {
    try {
      await updateCandidateStatus(candidateId, { status: newStatus });
      
      // Update local state optimistically
      const updatedCandidates = allCandidates.map(c => 
        c.id === candidateId ? {...c, status: newStatus} : c
      );
      setAllCandidates(updatedCandidates);
      
      // Reapply filters
      applyFilters();
      
      if (refreshData) refreshData();
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const getStageColor = (stage) => {
    switch(stage) {
      case 'Screening':
        return 'blue';
      case 'HR Round':
        return 'purple';
      case 'Technical Round':
        return 'orange';
      case 'Design Challenge':
        return 'pink';
      case 'Round 2 Interview':
        return 'cyan';
      case 'Rejected':
        return 'red';
      case 'Selected':
        return 'green';
      default:
        return 'gray';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${(date.getDate()).toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear().toString().substring(2)}`;
  };

  return (
    <Box bg={bgColor} p={6} borderRadius="md" height="100%">
      <Flex 
        justify="space-between" 
        align={{ base: "start", md: "center" }}
        mb={4}
        flexDir={{ base: "column", md: "row" }}
        gap={4}
      >
        <Heading size="lg" fontFamily="urbanist">
          Candidates
        </Heading>
        
        <Select
          bg={inputBg}
          border="none"
          size="sm"
          w={{ base: "full", md: "200px" }}
          value={monthYearFilter}
          onChange={(e) => setMonthYearFilter(e.target.value)}
          fontFamily="urbanist"
        >
          <option value="">All dates</option>
          {monthOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </Flex>

      <Tabs isLazy index={tabIndex} onChange={handleTabsChange} position="relative">
        <TabList position="relative" mb={4}>
          <Tab
            _selected={{ color: "#6E38E0", fontWeight: "semibold" }}
            fontFamily="urbanist"
          >
            All
          </Tab>
          <Tab
            _selected={{ color: "#6E38E0", fontWeight: "semibold" }}
            fontFamily="urbanist"
          >
            Accepted
          </Tab>
          <Tab
            _selected={{ color: "#6E38E0", fontWeight: "semibold" }}
            fontFamily="urbanist"
          >
            Rejected
          </Tab>
          {/* Gradient line below tabs */}
          <Box 
            position="absolute" 
            bottom="0"
            left="0"
            height="2px"
            width="100%"
            bgGradient={gradient}
          />
        </TabList>

        <TabPanels>
          <TabPanel p={0}>
            {renderCandidateTable()}
          </TabPanel>
          <TabPanel p={0}>
            {renderCandidateTable()}
          </TabPanel>
          <TabPanel p={0}>
            {renderCandidateTable()}
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );

  function renderCandidateTable() {
    if (isLoading) {
      return (
        <Center h="200px">
          <Spinner size="xl" color="#6E38E0" thickness="4px" />
        </Center>
      );
    }

    if (filteredCandidates.length === 0) {
      return (
        <Center h="200px">
          <Text color="gray.400" fontFamily="urbanist">No candidates match your filters</Text>
        </Center>
      );
    }

    return (
      <Box overflowX="auto" borderRadius="md">
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
              >
                <Flex align="center">
                  Attachments
                  <SortIndicator field="attachments" />
                </Flex>
              </Th>
            </Tr>
          </Thead>
          <Tbody bg={tableBgColor}>
            {filteredCandidates.map((candidate) => (
              <Tr key={candidate.id} _hover={{ bg: hoverBg }}>
                <Td fontFamily="urbanist">
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
                <Td fontFamily="urbanist">
                  <Flex align="center">
                    <StarIcon color="yellow" mr="1" />
                    <Text>{candidate.rating.toFixed(1)}</Text>
                  </Flex>
                </Td>
                <Td fontFamily="urbanist">
                  <Text color={`${getStageColor(candidate.stage)}.400`}>
                    {candidate.stage}
                  </Text>
                </Td>
                <Td fontFamily="urbanist">{candidate.applied_role}</Td>
                <Td fontFamily="urbanist" display={useBreakpointValue({ base: "none", md: "table-cell" })}>
                  {formatDate(candidate.application_date)}
                </Td>
                <Td fontFamily="urbanist" display={useBreakpointValue({ base: "none", lg: "table-cell" })}>
                  <Flex align="center">
                    {candidate.attachments} files
                  </Flex>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>
    );
  }
};

export default CandidateTable;
