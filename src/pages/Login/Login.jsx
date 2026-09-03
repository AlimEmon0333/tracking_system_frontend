import {
  Box,
  TextField,
  Typography,
  Button,
  useMediaQuery,
  CircularProgress,
  InputAdornment,
  IconButton,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { loginStyles } from "./loginStyles";
import { Link } from "react-router-dom";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { SmallMobileView } from "../../styles/theme";
import api from "../../api/axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const mobileView = useMediaQuery(SmallMobileView);
  const styles = loginStyles(mobileView);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const validate = () => {
    let tempErrors = {};

    if (!form.email) {
      tempErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      tempErrors.email = "Email is invalid";
    }

    if (!form.password) {
      tempErrors.password = "Password is required";
    }

    setErrors(tempErrors);

    return Object.keys(tempErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", form);
      localStorage.setItem("user", JSON.stringify(data));
      navigate("/");
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      navigate("/");
    }
  }, [navigate]);

  return (
    <Box sx={styles.pageWrapper}>
      {/* Left Panel - Branding */}
      <Box sx={styles.leftPanel}>
        <Typography sx={styles.brandingTitle}>Tracking System</Typography>
        <Typography sx={styles.brandingSubtitle}>
          Manage your sales, track inventory, and monitor payments seamlessly.
        </Typography>
      </Box>

      {/* Right Panel - Form */}
      <Box sx={styles.rightPanel}>
        <Box sx={styles.formWrapper}>
          <Box sx={styles.headerBox}>
            <Typography sx={styles.title}>Welcome back</Typography>
            <Typography sx={styles.subtitle}>
              Please enter your details to sign in.
            </Typography>
          </Box>

          <Box sx={styles.formContainer}>
            <TextField
              label="Email address"
              name="email"
              placeholder="name@company.com"
              value={form.email}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              error={!!errors.email}
              helperText={errors.email}
              fullWidth
            />
            <TextField
              label="Password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              error={!!errors.password}
              helperText={errors.password}
              fullWidth
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword((prev) => !prev)}
                        edge="end"
                        tabIndex={-1}
                      >
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }
              }}
            />
          </Box>

          <Button
            variant="contained"
            color="primary"
            sx={styles.loginButton}
            endIcon={!loading && <ArrowForwardIcon />}
            onClick={handleLogin}
            disabled={loading}
            fullWidth
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : "Sign In"}
          </Button>

          <Typography sx={styles.loginText}>
            Don't have an account?{" "}
            <Link to="/signup" style={styles.loginLink}>
              Sign Up
            </Link>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default Login;
