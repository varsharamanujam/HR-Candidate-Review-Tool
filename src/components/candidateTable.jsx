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
  Heading,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from "@chakra-ui/react";
import { StarIcon, ArrowUpIcon, ArrowDownIcon } from "@chakra-ui/icons";
import { fetchCandidates, filterCandidates } from "../api";

/**
 * Format date from "YYYY-MM-DD..." to "DD/MM/YY".
 */
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return `${String(date.getDate()).padStart(2, "0")}/${String(
    date.getMonth() + 1
  ).padStart(2, "0")}/${date.getFullYear().toString().substring(2)}`;
};

const CandidateTable = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);

  // Sorting state
  const [sortField, setSortField] = useState("");
  const [sortDirection, setSortDirection] = useState("asc");

  // Tabs: 0 = All, 1 = Accepted, 2 = Rejected
  const [tabIndex, setTabIndex] = useState(0);

  // Fetch all on initial load
  useEffect(() => {
    fetchAllCandidates();
  }, []);

  // Fetch all (unfiltered) candidates
  const fetchAllCandidates = async () => {
    setLoading(true);
    try {
      const data = await fetchCandidates();
      setCandidates(data);
    } catch (err) {
      console.error("Error fetching candidates:", err);
    }
    setLoading(false);
  };

  /**
   * Handle switching tabs:
   * - All => fetchAllCandidates()
   * - Accepted => filterCandidates({ status: 'Selected' })
   * - Rejected => filterCandidates({ status: 'Rejected' })
   */
  const handleTabsChange = async (index) => {
    setTabIndex(index);
    setLoading(true);

    try {
      if (index === 1) {
        // Accepted
        const filtered = await filterCandidates({ status: "Accepted" });
        setCandidates(filtered);
      } else if (index === 2) {
        // Rejected
        const filtered = await filterCandidates({ status: "Rejected" });
        setCandidates(filtered);
      } else {
        // All
        await fetchAllCandidates();
      }
    } catch (err) {
      console.error("Error filtering candidates:", err);
    }

    setLoading(false);
  };

  /**
   * When user clicks on a column header to sort.
   * - If it's the same field, toggle direction
   * - Else set new field and default to ascending
   */
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  /**
   * Sort the candidate list based on sortField, sortDirection.
   * We use useMemo so we only recalc if candidates or sort state changes.
   */
  const sortedCandidates = useMemo(() => {
    if (!sortField) return candidates;

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
    return sorted;
  }, [candidates, sortField, sortDirection]);

  /**
   * Renders an arrow icon for each sortable column.
   * - If active column, show the correct direction arrow at full opacity
   * - If inactive, show an up arrow with lower opacity
   */
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

  // If loading, show a spinner
  if (loading) {
    return (
      <Center h="200px">
        <Spinner size="xl" color="purple.400" thickness="4px" />
      </Center>
    );
  }

  return (
    <Box bg="#151515" p={6} borderRadius="md">
      {/* Main heading */}
      <Heading size="lg" color="white" mb={4}>
        Candidates
      </Heading>

      {/* Tabs */}
      <Tabs
        index={tabIndex}
        onChange={handleTabsChange}
        color="white"
        variant="unstyled"
        mb={4}
      >
        <TabList>
          <Tab
            color="white"
            position="relative"
            pb={2}
            mr={4}
            _selected={{
              fontWeight: "semibold",
            }}
            // Add the gradient bar under the active tab only
            _after={{
              color:"white",
              content: '""',
              position: "absolute",
              bottom: 0,
              left: 0,
              width: "100%",
              height: "2px",
              bgGradient: "linear(to-r, #6E38E0, #FF5F36)",
              // Only show when active
              opacity: tabIndex === 0 ? 1 : 0,
              transition: "opacity 0.2s",
            }}
          >
            All
          </Tab>
          <Tab
            color="white"
            position="relative"
            pb={2}
            mr={4}
            _selected={{
              fontWeight: "semibold",
            }}
            _after={{
              color:"white",
              content: '""',
              position: "absolute",
              bottom: 0,
              left: 0,
              width: "100%",
              height: "2px",
              bgGradient: "linear(to-r, #6E38E0, #FF5F36)",
              opacity: tabIndex === 1 ? 1 : 0,
              transition: "opacity 0.2s",
            }}
          >
            Accepted
          </Tab>
          <Tab
            color="white"
            position="relative"
            pb={2}
            _selected={{
              fontWeight: "semibold",
            }}
            _after={{
              color:"white",
              content: '""',
              position: "absolute",
              bottom: 0,
              left: 0,
              width: "100%",
              height: "2px",
              bgGradient: "linear(to-r, #6E38E0, #FF5F36)",
              opacity: tabIndex === 2 ? 1 : 0,
              transition: "opacity 0.2s",
            }}
          >
            Rejected
          </Tab>
        </TabList>

        <TabPanels>
          <TabPanel p={0} />
          <TabPanel p={0} />
          <TabPanel p={0} />
        </TabPanels>
      </Tabs>

      {/* Table container with a minHeight to prevent layout shifting */}
      <Box
        overflowX="auto"
        borderRadius="md"
        minH="400px" // Adjust as needed
        border="1px solid #333"
        bg="#1E1E1E"
      >
        <Table variant="simple" size="md">
          <Thead>
            <Tr bg="#242424">
              <Th
                color="white"
                fontSize="xs"
                cursor="pointer"
                onClick={() => handleSort("name")}
              >
                <Flex align="center">
                  Candidate Name
                  <SortIndicator field="name" />
                </Flex>
              </Th>
              <Th
                color="white"
                fontSize="xs"
                cursor="pointer"
                onClick={() => handleSort("rating")}
              >
                <Flex align="center">
                  Rating
                  <SortIndicator field="rating" />
                </Flex>
              </Th>
              <Th
                color="white"
                fontSize="xs"
                cursor="pointer"
                onClick={() => handleSort("stage")}
              >
                <Flex align="center">
                  Stages
                  <SortIndicator field="stage" />
                </Flex>
              </Th>
              <Th
                color="white"
                fontSize="xs"
                cursor="pointer"
                onClick={() => handleSort("applied_role")}
              >
                <Flex align="center">
                  Applied Role
                  <SortIndicator field="applied_role" />
                </Flex>
              </Th>
              <Th
                color="white"
                fontSize="xs"
                cursor="pointer"
                onClick={() => handleSort("application_date")}
              >
                <Flex align="center">
                  Application Date
                  <SortIndicator field="application_date" />
                </Flex>
              </Th>
              {/* Attachments not sortable */}
              <Th color="white" fontSize="xs">
                Attachments
              </Th>
            </Tr>
          </Thead>

          <Tbody>
            {sortedCandidates.map((candidate) => (
              <Tr key={candidate.id} _hover={{ bg: "#2A2A2A" }}>
                <Td>
                <Flex align="center" gap={3}>
                    <Avatar size="sm" name={candidate.name} />
                    <Text color="white">{candidate.name}</Text>
                  </Flex>
                </Td>
                <Td>
                  <Flex align="center" gap={1}>
                    <Icon as={StarIcon} color="yellow.400" boxSize={4} />
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
                  <Text color="white">
                    {formatDate(candidate.application_date)}
                  </Text>
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
