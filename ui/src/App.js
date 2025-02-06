import "./App.css";
import { Notification } from "./shared/Notification/Notification";
import Layout from "./layout/Layout";
import { ThemeProvider, createTheme } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import { useEffect } from "react";
import { gapi } from "gapi-script";
import Loader from "./shared/Loader/Loader";

const theme = createTheme({
  palette: {
    primary: {
      main: "#5f2ded",
    },
  },
});

function App() {
  useEffect(() => {
    function start() {
      gapi.client.init({
        clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID,
        scope: "email",
      });
    }

    gapi.load("client:auth2", start);
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterMoment}>
        <Loader />
        <Notification />
        <Layout />
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;
