/**
 * @fileoverview CandidateTable Component
 *
 * A comprehensive table component for displaying and managing candidate information.
 * Features include:
 * - Sortable columns for candidate data
 * - Filtering by status (via tabs) and by month-year
 * - Detailed candidate profile view in a drawer
 * - PDF generation for candidate details
 * - Optional SVG photo display (if available)
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
  Heading
} from "@chakra-ui/react";
import {
  StarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  AttachmentIcon,
  EmailIcon,
  PhoneIcon,
  CheckIcon
} from "@chakra-ui/icons";
import { fetchCandidates, filterCandidates, getCandidate, generateCandidatePDF } from "../api";

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
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
};

const CandidateTable = ({ candidates: initialCandidates, onSelect }) => {
  // Use candidates passed as props; if none, load later in useEffect.
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
    // Build filters: include the month_year key as expected by the API.
    let filters = {};
    if (tabIndex === 1) {
      filters.status = "Accepted";
    } else if (tabIndex === 2) {
      filters.status = "Rejected";
    }
    if (value) {
      filters.month_year = value;
    }
    setLoading(true);
    try {
      const filtered = await filterCandidates(filters);
      setCandidates(filtered);
    } catch (err) {
      console.error("Error filtering candidates by month:", err);
    }
    setLoading(false);
  };

  // Handler for tab change (status filter)
  const handleTabsChange = async (index) => {
    setTabIndex(index);
    let filters = {};
    if (index === 1) {
      filters.status = "Accepted";
    } else if (index === 2) {
      filters.status = "Rejected";
    }
    if (monthYearFilter) {
      filters.month_year = monthYearFilter;
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

  // Sorting: sort candidates based on sortField and sortDirection.
  const sortedCandidates = useMemo(() => {
    if (!candidates || candidates.length === 0) return [];
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
    return (
      <Icon as={icon} w={3} h={3} ml={1} color="purple.400" opacity={isActive ? 1 : 0.3} />
    );
  };

  // Row click: open drawer with candidate details.
  const handleCandidateClick = (candidateId) => {
    const candidate = candidates.find((cand) => cand.id === candidateId);
    if (candidate) {
      setSelectedCandidate(candidate);
      onOpen();
      if (onSelect) onSelect(candidate);
    }
  };

  // PDF generation handler (called from the drawer)
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
    <Box bg="#1E1E1E" p={{ base: 4, md: 6 }} borderRadius="md">
      {/* Header: Title and Month-Year filter */}
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
              key={opt.value}
              value={opt.value}
              style={{ backgroundColor: "#1E1E1E", color: "#fff" }}
            >
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
              <Th color="#898989" fontSize="xs" py={3} textTransform="none" textAlign="center">
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
        <DrawerContent bg="#1E1E1E">
          <DrawerCloseButton color="white" />
          <DrawerHeader color="white">
            {selectedCandidate ? selectedCandidate.name : "Candidate Details"}
          </DrawerHeader>
          <DrawerBody>
            {selectedCandidate ? (
              <Box color="white">
                {/* Candidate Info */}
                <Box w="full" maxW="md" bg="#1A1A1A" borderRadius="lg" py={3} px={4}>
                  <VStack align="center" spacing={3}>
                    {selectedCandidate.svg_photo ? (
                      <Box boxSize="lg">
                        <img
                          src={selectedCandidate.svg_photo}
                          alt={selectedCandidate.name}
                          style={{ width: "80px", height: "80px", borderRadius: "50%" }}
                        />
                      </Box>
                    ) : (
                      <Avatar size="lg" name={selectedCandidate.name} />
                    )}
                    <VStack spacing={1} mb={4}>
                      <Heading size="md">{selectedCandidate.name}</Heading>
                      <Text color="gray.500">{selectedCandidate.applied_role}</Text>
                    </VStack>
                    <Flex gap={12} justify="center">
                      <Box>
                        <Flex gap={3}>
                          <Icon as={EmailIcon} color="gray.500" boxSize={5} />
                          <Box>
                            <Text fontSize="xs" color="gray.500" letterSpacing="wide">
                              EMAIL
                            </Text>
                            <Text fontSize="sm">{selectedCandidate.email}</Text>
                          </Box>
                        </Flex>
                      </Box>
                      <Box>
                        <Flex gap={3}>
                          <Icon as={PhoneIcon} color="gray.500" boxSize={5} />
                          <Box>
                            <Text fontSize="xs" color="gray.500" letterSpacing="wide">
                              PHONE
                            </Text>
                            <Text fontSize="sm">{selectedCandidate.phone}</Text>
                          </Box>
                        </Flex>
                      </Box>
                    </Flex>
                  </VStack>
                </Box>

                {/* Additional Candidate Details */}
                <Box mt={4} p={4} bg="#1A1A1A" borderRadius="lg">
                  <Text>Stage: {selectedCandidate.stage}</Text>
                  <Text>Status: {selectedCandidate.status}</Text>
                  <Text>Role: {selectedCandidate.applied_role}</Text>
                  <Text>Rating: {selectedCandidate.rating}</Text>
                  {/* Additional fields (experience, location, etc.) can be added here */}
                </Box>

                {/* Action Buttons */}
                <Flex gap={3} mt={4}>
                  <Button colorScheme="green">Move to Next Step</Button>
                  <Button colorScheme="red">Reject</Button>
                  <Button colorScheme="purple" isLoading={pdfLoading} onClick={handleGeneratePDF}>
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
