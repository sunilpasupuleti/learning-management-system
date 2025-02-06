import { Button, Divider, Grid, TextField } from "@mui/material";
import classes from "./Footer.module.css";
import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

const Footer = () => {
  const location = useLocation();

  const [footerClasses, setFooterClasses] = useState([classes.footer]);

  useEffect(() => {
    const newClasses = [classes.footer];

    if (location.pathname === "/student/courses/view") {
      newClasses.push(classes.courseView);
    }
    setFooterClasses(newClasses);
    // This function will be called whenever the location changes
    // You can perform actions based on the current route here
  }, [location.pathname]); // Include location.pathname in the dependency array

  return (
    <footer className={footerClasses.join(" ")}>
      <Grid container spacing={5}>
        <Grid item md={7}>
          <img
            src={require("../../assets/logo_white.png")}
            alt="..."
            className={classes.logo}
          />
        </Grid>

        <Grid item md={5}>
          <div className={classes.subscriptionContainer}>
            <input
              name="email"
              placeholder="Enter your email here"
              className={classes.input}
            />
            <Button variant="contained">SUBSCRIBE NOW</Button>
          </div>
        </Grid>
      </Grid>
      <Divider sx={{ my: 5, bgcolor: "#263447" }} />
    </footer>
  );
};

export default Footer;
