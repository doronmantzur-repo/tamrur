import { Box } from "@mantine/core";

const Layout = ({ children }) => {
  return (
    <Box
      component="main"
      mih="100vh"
      pos="relative"
      style={{
        overflow: "hidden",
        backgroundColor: "var(--app-color-background)",
        color: "var(--app-color-text)",
      }}
    >
      {children}
    </Box>
  );
};

export default Layout;
