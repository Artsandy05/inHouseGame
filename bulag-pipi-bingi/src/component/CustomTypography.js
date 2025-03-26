import { Typography } from '@mui/material';

const CustomTypography = ({ resultText }) => {
  return (
    <Typography
      variant="h6"
      style={{
        fontSize: '20px',  // Slightly larger for better visibility
        color: resultText ? '#FFD700' : '#FFFFFF',  // Gold color for winners, white when empty
        fontFamily: "'Arial', sans-serif",  // Simple but elegant font
        fontWeight: 700,  // Bold for emphasis
        padding: '12px 20px',  // Extra padding for a spacious look
        backgroundColor: '#333',  // Dark background to make the text pop
        borderRadius: '12px',  // Rounded corners for a sleek modern look
        boxShadow: '0 8px 16px rgba(0, 0, 0, 0.3)',  // Stronger shadow for depth and emphasis
        textAlign: 'center',  // Center-align the text
        opacity: resultText ? 1 : 0,  // Fade effect for empty text
        transition: 'opacity 0.5s ease-in-out',  // Smooth fade-in effect when resultText appears
        letterSpacing: '1px',  // Add spacing to letters for more elegance
        textTransform: 'uppercase',  // Uppercase letters for more impact
        fontSize: '1.25rem',  // Slightly bigger text for a bold look
      }}
    >
      {resultText}
    </Typography>
  );
};

export default CustomTypography;
