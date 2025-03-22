import React, { useState, useEffect } from "react";
import {
  Box,
  Flex,
  Heading,
  Input,
  InputGroup,
  InputLeftElement,
  IconButton,
  useDisclosure,
  Spinner,
  useBreakpointValue,
  Show,
  Hide,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerOverlay,
  Select,
} from "@chakra-ui/react";
import {
  SearchIcon,
  SettingsIcon,
  BellIcon,
  HamburgerIcon,
} from "@chakra-ui/icons";
import { fetchCandidates, searchCandidates } from "./api"; 
import Sidebar from "./components/sidebar";
import CandidateTable from "./components/candidateTable";
import Carousel from "./components/Carousel";

function generateMonthOptions() {
  const options = [];
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const startYear = currentYear - 2;

  for (let year = currentYear; year >= startYear; year--) {
    const endMonth = year === currentYear ? currentDate.getMonth() : 11;
    for (let month = endMonth; month >= 0; month--) {
      const date = new Date(year, month, 1);
      const monthName = date.toLocaleString("default", { month: "long" });
      options.push({
        value: `${year}-${String(month + 1).padStart(2, "0")}`,
        label: `${monthName} ${year}`,
      });
    }
  }
  return options;
}

function App() {
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { isOpen, onOpen, onClose } = useDisclosure();
  const isMobile = useBreakpointValue({ base: true, md: false });

  // Color constants
  const pageBg = "#151515";
  const headerBg = "#151515";
  const borderColor = "#333333";

  // Month-year filter state
  const [monthYearFilter, setMonthYearFilter] = useState("");
  const monthOptions = generateMonthOptions();

  // Function to load all candidates
  const loadData = async () => {
    try {
      setLoading(true);
      const candidatesData = await fetchCandidates();
      setCandidates(candidatesData);
    } catch (error) {
      console.error("Error fetching candidates:", error);
    } finally {
      setLoading(false);
    }
  };

  // Load all candidates on initial mount
  useEffect(() => {
    loadData();
  }, []);

  // Handler for the search input change
  const handleSearchChange = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    // If the search query is empty, reload all candidates
    if (query.trim() === "") {
      await loadData();
    } else {
      try {
        setLoading(true);
        // Call the search API endpoint to get matching candidates
        const searchedCandidates = await searchCandidates(query);
        setCandidates(searchedCandidates);
      } catch (error) {
        console.error("Error searching candidates:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Box className="min-h-screen h-screen text-white font-urbanist" bg={pageBg}>
      <Flex direction="column" h="100%">
        {/* Header */}
        <Flex
          borderBottom="1px"
          borderColor={borderColor}
          h="16"
          className="border-gray-700"
          bg={headerBg}
        >
          <Flex
            display={{ base: "none", md: "flex" }}
            w="64"
            borderRight="1px"
            borderColor={borderColor}
            align="center"
            px="6"
            className="border-gray-700"
          >
            <Heading size="lg" className="text-white flex items-center font-urbanist">
              <span className="text-purple mr-2">✦</span>
              RSKD Talent
            </Heading>
          </Flex>
          <Flex flex="1" justify="space-between" align="center" px="6" bg={headerBg}>
            {/* Mobile Menu Button */}
            <Show below="md">
              <IconButton
                aria-label="Open menu"
                icon={<HamburgerIcon />}
                variant="ghost"
                onClick={onOpen}
                className="mr-4"
              />
              <Heading size="md" className="text-white flex items-center font-urbanist">
                <span className="text-purple mr-2">✦</span>
                RSKD Talent
              </Heading>
            </Show>

            {/* Search Input */}
            <InputGroup maxW="340px" display={{ base: "none", lg: "block" }}>
              <InputLeftElement pointerEvents="none">
                <SearchIcon color="gray.400" />
              </InputLeftElement>
              <Input
                bg="#1E1E1E"
                border="none"
                placeholder="Search for jobs, candidates and more..."
                _placeholder={{ color: "gray.500" }}
                borderRadius="full"
                className="focus:ring-1 focus:ring-purple"
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </InputGroup>

            {/* Actions */}
            <Flex align="center" gap={{ base: "3", md: "6" }}>
              <IconButton
                aria-label="Settings"
                icon={<SettingsIcon />}
                variant="ghost"
                bg="#1E1E1E"
                borderRadius="full"
                size="sm"
                className="hover:bg-gray-700"
              />
              <Box position="relative">
                <IconButton
                  aria-label="Notifications"
                  icon={<BellIcon />}
                  variant="ghost"
                  bg="#1E1E1E"
                  borderRadius="full"
                  size="sm"
                  className="hover:bg-gray-700"
                />
                <Box
                  position="absolute"
                  top="0"
                  right="0"
                  bg="#00B85E"
                  w="2.5"
                  h="2.5"
                  borderRadius="full"
                />
              </Box>
              <IconButton
                aria-label="Profile"
                icon={
                  <div className="h-8 w-8 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold">
                    HR
                  </div>
                }
                variant="ghost"
                size="sm"
                className="p-0"
              />
            </Flex>
          </Flex>
        </Flex>

        {/* Main Content */}
        <Flex flex="1" className="overflow-hidden">
          {/* Sidebar for desktop */}
          <Hide below="md">
            <Sidebar />
          </Hide>

          {/* Mobile Sidebar */}
          <Drawer isOpen={isOpen} placement="left" onClose={onClose} size="xs">
            <DrawerOverlay />
            <DrawerContent bg={pageBg}>
              <DrawerBody p={0}>
                <Sidebar isMobile={true} onClose={onClose} />
              </DrawerBody>
            </DrawerContent>
          </Drawer>

          {/* Main Content Area */}
          <Box
            flex="1"
            p={{ base: "4", md: "6" }}
            overflowY="auto"
            className="responsive-content"
            bg={pageBg}
          >
            {loading ? (
              <Flex justify="center" align="center" h="full">
                <Spinner size="xl" color="#6E38E0" thickness="4px" speed="0.65s" emptyColor="gray.700" />
              </Flex>
            ) : (
              <>
                <Carousel />
                <br />
                <CandidateTable candidates={candidates} onSelect={setSelectedCandidate} />
              </>
            )}
          </Box>
        </Flex>

        {/* Mobile Navigation */}
        <Show below="md">
          <Flex
            as="nav"
            position="fixed"
            bottom="0"
            left="0"
            right="0"
            h="16"
            bg={headerBg}
            borderTop="1px"
            borderColor={borderColor}
            align="center"
            justify="space-around"
            className="responsive-sidebar"
            px="4"
          >
            <Sidebar isMobile={true} display="flex" />
          </Flex>
        </Show>
      </Flex>
    </Box>
  );
}

export default App;
