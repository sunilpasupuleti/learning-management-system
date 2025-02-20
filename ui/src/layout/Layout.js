import { Route, Routes, useLocation } from "react-router-dom";
import { GetAuthGuard } from "./Guards";
import { SocketContextProvider } from "../services/Socket/Socket.context";
import { AuthenticationContextProvider } from "../services/Authentication/Authentication.context";

import PageNotFound from "../components/NotFound/PageNotFound";
import { AnimatePresence } from "framer-motion";
import Signin from "../components/Auth/Signin/Signin";
import Signup from "../components/Auth/Signup/Signup";
import Verify from "../components/Auth/Signup/Verify";
import ResetPassword from "../components/Auth/ResetPassword/ResetPassword";
import Dashboard from "../components/Admin/Dashboard";
import { BatchesContextProvider } from "../services/Batches/Batches.context";
import Batches from "../components/Admin/Batches/Batches";
import CreateEditBatch from "../components/Admin/Batches/CreateEditBatch";
import Users from "../components/Admin/Users/Users";
import { QuizContextProvider } from "../services/Quiz/Quiz.context";
import Quiz from "../components/Admin/Quiz/Quiz";
import StudentQuiz from "../components/Student/StudentQuiz/StudentQuiz";
import Student from "../components/Student/Student";
import StudentQuizStart from "../components/Student/StudentQuiz/StudentQuizStart";
import { ReportsContextProvider } from "../services/Reports/Reports.context";
import StudentReports from "../components/Student/StudentReports/StudentReports";
import StudentReportView from "../components/Student/StudentReports/StudentReportView";
import Reports from "../components/Admin/Reports/Reports";
import ReportView from "../components/Admin/Reports/ReportView";
import { CourseContextProvider } from "../services/Courses/Courses.context";
import Courses from "../components/Admin/Courses/Courses";
import StudentCourses from "../components/Student/StudentCourses/StudentCourses";
import StudentCourseView from "../components/Student/StudentCourses/StudentCourseView";
import { ResourcesContextProvider } from "../services/Resources/Resources.context";
import Resources from "../components/Admin/Resources/Resources";
import StudentResources from "../components/Student/StudentResources/StudentResources";
import { HelperContextProvider } from "../services/Helper/Helper.context";
import BatchesHome from "../components/Admin/Batches/BatchesHome";
import UsersHome from "../components/Admin/Users/UsersHome";
import CreateEditUser from "../components/Admin/Users/CreateEditUser";
import QuizHome from "../components/Admin/Quiz/QuizHome";
import CreateEditQuiz from "../components/Admin/Quiz/CreateEditQuiz";
import StudentProfile from "../components/Student/StudentProfile/StudentProfile";
import { UsersContextProvider } from "../services/users/users.context";
import SignOut from "../components/Auth/SignOut/SignOut";

const Layout = (props) => {
  const location = useLocation();

  const StudentQuizElement = ({ title }) => {
    return (
      <QuizContextProvider>
        <StudentQuiz title={title} />
      </QuizContextProvider>
    );
  };

  const StudentQuizStartElement = ({ title }) => {
    return (
      <QuizContextProvider>
        <StudentQuizStart title={title} />
      </QuizContextProvider>
    );
  };

  const StudentReportsElement = ({ title }) => {
    return (
      <ReportsContextProvider>
        <StudentReports title={title} />
      </ReportsContextProvider>
    );
  };

  const StudentReportViewElement = ({ title }) => {
    return (
      <ReportsContextProvider>
        <StudentReportView title={title} />
      </ReportsContextProvider>
    );
  };

  const ReportsElement = ({ title }) => {
    return (
      <ReportsContextProvider>
        <Reports title={title} />
      </ReportsContextProvider>
    );
  };

  const ReportViewElement = ({ title }) => {
    return (
      <ReportsContextProvider>
        <ReportView title={title} />
      </ReportsContextProvider>
    );
  };

  const CoursesElement = ({ title }) => {
    return (
      <BatchesContextProvider>
        <CourseContextProvider>
          <Courses title={title} />
        </CourseContextProvider>
      </BatchesContextProvider>
    );
  };

  const StudentCoursesElement = ({ title }) => {
    return (
      <CourseContextProvider>
        <StudentCourses title={title} />
      </CourseContextProvider>
    );
  };

  const StudentCoursesViewElement = ({ title }) => {
    return (
      <CourseContextProvider>
        <StudentCourseView title={title} />
      </CourseContextProvider>
    );
  };

  const ResourcesElement = ({ title }) => {
    return (
      <ResourcesContextProvider>
        <Resources title={title} />
      </ResourcesContextProvider>
    );
  };

  const StudentResourcesElement = ({ title }) => {
    return (
      <ResourcesContextProvider>
        <StudentResources title={title} />
      </ResourcesContextProvider>
    );
  };

  const StudentProfileElement = ({ title }) => {
    return (
      <UsersContextProvider>
        <StudentProfile title={title} />
      </UsersContextProvider>
    );
  };

  return (
    <SocketContextProvider>
      <AuthenticationContextProvider>
        <HelperContextProvider>
          <AnimatePresence mode="wait">
            <Routes key={location.pathname} location={location}>
              <Route path="/" element={<Signin title="Sign In" />} />

              <Route path="/auth">
                <Route path="signin" element={<Signin title="Sign In" />} />
                <Route path="signup" element={<Signup title="Sign Up" />} />
                <Route path="signout" element={<SignOut title="Sign Out" />} />
                <Route
                  path="verify/:verificationToken"
                  element={<Verify title="Verification" />}
                />
                <Route
                  path="reset-password/:resetPasswordToken"
                  element={<ResetPassword title="Reset Password" />}
                />
              </Route>

              <Route
                path="/student"
                element={
                  <GetAuthGuard
                    component={<Student title="Student" />}
                    to={"/auth/signin"}
                  />
                }
              >
                <Route
                  path="quiz"
                  element={<StudentQuizElement title="Available Quizes" />}
                />
                <Route
                  path="courses"
                  element={<StudentCoursesElement title="Courses" />}
                />

                <Route
                  path="courses/view"
                  element={<StudentCoursesViewElement title="Course View" />}
                />

                <Route
                  path="quiz/start"
                  element={<StudentQuizStartElement title="Start Quiz" />}
                />
                <Route
                  path="reports"
                  element={<StudentReportsElement title="Reports" />}
                />

                <Route
                  path="resources"
                  element={<StudentResourcesElement title="Resources" />}
                />

                <Route
                  path="reports/view"
                  element={<StudentReportViewElement title="View Report" />}
                />
                <Route
                  path="profile"
                  element={<StudentProfileElement title="Profile" />}
                />
              </Route>

              <Route
                path="/dashboard"
                element={
                  <GetAuthGuard
                    component={<Dashboard title="Dashboard" />}
                    to={"/auth/signin"}
                  />
                }
              >
                <Route path="batches" element={<BatchesHome title="Batches" />}>
                  <Route path="" element={<Batches title="Batches" />} />
                  <Route
                    path="create"
                    element={<CreateEditBatch mode={"create"} />}
                  />
                  <Route
                    path="edit"
                    element={<CreateEditBatch mode={"edit"} />}
                  />
                </Route>
                <Route
                  path="courses"
                  element={<CoursesElement title="Courses" />}
                />

                <Route
                  path="resources"
                  element={<ResourcesElement title="Resources" />}
                />
                <Route path="users" element={<UsersHome title="Users" />}>
                  <Route path="" element={<Users title="Users" />} />
                  <Route
                    path="create"
                    element={<CreateEditUser mode={"create"} />}
                  />
                  <Route
                    path="edit"
                    element={<CreateEditUser mode={"edit"} />}
                  />
                </Route>
                <Route path="quiz" element={<QuizHome title="Quiz" />}>
                  <Route path="" element={<Quiz title="Quiz" />} />
                  <Route
                    path="create"
                    element={<CreateEditQuiz mode={"create"} />}
                  />
                  <Route
                    path="edit"
                    element={<CreateEditQuiz mode={"edit"} />}
                  />
                </Route>
                <Route
                  path="reports"
                  element={<ReportsElement title="Reports" />}
                />

                <Route
                  path="reports/view"
                  element={<ReportViewElement title="View Report" />}
                />
              </Route>
              <Route
                path="*"
                element={<PageNotFound title="Page Not Found" />}
              />
            </Routes>

            {/* <main>
            <Outlet />
          </main> */}
          </AnimatePresence>
        </HelperContextProvider>
      </AuthenticationContextProvider>
    </SocketContextProvider>
  );
};

export default Layout;
