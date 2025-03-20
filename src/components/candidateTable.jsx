import React, { useState, useEffect, useMemo } from "react";
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
  Avatar,
  Center,
  Spinner,
  Icon,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Select,
  Heading,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  DrawerHeader,
  DrawerBody,
  useDisclosure,
  Button,
  VStack,
  Circle,
} from "@chakra-ui/react";
import {
  StarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  AttachmentIcon,
  EmailIcon,
  PhoneIcon,
  CheckIcon,
  TimeIcon,
} from "@chakra-ui/icons";
import { fetchCandidates, filterCandidates, getCandidate, generateCandidatePDF } from "../api";

function generateMonthOptions() {
  const options = [];
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  // Generate options for the last 12 months
  for (let i = 0; i < 12; i++) {
    let month = currentMonth - i;
    let year = currentYear;
    
    if (month < 0) {
      month += 12;
      year -= 1;
    }

    const monthName = new Date(year, month).toLocaleString('default', { month: 'long' });
    const value = {
      month: month + 1, // API expects 1-12
      year: year
    };
    const label = `${monthName} ${year}`;
    
    options.push({ value, label });
  }

  return options;
}
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const CandidateTable = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);

  // Sorting state
  const [sortField, setSortField] = useState("");
  const [sortDirection, setSortDirection] = useState("asc");

  // Tabs
  const [tabIndex, setTabIndex] = useState(0);

  // Month-year filter
  const [monthYearFilter, setMonthYearFilter] = useState("");
  const monthOptions = generateMonthOptions();

  // Drawer state
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  // Load candidates on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchCandidates();
      setCandidates(data);
    } catch (err) {
      console.error("Error fetching candidates:", err);
    }
    setLoading(false);
  };

  // Reusable filter function
  const applyFilters = async (currentTab, currentMonthYear) => {
    setLoading(true);
    try {
      const filters = {
        status: currentTab === 1 ? 'Accepted' : currentTab === 2 ? 'Rejected' : undefined
      };

      // Add month and year if present
      if (currentMonthYear) {
        filters.month = currentMonthYear.month;
        filters.year = currentMonthYear.year;
      }
      
      const filteredData = await filterCandidates(filters);
      setCandidates(filteredData);
    } catch (err) {
      console.error("Error filtering candidates:", err);
    }
    setLoading(false);
  };

  const handleTabsChange = async (index) => {
    setTabIndex(index);
    
    // Build filters
    let filters = {};
    if (index === 1) {
      filters.status = "Accepted";
    } else if (index === 2) {
      filters.status = "Rejected";
    }

    // Add month and year if present
    if (monthYearFilter) {
      const [year, month] = monthYearFilter.split('-').map(Number);
      filters.month = month;
      filters.year = year;
    }

    setLoading(true);
    try {
      const filtered = await filterCandidates(filters);
      setCandidates(filtered);
    } catch (err) {
      console.error("Error filtering candidates:", err);
    }
    setLoading(false);
  };

  const handleMonthYearChange = async (e) => {
    const value = e.target.value;
    setMonthYearFilter(value);

    // Build filters
    let filters = {};
    if (tabIndex === 1) {
      filters.status = "Accepted";
    } else if (tabIndex === 2) {
      filters.status = "Rejected";
    }

    // Add month and year if a value was selected
    if (value) {
      const [year, month] = value.split('-').map(Number);
      filters.month = month;
      filters.year = year;
    }

    setLoading(true);
    try {
      const filtered = await filterCandidates(filters);
      setCandidates(filtered);
    } catch (err) {
      console.error("Error filtering by month:", err);
    }
    setLoading(false);
  };

  // Sorting
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedCandidates = useMemo(() => {
    if (!candidates || candidates.length === 0) {
      return [];
    }

    let sorted = [...candidates];
    if (sortField) {
      sorted.sort((a, b) => {
        let comparison = 0;
        
        if (sortField === "name") {
          comparison = a.name.localeCompare(b.name);
        } else if (sortField === "rating") {
          comparison = a.rating - b.rating;
        } else if (sortField === "stage") {
          comparison = a.stage.localeCompare(b.stage);
        } else if (sortField === "application_date") {
          comparison = new Date(a.application_date) - new Date(b.application_date);
        }
        
        return sortDirection === "asc" ? comparison : -comparison;
      });
    }
    
    return sorted;
  }, [candidates, sortField, sortDirection]);

  const SortIndicator = ({ field }) => {
    const isActive = sortField === field;
    const icon = isActive
      ? sortDirection === "asc"
        ? ArrowUpIcon
        : ArrowDownIcon
      : ArrowUpIcon;

    return (
      <Icon
        as={icon}
        w={3}
        h={3}
        ml={1}
        color="purple.400"
        opacity={isActive ? 1 : 0.3}
      />
    );
  };

  // Handle row click => open drawer
  const handleCandidateClick = async (candidateId) => {
    try {
      const c = candidates.find((cand) => cand.id === candidateId);
      setSelectedCandidate(c);
      onOpen();
    } catch (err) {
      console.error("Error fetching single candidate:", err);
    }
  };

  if (loading) {
    return (
      <Center h="200px">
        <Spinner size="xl" color="purple.400" thickness="4px" />
      </Center>
    );
  }

  return (
    <Box bg="#1E1E1E" p={{ base: 4, md: 6 }} borderRadius="md">
      {/* Header row with "Candidates" heading and Month-Year filter */}
      <Flex justify="space-between" align="center" mb={4}>
        <Heading size="lg" color="white">
          Candidates
        </Heading>
        <Select
          placeholder="Select Month"
          size="sm"
          bg="#2A2A2A"
          color="gray.400"
          borderRadius="full"
          border="none"
          w="fit-content"
          py={1}
          _focus={{ outline: "none", boxShadow: "0 0 0 2px #6E38E0" }}
          _hover={{ bg: "#333333", color: "white" }}
          value={monthYearFilter}
          onChange={handleMonthYearChange}
        >
          {monthOptions.map((opt) => (
            <option
              key={`${opt.value.year}-${opt.value.month}`}
              value={`${opt.value.year}-${opt.value.month}`}
              style={{ backgroundColor: "#1E1E1E", color: "#fff" }}
            >
              {opt.label}
            </option>
          ))}
        </Select>
      </Flex>

      {/* Tabs for All, Accepted, Rejected */}
      <Tabs
        index={tabIndex}
        onChange={handleTabsChange}
        color="white"
        variant="unstyled"
        mb={4}
      >
        <TabList>
          {["All", "Accepted", "Rejected"].map((label, idx) => (
            <Tab
              key={label}
              color="white"
              position="relative"
              pb={2}
              mr={4}
              _selected={{ fontWeight: "semibold" }}
              _after={{
                content: '""',
                position: "absolute",
                bottom: 0,
                left: 0,
                width: "100%",
                height: "2px",
                bgGradient: "linear(to-r, #6E38E0, #FF5F36)",
                opacity: tabIndex === idx ? 1 : 0,
                transition: "opacity 0.2s",
              }}
            >
              {label}
            </Tab>
          ))}
        </TabList>
      </Tabs>

      {/* Table container */}
      <Box overflowX="auto" borderRadius="lg" minH="400px">
        <Table variant="unstyled" size="md">
          <Thead>
            <Tr bg="#262626" borderTopRadius="lg">
              <Th
                color="#898989"
                fontSize="xs"
                py={3}
                borderTopLeftRadius="lg"
                textTransform="none"
                textAlign="center"
              >
                Candidate Name
              </Th>
              <Th
                color="#898989"
                fontSize="xs"
                py={3}
                textTransform="none"
                cursor="pointer"
                onClick={() => handleSort("rating")}
                textAlign="center"
              >
                <Flex align="center" justify="center">
                  Rating
                  <SortIndicator field="rating" />
                </Flex>
              </Th>
              <Th
                color="#898989"
                fontSize="xs"
                py={3}
                textTransform="none"
                cursor="pointer"
                onClick={() => handleSort("stage")}
                textAlign="center"
              >
                <Flex align="center" justify="center">
                  Stages
                  <SortIndicator field="stage" />
                </Flex>
              </Th>
              <Th
                color="#898989"
                fontSize="xs"
                py={3}
                textTransform="none"
                textAlign="center"
              >
                Applied Role
              </Th>
              <Th
                color="#898989"
                fontSize="xs"
                py={3}
                textTransform="none"
                cursor="pointer"
                onClick={() => handleSort("application_date")}
                textAlign="center"
              >
                <Flex align="center" justify="center">
                  Application Date
                  <SortIndicator field="application_date" />
                </Flex>
              </Th>
              <Th
                color="#898989"
                fontSize="xs"
                py={3}
                textTransform="none"
                textAlign="center"
                borderBottomRightRadius="lg"
              >
                Attachments
              </Th>
            </Tr>
          </Thead>
          <Tbody>
            {sortedCandidates.map((candidate, index) => (
              <Tr
                key={candidate.id}
                _hover={{ bg: "#2A2A2A", cursor: "pointer" }}
                position="relative"
                px={4}
                onClick={() => handleCandidateClick(candidate.id)}
                _after={{
                  content: '""',
                  position: "absolute",
                  left: "1rem",
                  right: "1rem",
                  bottom: 0,
                  height: "1px",
                  backgroundColor: "#333",
                  display:
                    index !== sortedCandidates.length - 1 ? "block" : "none",
                }}
              >
                <Td pt={3} pb={3} textAlign="center">
                  <Flex align="center" gap={3} justify="center">
                    <Avatar size="sm" name={candidate.name} />
                    <Text color="white">{candidate.name}</Text>
                  </Flex>
                </Td>
                <Td pt={3} pb={3} textAlign="center">
                  <Flex align="center" gap={1} justify="center">
                    <Icon as={StarIcon} color="yellow.400" boxSize={4} />
                    <Text color="white">{candidate.rating.toFixed(1)}</Text>
                  </Flex>
                </Td>
                <Td pt={3} pb={3} textAlign="center">
                  <Text color="white">{candidate.stage}</Text>
                </Td>
                <Td pt={3} pb={3} textAlign="center">
                  <Text color="white">{candidate.applied_role}</Text>
                </Td>
                <Td pt={3} pb={3} textAlign="center">
                  <Text color="white">{formatDate(candidate.application_date)}</Text>
                </Td>
                <Td pt={3} pb={3} textAlign="center">
                  <Flex align="center" justify="center">
                    <AttachmentIcon mr={1} color="gray.400" />
                    <Text color="white">{candidate.attachments} files</Text>
                  </Flex>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>

      {/* Candidate Detail Drawer */}
      <Drawer isOpen={isOpen} onClose={onClose} placement="right" size="md">
        <DrawerOverlay />
        <DrawerContent bg="#151515">
          <DrawerCloseButton color="white" />
          <DrawerHeader color="white">Candidate Details</DrawerHeader>
          <DrawerBody>
            {selectedCandidate ? (
              <Box color="white">
                {/* Profile Section */}
                <Box
                  w="full"
                  maxW="md"
                  bg="#1A1A1A"
                  borderRadius="lg"
                  py={3}
                  px={4}
                >
                  <VStack align="center" spacing={3}>
                    <Avatar
                      size="lg"
                      name={selectedCandidate.name}
                    />
                    <VStack spacing={1} mb={4}>
                      <Text fontSize="large" fontWeight="bold">
                        {selectedCandidate.name}
                      </Text>
                      <Text color="gray.500" fontSize="md">
                        {selectedCandidate.applied_role}
                      </Text>
                    </VStack>
                    
                    <Flex gap={12} justify="center">
                      <Box>
                        <Flex gap={3}>
                          <Icon as={EmailIcon} color="gray.500" boxSize={5} />
                          <Box>
                            <Text color="gray.500" fontSize="xs" letterSpacing="wide">
                              EMAIL
                            </Text>
                            <Text color="white" fontSize="sm">
                              {selectedCandidate.email}
                            </Text>
                          </Box>
                        </Flex>
                      </Box>
                      <Box>
                        <Flex gap={3}>
                          <Icon as={PhoneIcon} color="gray.500" boxSize={5} />
                          <Box>
                            <Text color="gray.500" fontSize="xs" letterSpacing="wide">
                              PHONE NUMBER
                            </Text>
                            <Text color="white" fontSize="sm">
                              {selectedCandidate.phone}
                            </Text>
                          </Box>
                        </Flex>
                      </Box>
                    </Flex>
                  </VStack>
                </Box>

                {/* Application Details */}
                <Box
                  w="full"
                  maxW="md"
                  bg="#1A1A1A"
                  borderRadius="lg"
                  p={6}
                  mt={8}
                  mb={8}
                >
                  <Text fontSize="xl" fontWeight="semibold" mb={6}>
                    Application Details
                  </Text>
                  <VStack spacing={0} align="stretch" position="relative">
                    {/* Vertical line */}
                    <Box
                      position="absolute"
                      left="15px"
                      top="30px"
                      bottom="30px"
                      width="2px"
                      bg="#333"
                      zIndex={0}
                    />
                    {[
                      { label: "Screening", date: "March 20, 2023" },
                      { label: "Design Challenge", date: "March 22, 2023" },
                      { label: "Interview" },
                      { label: "HR Round" },
                      { label: "Hired" }
                    ].map((stage, idx) => {
                      // Determine stage status based on selectedCandidate.stage
                      const currentStageIndex = ["Screening", "Design Challenge", "Interview", "HR Round", "Hired"]
                        .findIndex(s => s === selectedCandidate.stage);
                      
                      let status = "pending";
                      if (idx < currentStageIndex) {
                        status = "completed";
                      } else if (idx === currentStageIndex) {
                        status = "current";
                      }

                      return (
                        <Flex key={stage.label} align="flex-start" gap={4} py={3} position="relative">
                          <Circle
                            size="8"
                            bg={
                              status === "completed" ? "green.500" :
                              status === "current" ? "#FFB547" :
                              "#333"
                            }
                            zIndex={1}
                          >
                            {status === "completed" ? (
                              <CheckIcon color="white" boxSize={4} />
                            ) : (
                              <Text color="white" fontSize="sm">{idx + 1}</Text>
                            )}
                          </Circle>
                          <Box flex="1">
                            <Text fontSize="sm" color="white" mb={stage.date ? 1 : 0}>
                              {stage.label}
                            </Text>
                            {stage.date && (
                              <Text fontSize="xs" color="gray.400">
                                {stage.date}
                              </Text>
                            )}
                          </Box>
                          {status === "current" && (
                            <Box
                              bg="#2A2A2A"
                              px={3}
                              py={1}
                              borderRadius="full"
                              alignSelf="center"
                            >
                              <Text fontSize="xs" color="#FFB547">
                                Under Review
                              </Text>
                            </Box>
                          )}
                        </Flex>
                      );
                    })}
                  </VStack>
                </Box>

                {/* Experience */}
                <Box
                  w="full"
                  maxW="md"
                  bg="#1A1A1A"
                  borderRadius="lg"
                  p={6}
                  mt={8}
                  mb={8}
                >
                <Box mb={8}>
                  <Text fontSize="lg" fontWeight="semibold" mb={4}>
                    Experience
                  </Text>
                  
                    <Flex align="center" gap={3} mb={2}>
                      <Avatar size="sm" name="Airbnb" bg="red.500" />
                      <Box>
                        <Text fontWeight="medium">Airbnb</Text>
                        <Text fontSize="sm" color="gray.400">
                          Oct '20 - Present
                        </Text>
                      </Box>
                    </Flex>
                    <Text fontSize="sm" color="gray.400">
                      Led the redesign of the booking process for Airbnb's
                      mobile app, resulting in a 36% increase in conversion
                      rates and improved user satisfaction.
                    </Text>
                </Box>
                </Box>

                {/* Action Buttons */}
                <Flex gap={3}>
                  <Button
                    flex="1"
                    bgGradient="linear(to-r, #6E38E0, #FF5F36)"
                    color="white"
                    _hover={{ opacity: 0.9 }}
                    rightIcon={<ArrowUpIcon transform="rotate(45deg)" />}
                    borderRadius="none"
                  >
                    Move to Next Step
                  </Button>
                  <Button
                    bgGradient="linear(to-r, #38E0AE, #AF36FF)"
                    color="white"
                    _hover={{ opacity: 0.9 }}
                    borderRadius="none"
                  >
                    Reject
                  </Button>
                  <Button
                    bgGradient="linear(to-r, #E03838, #FFA836)"
                    color="white"
                    _hover={{ opacity: 0.9 }}
                    borderRadius="none"
                    isLoading={pdfLoading}
                    onClick={async () => {
                      setPdfLoading(true);
                      try {
                        const blob = await generateCandidatePDF(selectedCandidate.id);
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${selectedCandidate.name.replace(/\s+/g, '_')}_details.pdf`;
                        document.body.appendChild(a);
                        a.click();
                        window.URL.revokeObjectURL(url);
                        document.body.removeChild(a);
                      } catch (err) {
                        console.error("Error generating PDF:", err);
                      } finally {
                        setPdfLoading(false);
                      }
                    }}
                  >
                    PDF
                  </Button>
                </Flex>
              </Box>
            ) : (
              <Center h="full">
                <Spinner size="lg" />
              </Center>
            )}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  );
};

export default CandidateTable;
