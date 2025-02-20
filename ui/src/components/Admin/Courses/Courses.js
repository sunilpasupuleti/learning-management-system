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
  const { onGetCourses, onDeleteCourse } = useContext(CourseContext);

  const { socket, onFetchEvent, onEmitEvent } = useContext(SocketContext);
  const [courses, setCourses] = useState([]);

  const [orgCourses, setOrgCourses] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const location = useLocation();
  const [mode, setMode] = useState(null);
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [imageUrls, setImageUrls] = useState([]);

  useEffect(() => {
    document.title = title;
  }, []);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const mode = queryParams.get("mode");
    if (mode) {
      setMode(mode);
    } else {
      getCourses();
    }
  }, [location.search]);

  useEffect(() => {
    if (socket) {
      const eventHandler = (data) => {
        getCourses();
      };
      onFetchEvent("refreshCourses", eventHandler);
      return () => {
        socket?.off("refreshCourses", eventHandler);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onFetchEvent, socket]);

  useEffect(() => {
    if (courses && courses.length > 0) {
      fetchImageUrls();
    }
  }, [courses]);

  const fetchImageUrls = async () => {
    try {
      const urls = await Promise.all(
        courses.map(async (course) => {
          try {
            const signedUrl = await generatePresignedUrl(course.banner);
            return signedUrl;
          } catch (err) {
            console.log(err);
            return null;
          }
        })
      );
      setImageUrls(urls);
    } catch (e) {
      console.error("Error fetching presigned URLs:", e);
    }
  };

  const getCourses = () => {
    onGetCourses(
      (result) => {
        setLoading(false);
        if (result && result.courses) {
          setCourses(result.courses);
          setOrgCourses(result.courses);
        }
      },
      true,
      false
    );
  };

  const onChangeSearchKeyword = (e) => {
    let value = e.target.value;
    setSearchKeyword(value);
    let filtered = orgCourses;
    if (value) {
      value = value.toLowerCase();
      let finalCourses = _.cloneDeep(orgCourses);
      filtered = finalCourses.filter((course) => {
        let { title, headline } = course;
        let titleFound = title.toLowerCase().includes(value);
        let headlineFound = headline.toLowerCase().includes(value);

        return titleFound || headlineFound;
      });
    }
    setCourses(filtered);
  };

  const onClickEditCourse = (course) => {
    navigate("?mode=edit&id=" + course._id);
  };

  const onClickDeleteCourse = (course) => {
    Swal.fire({
      title: "Are you sure to delete?",
      text: `${course.title}`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (result.isConfirmed) {
        onDeleteCourse(course._id, (result) => {
          onEmitEvent("refreshCourses");
        });
      }
    });
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <section>
      {!mode && (
        <>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <h2>Available Courses - {courses.length}</h2>
            <Link to={"?mode=create"}>
              <Button variant="contained" startIcon={<FaPlus />}>
                Add New Course
              </Button>
            </Link>
          </Box>

          {orgCourses && orgCourses.length > 0 && (
            <TextField
              margin="normal"
              fullWidth
              id="search"
              variant="standard"
              label="Search By Keyword"
              name="search"
              value={searchKeyword}
              onChange={onChangeSearchKeyword}
            />
          )}

          {courses.length === 0 && !loading && (
            <NotFoundContainer>
              <div>
                <NotFoundText>No Courses Found</NotFoundText>
                <NotFoundContainerImage
                  src={require("../../../assets/no_data.png")}
                  alt="..."
                />
              </div>
            </NotFoundContainer>
          )}
          {courses.length > 0 && (
            <div className={classes.courses}>
              {courses.map((c, i) => {
                let { title, headline, totalDuration, totalLectures, visible } =
                  c;
                totalDuration = (totalDuration / 3600).toFixed(2);
                return (
                  <div key={i} className={`cp ${classes.course}`}>
                    <Grid container spacing={3}>
                      <Grid item md={4} onClick={() => onClickEditCourse(c)}>
                        <img
                          className={classes.banner}
                          src={imageUrls[i]}
                          alt="..."
                        />
                      </Grid>
                      <Grid item md={7} onClick={() => onClickEditCourse(c)}>
                        <div className={classes.courseTitle}>{title}</div>
                        <div className={classes.courseHeadline}>{headline}</div>
                        <div className={classes.durationContainer}>
                          <p className={classes.totalDuration}>
                            {totalDuration} total hours
                          </p>
                          .
                          <p className={classes.totalLectures}>
                            {totalLectures} Lectures
                          </p>
                          {visible && (
                            <div className="ml-0-5">
                              <FaCheckCircle color="#4BB543" size={20} />
                            </div>
                          )}
                        </div>
                      </Grid>

                      <Grid item md={1}>
                        <FaTrash
                          color="red"
                          onClick={() => onClickDeleteCourse(c)}
                        />
                      </Grid>
                    </Grid>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
      {mode && <CreateEditCourse mode={mode} />}
    </section>
  );
};

export default Courses;
