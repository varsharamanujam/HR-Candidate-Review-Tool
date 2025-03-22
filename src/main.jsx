import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ChakraProvider, extendTheme } from '@chakra-ui/react'
import './index.css'
import App from './App.jsx'

// Create a custom theme with design system colors
const theme = extendTheme({
  config: {
    initialColorMode: 'dark',
    useSystemColorMode: false,
  },
  fonts: {
    heading: 'Urbanist, sans-serif',
    body: 'Urbanist, sans-serif',
  },
  colors: {
    // Design system colors
    brand: {
      gradient: "linear-gradient(90deg, #6E38E0 0%, #FF5F36 100%)",
      purple: "#6E38E0",
      orange: "#FF5F36",
    },
    primary: "#151515", // Black
    secondary: "#00B85E", // Green
    accent: {
      yellow: "#FFD923",
      gray: "#898989",
      white: "#FFFFFF",
    },
    gray: {
      900: "#151515", // Primary black
      800: "#1E1E1E", // Card background
      700: "#333333", // Border color
      600: "#666666", // Input background
      500: "#898989", // Accent gray
      400: "#AAAAAA", // Light text
    },
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: "semibold",
        borderRadius: "full",
      },
    },
    Heading: {
      baseStyle: {
        fontWeight: "semibold",
      },
    },
  },
  styles: {
    global: {
      body: {
        bg: 'gray.900',
        color: 'white',
        fontFamily: 'Urbanist, sans-serif',
        minHeight: '100vh',
        overflow: 'hidden',
      },
      '#root': {
        minHeight: '100vh',
      },
    }
  }
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ChakraProvider theme={theme}>
      <App />
    </ChakraProvider>
  </StrictMode>,
)
