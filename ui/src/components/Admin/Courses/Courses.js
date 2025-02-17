/* eslint-disable react/jsx-no-duplicate-props */
import { useContext, useEffect, useState } from "react";
import {
  NotFoundContainer,
  NotFoundContainerImage,
  NotFoundText,
} from "../../../styles";
import CheckIcon from "@mui/icons-material/CheckCircle";
import { Box, Button, TextField, Grid } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import { FaCheckCircle, FaPlus, FaTrash } from "react-icons/fa";
import { Link, useLocation, useNavigate } from "react-router-dom";
import _ from "lodash";
import Swal from "sweetalert2";
import classes from "./Courses.module.css";

import { SocketContext } from "../../../services/Socket/Socket.context";
import { CourseContext } from "../../../services/Courses/Courses.context";
import CreateEditCourse from "./CreateEditCourse";
import { generatePresignedUrl } from "../../../utility/s3Helpers";
import { formatVideoDuration } from "../../../utility/helper";

const Courses = ({ title }) => {
  return (
    <>
      <CreateEditCourse mode={"create"} />
    </>
  );
};

export default Courses;
