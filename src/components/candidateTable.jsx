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
  Center,
  Spinner,
  useBreakpointValue,
  Icon,
} from "@chakra-ui/react";
import { StarIcon, ArrowUpIcon, ArrowDownIcon } from "@chakra-ui/icons";
import { fetchCandidates } from "../api"; // Use your API function

const CandidateTable = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);

  // For now, we won't add sorting functionality until we confirm data is fetched
  useEffect(() => {
    const loadCandidates = async () => {
      try {
        const data = await fetchCandidates();
        setCandidates(data);
      } catch (error) {
        console.error("Error fetching candidates:", error);
      }
      setLoading(false);
    };

    loadCandidates();
  }, []);

  // Helper functions (for display purposes)
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${String(date.getDate()).padStart(2, "0")}/${String(
      date.getMonth() + 1
    ).padStart(2, "0")}/${date.getFullYear().toString().substring(2)}`;
  };

  const SortIndicator = () => (
    <Icon as={ArrowUpIcon} w={3} h={3} ml={1} color="purple.400" />
  );

  if (loading) {
    return (
      <Center h="200px">
        <Spinner size="xl" color="purple.400" thickness="4px" />
      </Center>
    );
  }

  return (
    <Box bg="#151515" p={6} borderRadius="md">
      <Heading size="lg" color="white" mb={6}>
        Candidates
      </Heading>
      <Box overflowX="auto">
        <Table variant="simple" size="md">
          <Thead>
            <Tr bg="#242424">
              <Th color="white" fontSize="xs">
                <Flex align="center">Candidate Name<SortIndicator /></Flex>
              </Th>
              <Th color="white" fontSize="xs">
                <Flex align="center">Rating<SortIndicator /></Flex>
              </Th>
              <Th color="white" fontSize="xs">
                <Flex align="center">Stage<SortIndicator /></Flex>
              </Th>
              <Th color="white" fontSize="xs">
                <Flex align="center">Applied Role<SortIndicator /></Flex>
              </Th>
              <Th color="white" fontSize="xs">
                <Flex align="center">
                  Application Date<SortIndicator />
                </Flex>
              </Th>
              <Th color="white" fontSize="xs">
                <Flex align="center">
                  Attachments<SortIndicator />
                </Flex>
              </Th>
            </Tr>
          </Thead>
          <Tbody>
            {candidates.map((candidate) => (
              <Tr key={candidate.id} _hover={{ bg: "#2A2A2A" }}>
                <Td color="white">{candidate.name}</Td>
                <Td color="white">
                  <Flex align="center">
                    <StarIcon color="yellow.400" mr="1" />
                    <Text>{candidate.rating.toFixed(1)}</Text>
                  </Flex>
                </Td>
                <Td color="white">{candidate.stage}</Td>
                <Td color="white">{candidate.applied_role}</Td>
                <Td color="white">{formatDate(candidate.application_date)}</Td>
                <Td color="white">
                  <Flex align="center">{candidate.attachments} files</Flex>
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
