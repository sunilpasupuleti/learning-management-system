/* eslint-disable jsx-a11y/anchor-is-valid */
import * as React from "react";
import PropTypes from "prop-types";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import CssBaseline from "@mui/material/CssBaseline";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import MenuIcon from "@mui/icons-material/Menu";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import classes from "./Navbar.module.css";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AuthenticationContext } from "../../services/Authentication/Authentication.context";
import { Avatar, Menu, MenuItem, Tooltip } from "@mui/material";

const drawerWidth = 240;

function Navbar() {

  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [anchorElUser, setAnchorElUser] = React.useState(null);
  const location = useLocation();
  const { pathname } = location;
  const navigate = useNavigate();
  const { onLogout, userData } = useContext(AuthenticationContext);

  const handleDrawerToggle = () => {
    setMobileOpen((prevState) => !prevState);
  };

  const onClickLogout = () => {
    onLogout(() => {
      navigate("/auth/signin");
    });
  };

  const navItems = [
    {
      name: "Quiz",
      path: "/student/quiz",
      active: ["/student/quiz", "/student/quiz/start"],
    },

    {
      name: "Reports",
      path: "/student/reports",
      active: ["/student/reports", "/student/reports/view"],
    },
    {
      name: "Courses",
      path: "/student/courses",
      active: ["/student/courses", "/student/courses/view"],
    },
    {
      name: "Resources",
      path: "/student/resources",
      active: ["/student/resources"],
    },
    {
      name: "Profile",
      path: "/student/profile",
      active: ["/student/profile"]
    },
    {
      name: "Logout",
      onClick: onClickLogout,
    },
  ];

  const drawer = (
    <Box onClick={handleDrawerToggle} sx={{ textAlign: "center" }}>
      <Box>
        <img
          src={require("../../assets/logo.png")}
          alt="..."
          className={classes.navLogo}
        />
      </Box>
      <Divider />
      <List>
        {navItems.map((item, i) => {
          let { name, path, onClick, active } = item;
          let currentPath = pathname;
          let activePath =
            active && active.length > 0 ? active.includes(currentPath) : false;
          return (
            <ListItem
              key={i}
              disablePadding
              className={`${activePath ? classes.activeItem : ""}`}
            >
              <ListItemButton sx={{ textAlign: "center" }}>
                <ListItemText
                  primary={name}
                  onClick={onClick ? onClick : () => navigateTo(path)}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );

  const container =
    window !== undefined ? () => window.document.body : undefined;

  const navigateTo = (path) => {
    navigate(path);
  };

  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  }

  const handleCloseUserMenu = (event) => {
    setAnchorElUser(null);
  }

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <AppBar
        component="nav"
        sx={{
          background: "#fff",
        }}>
        <Toolbar>
          <div className={classes.navToolbar}>
            <IconButton
              color="primary"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { sm: "none" } }}>
              <MenuIcon />
            </IconButton>
            <img
              src={require("../../assets/logo.png")}
              alt="..."
              className={classes.navLogoToolbar}
            />
          </div>

          <Box sx={{ flexGrow: 1, display: { xs: "none", sm: "block" } }}>
            <img
              src={require("../../assets/logo.png")}
              alt="..."
              className={classes.navLogo}
            />
          </Box>

          <Box sx={{ display: { xs: "none", sm: "block" } }}>
            {navItems.map((item, i) => {
              let { name, path, onClick, active } = item;
              let currentPath = pathname;
              let activePath =
                active && active.length > 0
                  ? active.includes(currentPath)
                  : false;
              return (
                name !== "Logout" &&
                name !== "Profile" && (
                  <a
                    // href={path}
                    onClick={onClick ? onClick : () => navigateTo(path)}
                    key={i}
                    className={`${classes.item} ${
                      activePath ? classes.active : ""
                    }`}>
                    {name}
                  </a>
                )
              );
            })}
            <>
              <span className={`${classes.item} ${classes.userName}`}>
                {window?.innerWidth > 768 && userData
                  ? `${userData.firstName} ${userData.lastName}`
                  : ""}
              </span>

              <Tooltip title={userData?.name} className="ml-0-5">
                <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                  <Avatar
                    alt={userData?.name}
                    src="/static/images/avatar/2.jpg"
                    sx={{ width: 35, height: 35 }}
                  />
                </IconButton>
              </Tooltip>
              <Menu
                sx={{ mt: "45px" }}
                id="menu-appbar"
                anchorEl={anchorElUser}
                anchorOrigin={{
                  vertical: "top",
                  horizontal: "right",
                }}
                keepMounted
                transformOrigin={{
                  vertical: "top",
                  horizontal: "right",
                }}
                open={Boolean(anchorElUser)}
                onClose={handleCloseUserMenu}>
                <MenuItem onClick={() => navigateTo("/student/profile")}>
                  <Typography textAlign="center">Profile</Typography>
                </MenuItem>
                <MenuItem onClick={onClickLogout}>
                  <Typography textAlign="center">Sign Out</Typography>
                </MenuItem>
              </Menu>
            </>
          </Box>
        </Toolbar>
      </AppBar>
      <nav>
        <Drawer
          container={container}
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: "block", sm: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
      </nav>
    </Box>
  );
}

// Navbar.propTypes = {
//   /**
//    * Injected by the documentation to work in an iframe.
//    * You won't need it on your project.
//    */
//   window: PropTypes.func,
// };

export default Navbar;
