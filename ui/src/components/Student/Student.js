import { Outlet } from "react-router-dom";
import Navbar from "../../shared/Navbar/Navbar";
import { Box, Toolbar } from "@mui/material";
import Footer from "../../shared/Footer/Footer";
import Loader from "../../shared/Loader/Loader";
import classes from "./Student.module.css";
import { FaChevronUp } from "react-icons/fa";
import { scrollToTop } from "../../utility/helper";

const Student = () => {
  return (
    <>
      <div className={classes.scrollButton} onClick={scrollToTop}>
        <FaChevronUp className={classes.scrollIcon} />
      </div>

      <Navbar />
      <Box
        component="main"
        sx={{ p: 3, minHeight: "100vh", marginBottom: 30 }}
        className="mainContainer"
      >
        <Toolbar />
        <Outlet />
      </Box>
      <Footer />
    </>
  );
};

export default Student;
