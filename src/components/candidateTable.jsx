/**
 * @fileoverview CandidateTable Component
 *
 * A comprehensive table component for displaying and managing candidate information.
 * Features include:
 * - Sortable columns for candidate data
 * - Filtering by status (via tabs) and by month-year
 * - Detailed candidate profile view in a drawer with additional sections
 * - PDF generation for candidate details
 * - Print-friendly dark mode styling (prints the entire drawer)
 *
 * @requires React
 * @requires @chakra-ui/react
 * @requires @chakra-ui/icons
 */

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
  Tab,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  DrawerHeader,
  DrawerBody,
  useDisclosure,
  Button,
  VStack,
  Select,
  Heading,
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
  ArrowForwardIcon,
} from "@chakra-ui/icons";
import { fetchCandidates, filterCandidates, generateCandidatePDF } from "../api";

// Utility: Generate options for the last 12 months
function generateMonthOptions() {
  const options = [];
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  for (let i = 0; i < 12; i++) {
    let month = currentMonth - i;
    let year = currentYear;
    if (month < 0) {
      month += 12;
      year -= 1;
    }
    const monthName = new Date(year, month).toLocaleString("default", { month: "long" });
    options.push({ value: `${year}-${String(month + 1).padStart(2, "0")}`, label: `${monthName} ${year}` });
  }
  return options;
}

const monthOptions = generateMonthOptions();

// Utility: Format a date string
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

const CandidateTable = ({ candidates: initialCandidates, onSelect }) => {
  const [candidates, setCandidates] = useState(initialCandidates || []);
  const [loading, setLoading] = useState(!initialCandidates);

  // Sorting state (default sort: application_date descending)
  const [sortField, setSortField] = useState("application_date");
  const [sortDirection, setSortDirection] = useState("desc");

  // Tabs state: 0 = All, 1 = Accepted, 2 = Rejected
  const [tabIndex, setTabIndex] = useState(0);

  // Month-year filter state
  const [monthYearFilter, setMonthYearFilter] = useState("");

  // Drawer state for candidate details
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  // PDF loading state
  const [pdfLoading, setPdfLoading] = useState(false);

  // Load candidates if not provided via props
  useEffect(() => {
    if (!initialCandidates) {
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
      loadData();
    }
  }, [initialCandidates]);

  // Handler for month-year filter
  const handleMonthYearChange = async (e) => {
    const value = e.target.value;
    setMonthYearFilter(value);
    let filters = {};
    if (tabIndex === 1) filters.status = "Accepted";
    else if (tabIndex === 2) filters.status = "Rejected";
    if (value) filters.month_year = value;
    setLoading(true);
    try {
      const filtered = await filterCandidates(filters);
      setCandidates(filtered);
    } catch (err) {
      console.error("Error filtering candidates by month:", err);
    }
    setLoading(false);
  };

  // Handler for tab change
  const handleTabsChange = async (index) => {
    setTabIndex(index);
    let filters = {};
    if (index === 1) filters.status = "Accepted";
    else if (index === 2) filters.status = "Rejected";
    if (monthYearFilter) filters.month_year = monthYearFilter;
    setLoading(true);
    try {
      const filtered = await filterCandidates(filters);
      setCandidates(filtered);
    } catch (err) {
      console.error("Error filtering candidates:", err);
    }
    setLoading(false);
  };

  // Sorting candidates
  const sortedCandidates = useMemo(() => {
    if (!candidates || candidates.length === 0) return [];
    let sorted = [...candidates];
    if (sortField) {
      sorted.sort((a, b) => {
        let comparison = 0;
        if (sortField === "name") comparison = a.name.localeCompare(b.name);
        else if (sortField === "rating") comparison = a.rating - b.rating;
        else if (sortField === "stage") comparison = a.stage.localeCompare(b.stage);
        else if (sortField === "application_date") comparison = new Date(a.application_date) - new Date(b.application_date);
        return sortDirection === "asc" ? comparison : -comparison;
      });
    }
    return sorted;
  }, [candidates, sortField, sortDirection]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const SortIndicator = ({ field }) => {
    const isActive = sortField === field;
    const icon = isActive && sortDirection === "asc" ? ArrowUpIcon : ArrowDownIcon;
    return <Icon as={icon} w={3} h={3} ml={1} color="purple.400" opacity={isActive ? 1 : 0.3} />;
  };

  // Open drawer when a row is clicked
  const handleCandidateClick = (candidateId) => {
    const candidate = candidates.find((cand) => cand.id === candidateId);
    if (candidate) {
      setSelectedCandidate(candidate);
      onOpen();
      if (onSelect) onSelect(candidate);
    }
  };

  // PDF generation handler
  const handleGeneratePDF = async () => {
    setPdfLoading(true);
    try {
      const blob = await generateCandidatePDF(selectedCandidate.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${selectedCandidate.name.replace(/\s+/g, "_")}_details.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Error generating PDF:", err);
    } finally {
      setPdfLoading(false);
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
    <Box bg="#1E1E1E" p={{ base: 4, md: 6 }} borderRadius="md" className="main-table-container">
      {/* Header: Title and Month Filter */}
      <Flex justify="space-between" align="center" mb={4}>
        <Heading size="lg" color="white">Candidates</Heading>
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
            <option key={opt.value} value={opt.value} style={{ backgroundColor: "#1E1E1E", color: "#fff" }}>
              {opt.label}
            </option>
          ))}
        </Select>
      </Flex>

      {/* Tabs for All, Accepted, Rejected */}
      <Tabs index={tabIndex} onChange={handleTabsChange} color="white" variant="unstyled" mb={4}>
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

      {/* Table */}
      <Box overflowX="auto" borderRadius="lg" minH="400px">
        <Table variant="unstyled" size="md">
          <Thead>
            <Tr bg="#262626" borderTopRadius="lg">
              <Th color="#898989" fontSize="xs" py={3} borderTopLeftRadius="lg" textTransform="none" textAlign="center">
                Candidate Name
              </Th>
              <Th color="#898989" fontSize="xs" py={3} textTransform="none" cursor="pointer" onClick={() => handleSort("rating")} textAlign="center">
                <Flex align="center" justify="center">
                  Rating
                  <SortIndicator field="rating" />
                </Flex>
              </Th>
              <Th color="#898989" fontSize="xs" py={3} textTransform="none" cursor="pointer" onClick={() => handleSort("stage")} textAlign="center">
                <Flex align="center" justify="center">
                  Stages
                  <SortIndicator field="stage" />
                </Flex>
              </Th>
              <Th color="#898989" fontSize="xs" py={3} textTransform="none" textAlign="center">
                Applied Role
              </Th>
              <Th color="#898989" fontSize="xs" py={3} textTransform="none" cursor="pointer" onClick={() => handleSort("application_date")} textAlign="center">
                <Flex align="center" justify="center">
                  Application Date
                  <SortIndicator field="application_date" />
                </Flex>
              </Th>
              <Th color="#898989" fontSize="xs" py={3} textTransform="none" textAlign="center" borderBottomRightRadius="lg">
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
                  display: index !== sortedCandidates.length - 1 ? "block" : "none",
                }}
              >
                <Td pt={3} pb={3} textAlign="center">
                  <Flex align="center" gap={3} justify="center">
                    {candidate.svg_photo ? (
                      <Box boxSize="40px">
                        <img
                          src={candidate.svg_photo}
                          alt={candidate.name}
                          style={{ width: "40px", height: "40px", borderRadius: "50%" }}
                        />
                      </Box>
                    ) : (
                      <Avatar size="sm" name={candidate.name} />
                    )}
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

      {/* Drawer for Candidate Details */}
      <Drawer isOpen={isOpen} onClose={onClose} placement="right" size="md">
        <DrawerOverlay />
        <DrawerContent bg="#151515" className="drawer-content">
          <style>{`
            @media print {
              @page {
                margin: 0.5in;
                background-color: #151515;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              body {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
                background: #151515 !important;
                color: white !important;
              }
              /* Hide only the overlay and close button */
              .chakra-modal__overlay,
              .chakra-modal__close-btn {
                display: none !important;
              }
              /* Make drawer content fully visible for printing */
              .drawer-content {
                position: static !important;
                transform: none !important;
                height: auto !important;
                width: 100% !important;
                max-width: 100% !important;
                overflow: visible !important;
                background: #151515 !important;
                color: white !important;
                box-shadow: none !important;
                margin: 0 !important;
                padding: 0 !important;
              }
              .chakra-modal__body {
                overflow: visible !important;
                height: auto !important;
                padding: 0 !important;
                display: block !important;
              }
              .print-container {
                width: 100% !important;
                padding: 2rem !important;
                background: #151515 !important;
                color: white !important;
                page-break-inside: avoid !important;
                display: block !important;
                overflow: visible !important;
              }
              .print-container > * {
                display: block !important;
                visibility: visible !important;
                overflow: visible !important;
              }
              .print-section {
                width: 100% !important;
                max-width: none !important;
                margin-left: 0 !important;
                margin-right: 0 !important;
                margin-bottom: 2rem !important;
                display: block !important;
                visibility: visible !important;
                overflow: visible !important;
                page-break-after: always !important;
              }
            }
          `}</style>
          <DrawerCloseButton color="white" />
          <DrawerHeader color="white">Candidate Details</DrawerHeader>
          <DrawerBody>
            {selectedCandidate ? (
              <Box color="white" className="print-container" style={{ position: "static", overflow: "visible" }}>
                {/* Profile Section */}
                <Box w="full" bg="#1A1A1A" borderRadius="lg" py={3} px={4} className="print-section">
                  <VStack align="center" spacing={3} w="full">
                    {selectedCandidate.svg_photo ? (
                      <Box boxSize="70px">
                        <img
                          src={selectedCandidate.svg_photo}
                          alt={selectedCandidate.name}
                          style={{ width: "70px", height: "70px", borderRadius: "50%" }}
                        />
                      </Box>
                    ) : (
                      <Avatar size="sm" name={selectedCandidate.name} />
                    )}
                    <VStack spacing={1} mb={4}>
                      <Heading size="md">{selectedCandidate.name}</Heading>
                      <Text color="gray.500" fontSize="md">{selectedCandidate.applied_role}</Text>
                    </VStack>
                    <Flex gap={12} justify="center" className="contact-info">
                      <Box>
                        <Flex gap={3}>
                          <Icon as={EmailIcon} color="gray.500" boxSize={5} />
                          <Box>
                            <Text fontSize="xs" color="gray.500" letterSpacing="wide">EMAIL</Text>
                            <Text fontSize="sm" color="white">{selectedCandidate.email}</Text>
                          </Box>
                        </Flex>
                      </Box>
                      <Box>
                        <Flex gap={3}>
                          <Icon as={PhoneIcon} color="gray.500" boxSize={5} />
                          <Box>
                            <Text fontSize="xs" color="gray.500" letterSpacing="wide">PHONE</Text>
                            <Text fontSize="sm" color="white">{selectedCandidate.phone}</Text>
                          </Box>
                        </Flex>
                      </Box>
                    </Flex>
                  </VStack>
                </Box>

                {/* Application Details */}
                <Box w="full" className="print-section" bg="#1A1A1A" borderRadius="lg" p={4} mt={4} mb={4}>
                  <Text fontSize="xl" fontWeight="semibold" mb={4}>Application Details</Text>
                  <VStack spacing={0} align="stretch" position="relative">
                    <Box position="absolute" left="15px" top="30px" bottom="30px" width="2px" bg="#333" zIndex={0} />
                    {[
                      { label: "Screening" },
                      { label: "Design Challenge" },
                      { label: "Interview" },
                      { label: "HR Round" },
                      { label: "Hired" },
                    ].map((stage, idx) => {
                      const currentStageIndex = ["Screening", "Design Challenge", "Interview", "HR Round", "Hired"].findIndex(
                        (s) => s === selectedCandidate.stage
                      );
                      let status = "pending";
                      if (idx < currentStageIndex) status = "completed";
                      else if (idx === currentStageIndex) status = "current";
                      return (
                        <Flex key={stage.label} align="flex-start" gap={4} py={3} position="relative">
                          <Circle
                            size="8"
                            bg={status === "completed" ? "green.500" : status === "current" ? "#FFB547" : "#333"}
                            zIndex={1}
                          >
                            {status === "completed" ? (
                              <CheckIcon color="white" boxSize={4} />
                            ) : (
                              <Text color="white" fontSize="sm">{idx + 1}</Text>
                            )}
                          </Circle>
                          <Box flex="1">
                            <Text fontSize="sm" color="white" mb={0}>{stage.label}</Text>
                          </Box>
                          {status === "current" && (
                            <Box bg="#2A2A2A" px={3} py={1} borderRadius="full" alignSelf="center">
                              <Text fontSize="xs" color="#FFB547">Under Review</Text>
                            </Box>
                          )}
                        </Flex>
                      );
                    })}
                  </VStack>
                </Box>

                {/* Experience Section */}
                <Box w="full" bg="#1A1A1A" borderRadius="lg" p={6} mt={4} className="print-section">
                  <Text fontSize="lg" fontWeight="semibold" mb={4}>Experience</Text>
                  <VStack align="stretch" spacing={6}>
                    {selectedCandidate.experience_details
                      ? JSON.parse(selectedCandidate.experience_details).map((exp, i) => (
                          <Box key={i} className="experience-item">
                            <Flex align="center" gap={3} mb={2}>
                              <Avatar size="sm" name={exp.company} />
                              <Box>
                                <Text fontWeight="medium" color="white">{exp.company}</Text>
                                <Text fontSize="sm" color="gray.400">{exp.role}</Text>
                                <Text fontSize="sm" color="gray.500">{exp.duration}</Text>
                              </Box>
                            </Flex>
                            <Text fontSize="sm" color="gray.400" mt={2}>{exp.description}</Text>
                          </Box>
                        ))
                      : <Text color="gray.500">No experience details available</Text>}
                  </VStack>
                </Box>

                {/* Projects Section */}
                <Box w="full" bg="#1A1A1A" borderRadius="lg" p={6} mt={4} mb={8} className="print-section">
                  <Text fontSize="lg" fontWeight="semibold" mb={4}>Projects</Text>
                  <VStack align="stretch" spacing={4}>
                    {selectedCandidate.projects
                      ? JSON.parse(selectedCandidate.projects).map((project, i) => (
                          <Box key={i} className="project-item">
                            <Text fontWeight="medium" color="white">{project.name}</Text>
                            <Text fontSize="sm" color="gray.400" mt={1}>{project.description}</Text>
                            {project.link && (
                              <Button
                                as="a"
                                href={project.link}
                                target="_blank"
                                size="sm"
                                variant="outline"
                                colorScheme="purple"
                                mt={2}
                                rightIcon={<ArrowForwardIcon />}
                              >
                                View Project
                              </Button>
                            )}
                          </Box>
                        ))
                      : <Text color="gray.500">No projects available</Text>}
                  </VStack>
                </Box>

                {/* Action Buttons (Optional for print) */}
                <Flex gap={3} className="action-buttons print-hide">
                  <Button
                    flex="1"
                    bgGradient="linear(to-r, #6E38E0, #FF5F36)"
                    color="white"
                    _hover={{ opacity: 0.9 }}
                    borderRadius="none"
                    rightIcon={<ArrowUpIcon transform="rotate(45deg)" />}
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
                    onClick={handleGeneratePDF}
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
