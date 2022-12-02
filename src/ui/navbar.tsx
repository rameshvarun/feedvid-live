import * as ReactDOM from "react-dom";
import * as React from "react";
import { motion, AnimatePresence, m } from "framer-motion";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { faBell } from "@fortawesome/free-regular-svg-icons";
import { faGift, faSignOutAlt } from "@fortawesome/free-solid-svg-icons";

import {
  APP_BACKGROUND,
  DARKMODE_BG,
  DARKMODE_SUBTITLE,
  DARKMODE_TEXT,
  NAVBAR_COLOR,
  PURPLE_HIGHLIGHT,
  TITLE_PURPLE_HIGHLIGHT
} from "./colors";
import { CHANNEL_NAME, SWATTING_CLIPPER } from "./common";

import * as sound from "../sound";
import { SetRouterStateContext } from "..";
import { persistentState } from "../persist";

export function Navbar(props: { giftedSub: boolean }) {
  const [notificationsOpen, setNotificationsOpen] = React.useState(false);
  const [userPaneOpen, setUserPaneOpen] = React.useState(false);

  const navigate = React.useContext(SetRouterStateContext);

  return (
    <div
      style={{
        zIndex: 5
      }}
    >
      <div
        className="navbar"
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingBottom: "0.5em",
          paddingTop: "0.5em",
          backgroundColor: NAVBAR_COLOR,
          boxShadow: "0px 0px 0.2em 0.1em rgba(0,0,0,0.75)",
          color: "white",
          zIndex: 5,
          paddingLeft: "0.8em",
          paddingRight: "0.8em"
        }}
      >
        <span
          className="navbar-highlight"
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            cursor: "pointer",
            padding: "0.5em",
            borderRadius: "0.25em"
          }}
          onClick={() => {
            if (!userPaneOpen) {
              setNotificationsOpen(false);
            }
            setUserPaneOpen(!userPaneOpen);
            sound.click();
          }}
        >
          <img
            style={{ width: "2.8em" }}
            src={require("../assets/ui/avatar.svg")}
          ></img>
          <span style={{ marginLeft: "0.7em", fontWeight: 600 }}>
            {persistentState.user?.username}
          </span>
        </span>

        <div
          style={{
            display: "inline-block",
            position: "relative"
          }}
        >
          <div
            className="navbar-highlight"
            style={{
              cursor: "pointer",
              padding: "0.6em",
              borderRadius: "0.25em"
            }}
            onClick={() => {
              if (!notificationsOpen) {
                setUserPaneOpen(false);
              }
              setNotificationsOpen(!notificationsOpen);
              sound.click();
            }}
          >
            <FontAwesomeIcon
              style={{
                fontSize: "200%"
              }}
              icon={faBell}
            />

            {props.giftedSub ? (
              <div
                className="notification-badge"
                style={{
                  fontSize: "90%",
                  position: "absolute",
                  top: "-0.5em",
                  right: "0.0em",
                  backgroundColor: "red",
                  width: "1.6em",
                  height: "1.6em",
                  textAlign: "center",
                  borderRadius: "50%",
                  fontWeight: 600,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  color: "white"
                }}
              >
                <span>1</span>
              </div>
            ) : (
              <></>
            )}
          </div>
        </div>
      </div>

      {notificationsOpen ? (
        <motion.div
          key="notifications-dropdown"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
        >
          <div
            style={{
              position: "absolute",
              boxShadow: "0px 0px 0.2em 0.1em black",
              right: "0.5em",
              top: "4em",
              flexDirection: "column",
              width: "20em",
              display: "flex",
              backgroundColor: NAVBAR_COLOR,
              borderRadius: "0.25em",
              boxSizing: "border-box",
              zIndex: 6,
              color: DARKMODE_TEXT
            }}
          >
            <div
              style={{
                width: "100%",
                padding: "0.6em",
                textAlign: "center",
                fontWeight: 600,
                boxShadow: "0px 0px 0.1em 0.1em rgba(0,0,0,0.6)",
                boxSizing: "border-box",
                fontSize: "120%"
              }}
            >
              Notifications
            </div>

            {props.giftedSub ? (
              <div
                style={{
                  padding: "0.8em"
                }}
              >
                <div
                  className="navbar-highlight"
                  style={{
                    padding: "0.8em",
                    borderRadius: "0.25em",
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    color: DARKMODE_TEXT
                  }}
                >
                  <div
                    style={{
                      fontSize: "300%"
                    }}
                  >
                    <FontAwesomeIcon icon={faGift} />
                  </div>
                  <div
                    style={{
                      paddingLeft: "1em",
                      lineHeight: 1.5
                    }}
                  >
                    <span className="notification-highlight">
                      {SWATTING_CLIPPER}
                    </span>{" "}
                    gifted you a Subscription to{" "}
                    <span className="notification-highlight">
                      {CHANNEL_NAME}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div
                style={{
                  padding: "1.5em",
                  color: DARKMODE_TEXT,
                  textAlign: "center"
                }}
              >
                No new notifications.
              </div>
            )}
          </div>
        </motion.div>
      ) : (
        <></>
      )}

      {userPaneOpen ? (
        <motion.div
          key="username-dropdown"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
        >
          <div
            style={{
              position: "absolute",
              boxShadow: "0px 0px 0.2em 0.1em black",
              left: "0.5em",
              top: "4em",
              flexDirection: "column",
              width: "15em",
              display: "flex",
              backgroundColor: NAVBAR_COLOR,
              borderRadius: "0.25em",
              boxSizing: "border-box",
              zIndex: 6,
              color: "white",
              padding: "0.5em"
            }}
          >
            <div
              className="navbar-highlight"
              style={{
                cursor: "pointer",
                padding: "0.5em",
                borderRadius: "0.25em"
              }}
              onClick={() => {
                sound.click();
                window.location.reload();
              }}
            >
              <FontAwesomeIcon icon={faSignOutAlt} />{" "}
              <span
                style={{
                  paddingLeft: "0.5em",
                  fontSize: "110%"
                }}
              >
                Exit to Menu
              </span>
            </div>
          </div>
        </motion.div>
      ) : (
        <></>
      )}
    </div>
  );
}
