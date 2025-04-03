/* eslint-disable react/jsx-no-duplicate-props */
import { useContext, useEffect, useState } from "react";
import {
  NotFoundContainer,
  NotFoundContainerImage,
  NotFoundText,
} from "../../../styles";
import { Box, TextField, Grid } from "@mui/material";
import { FaCheckCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import _ from "lodash";
import classes from "./StudentCourses.module.css";

import { CourseContext } from "../../../services/Courses/Courses.context";
import { generatePresignedUrl } from "../../../utility/s3Helpers";

const StudentCourses = ({ title }) => {
  const { onGetCourses } = useContext(CourseContext);

  const [courses, setCourses] = useState([]);
  const [orgCourses, setOrgCourses] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [imageUrls, setImageUrls] = useState([]);

  useEffect(() => {
    document.title = title;
    getCourses();
  }, []);

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

  const onClickViewCourse = (course) => {
    navigate("view?id=" + course._id);
  };

  return (
    <section>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <h2>Available Courses - {courses.length}</h2>
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
            let { title, headline, totalDuration, totalLectures, visible } = c;
            totalDuration = (totalDuration / 3600).toFixed(2);
            return (
              <div key={i} className={`cp ${classes.course}`}>
                <Grid container spacing={3}>
                  <Grid item md={4} onClick={() => onClickViewCourse(c)}>
                    <img
                      className={classes.banner}
                      src={imageUrls[i]}
                      alt="..."
                    />
                  </Grid>
                  <Grid item md={8} onClick={() => onClickViewCourse(c)}>
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
                </Grid>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default StudentCourses;
