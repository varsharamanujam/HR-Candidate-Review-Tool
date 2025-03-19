import React, { useEffect, useState } from "react";
import {
  Box,
  Flex,
  Heading,
  Text,
  Select,
  Icon,
  useBreakpointValue,
} from "@chakra-ui/react";
import Slider from "react-slick";
import { fetchOpenings } from "../api";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { FiMapPin, FiClock, FiArrowUpRight } from "react-icons/fi";

// Mock data to match the screenshot
const dummyOpenings = [
  { 
    id: 1, 
    title: "Sr. UX Designer", 
    location: "Bengaluru", 
    experience: "3 years exp.", 
    applications: 45, 
    newApps: 25, 
    postedDays: 2, 
    color: "#29C5EE",
    icon: "🎨"
  },
  {
    id: 2, 
    title: "Growth Manager", 
    location: "Remote", 
    experience: "2+ years exp.", 
    applications: 38, 
    newApps: 10, 
    postedDays: 5, 
    color: "#CF1A2C",
    icon: "🚀"
  },
  {
    id: 3, 
    title: "Financial Analyst", 
    location: "Mumbai", 
    experience: "5+ years exp.", 
    applications: 25, 
    newApps: 25, 
    postedDays: 10, 
    color: "#EAB04D",
    icon: "🪙"
  },
  {
    id: 4, 
    title: "Senior Developer", 
    location: "New Delhi", 
    experience: "4+ years exp.", 
    applications: 105, 
    newApps: 20, 
    postedDays: 3, 
    color: "#00B85E",
    icon: "💻"
  }
];

const Carousel = () => {
  const [openings, setOpenings] = useState(dummyOpenings);
  const [sortBy, setSortBy] = useState("latest");
  
  const slidesToShow = useBreakpointValue({ base: 1, sm: 1, md: 2, lg: 3, xl: 4 });

  useEffect(() => {
    const loadOpenings = async () => {
      try {
      const data = await fetchOpenings();
        if (data && data.length > 0) {
          setOpenings(data);
        }
      } catch (error) {
        console.error("Error fetching openings:", error);
        // Keep using dummy data if fetch fails
      }
    };
    loadOpenings();
  }, []);

  const handleSort = (criteria) => {
    setSortBy(criteria);
    const sorted = [...openings].sort((a, b) => {
      if (criteria === "latest") return a.postedDays - b.postedDays;
      if (criteria === "oldest") return b.postedDays - a.postedDays;
      return 0;
    });
    setOpenings(sorted);
  };

  const settings = {
    dots: false,
    infinite: false,
    speed: 500,
    slidesToShow: slidesToShow || 4,
    slidesToScroll: 1,
    responsive: [
      { breakpoint: 1536, settings: { slidesToShow: 4 } },
      { breakpoint: 1280, settings: { slidesToShow: 3 } },
      { breakpoint: 1024, settings: { slidesToShow: 2 } },
      { breakpoint: 768, settings: { slidesToShow: 1 } },
    ],
  };

  return (
    <Box w="full" className="mt-2 font-urbanist">
      <Flex 
        justify="space-between" 
        align="center" 
        mb="4"
        direction={{ base: "column", sm: "row" }}
        gap={{ base: "2", sm: "0" }}
      >
        <Heading 
          size={{ base: "md", md: "lg" }} 
          color="white" 
          className="font-urbanist"
          mb={{ base: "2", sm: "0" }}
        >
          Current Openings
        </Heading>

        <Select
          value={sortBy}
          onChange={(e) => handleSort(e.target.value)}
          bg="gray.800"
          color="gray.400"
          borderRadius="md"
          border="none"
          w={{ base: "full", sm: "160px" }}
          size="sm"
          icon={<Icon as={FiArrowUpRight} />}
          className="bg-gray-800 focus:ring-1 focus:ring-purple font-urbanist"
        >
          <option value="latest">Sort By: Latest</option>
          <option value="oldest">Sort By: Oldest</option>
        </Select>
      </Flex>

      <Box className="carousel-container">
      <Slider {...settings}>
        {openings.map((job) => (
            <Box key={job.id} px="2" className="responsive-card">
              <Box
                position="relative"
                bg="gray.800"
                borderRadius="lg"
                p="4"
                h={{ base: "210px", md: "200px" }}
                minHeight="200px"
                boxShadow="sm"
                border="1px"
                borderColor="gray.700"
                overflow="hidden"
                className="bg-gray-800 border-gray-700 hover:border-gray-600"
                cursor="pointer"
                transition="all 0.2s"
                _hover={{ transform: "translateY(-2px)" }}
                display="flex"
                flexDirection="column"
              >
                {/* Left color bar */}
                <Box
                  position="absolute"
                  top="0"
                  left="0"
                  h="full"
                  w="1"
                  bg={job.color}
                  className="rounded-l-lg"
                />

                {/* Job title and icon */}
                <Flex align="center" mb="1" mt="1">
                  <Box
                    fontSize="xl"
                    mr="2"
                    className="flex items-center justify-center w-8 h-8 rounded-md"
                    style={{ backgroundColor: `${job.color}30` }}
                  >
                    {job.icon}
                  </Box>
                  <Heading size="sm" fontWeight="semibold" noOfLines={1} className="font-urbanist">
                    {job.title}
                  </Heading>
                  <Icon 
                    as={FiArrowUpRight} 
                    color="gray.400" 
                    ml="auto" 
                    boxSize="5"
                  />
                </Flex>

                <Text color="gray.400" fontSize="xs" mb="3" className="font-urbanist">
                  Posted {job.postedDays} days ago
                </Text>

                {/* Location and experience */}
                <Flex gap="2" mb="4" flexWrap="wrap">
                  <Flex 
                    align="center" 
                    bg="gray.700" 
                    px="2" 
                    py="1" 
                    borderRadius="full" 
                    fontSize="xs"
                    className="bg-gray-700 font-urbanist"
                  >
                    <Icon as={FiMapPin} boxSize="3" mr="1" />
                    <Text>{job.location}</Text>
                  </Flex>
                  <Flex 
                    align="center" 
                    bg="gray.700" 
                    px="2" 
                    py="1" 
                    borderRadius="full" 
                    fontSize="xs"
                    className="bg-gray-700 font-urbanist"
                  >
                    <Icon as={FiClock} boxSize="3" mr="1" />
                    <Text>{job.experience}</Text>
                  </Flex>
                </Flex>

                {/* Applications count */}
                <Flex justify="space-between" align="baseline" mt="auto" mb="1">
                  <Text fontSize="3xl" fontWeight="bold" className="font-urbanist">
                    {job.applications}
                  </Text>
                  <Text fontSize="xs" color="secondary" className="font-urbanist">
                    {job.newApps} in last week
                  </Text>
                </Flex>
              </Box>
            </Box>
        ))}
      </Slider>
      </Box>
    </Box>
  );
};

export default Carousel;
