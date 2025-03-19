import React from "react";
import {
  Box,
  VStack,
  Text,
  Button,
  Icon,
  Flex,
  HStack,
} from "@chakra-ui/react";
import { FaUsers } from "react-icons/fa";

const Sidebar = ({ isMobile = false, onClose, display }) => {
  return isMobile ? (
    // Mobile sidebar (bottom navigation)
    <HStack 
      w="full" 
      spacing={0}
      justify="space-around"
      display={display || "block"}
    >
      <Button
        variant="ghost"
        py="3"
        px="3"
        borderRadius="md"
        colorScheme="purple"
        className="text-purple"
      >
        <Flex direction="column" align="center" gap="1">
          <Icon as={FaUsers} boxSize="5" />
          <Text fontSize="xs">Candidates</Text>
        </Flex>
      </Button>
    </HStack>
  ) : (
    // Desktop sidebar
    <Box
      w="64"
      h="full"
      color="white"
      borderRight="1px"
      borderColor="gray.700"
      className="bg-primary border-gray-700"
      pl="0"
    >
      <VStack align="stretch" spacing="6" pt="5" pb="5">
        <Text
          color="gray.500"
          textTransform="uppercase"
          fontSize="xs"
          letterSpacing="wider"
          pl="6"
          fontWeight="medium"
          fontFamily="Urbanist"
        >
          Recruitment
        </Text>

        <Box>
          <Button
            display="flex"
            alignItems="center"
            justifyContent="flex-start"
            gap="3"
            py="3"
            px="4"
            borderRadius="0 full full 0"
            fontSize="md"
            fontWeight="semibold"
            w="full"
            bgGradient="linear(to-r, #6E38E0, #FF5F36)"
            _hover={{
              opacity: 0.9,
            }}
            className="bg-gradient-primary"
          >
            <Icon as={FaUsers} color="white" boxSize="5" />
            Candidates
          </Button>
        </Box>
      </VStack>
    </Box>
  );
};

export default Sidebar;
