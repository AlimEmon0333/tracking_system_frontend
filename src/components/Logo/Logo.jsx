import { Box, Typography } from "@mui/material";
import { logoStyle } from "./logoStyles";

export default function Logo() {
  const styles = logoStyle();

  return (
    <Box sx={styles.container}>
      {/* ICON */}
      <Box sx={styles.iconBox}>
        <Typography sx={styles.iconText}>Tracking System</Typography>
      </Box>
    </Box>
  );
}
