import * as ReactDOM from "react-dom";
import * as React from "react";

import { motion, AnimatePresence, m } from "framer-motion";

import * as sound from "../sound";

import {
  APP_BACKGROUND,
  DARKMODE_BG,
  DARKMODE_SUBTITLE,
  DARKMODE_TEXT,
  NAVBAR_COLOR,
  PURPLE_HIGHLIGHT,
  TITLE_PURPLE_HIGHLIGHT
} from "./colors";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell } from "@fortawesome/free-regular-svg-icons";
import { SetStreamViewOpenContext } from "./streamview";
import { faGift, faSignOutAlt } from "@fortawesome/free-solid-svg-icons";
import { SourceMapDevToolPlugin } from "webpack";
import { Navbar } from "./navbar";
import { ClipThumb, StreamThumb } from "./thumbnail";
import { CHANNEL_NAME, SetErrorContext, SWATTING_CLIPPER } from "./common";
import { SetRouterStateContext } from "..";
import { persistentState } from "../persist";

export function AppContent() {
  let [error, setError] = React.useState<null | string>(null);
  let [giftedSub, setGiftedSub] = React.useState(false);

  return (
    <SetErrorContext.Provider
      value={(err: string) => {
        sound.error();
        setError(err);
      }}
    >
      <motion.div
        key="menu-page"
        initial={{ transform: "translateX(100%)" }}
        animate={{ transform: "translateX(0%)" }}
        exit={{ transform: "translateX(100%)" }}
        style={{ height: "100%" }}
      >
        {error ? (
          <>
            <div
              onClick={() => setError(null)}
              className="modal-background"
              style={{
                position: "absolute",
                zIndex: 6,
                left: "0px",
                right: "0px",
                width: "100%",
                height: "100%",
                backgroundColor: "rgb(0,0,0, 0.5)",
                display: "flex",
                flexDirection: "column",
                alignContent: "center",
                justifyContent: "center",
                padding: "2em",
                boxSizing: "border-box"
              }}
            >
              <div
                className="modal-popup"
                style={{
                  backgroundColor: APP_BACKGROUND,
                  color: DARKMODE_TEXT,
                  opacity: 1.0,
                  zIndex: 7
                }}
                onClick={e => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <div
                  style={{
                    backgroundColor: PURPLE_HIGHLIGHT,
                    padding: "0.6em",
                    fontWeight: 800,
                    textAlign: "center",
                    fontSize: "120%"
                  }}
                >
                  UNEXPECTED ERROR
                </div>

                <div
                  style={{
                    padding: "1em"
                  }}
                >
                  <div
                    style={{
                      fontSize: "120%"
                    }}
                  >
                    {error}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      justifyContent: "flex-end",
                      marginTop: "1em"
                    }}
                  >
                    <button onClick={() => setError(null)}>OK</button>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <></>
        )}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            height: "100%"
          }}
        >
          <Navbar giftedSub={giftedSub} />

          <div
            className="scrollable-area"
            id="feed-container"
            style={{
              flexGrow: 1,
              width: "100%",
              backgroundColor: APP_BACKGROUND,
              color: DARKMODE_TEXT,
              overflowY: "scroll",

              boxSizing: "border-box",
              paddingLeft: "1em",
              paddingRight: "1em",
              paddingTop: "1.5em"
            }}
          >
            <Clips
              giftSub={() => {
                if (!giftedSub) {
                  setGiftedSub(true);
                  sound.gifted();
                }
              }}
            />
          </div>
        </div>
      </motion.div>
    </SetErrorContext.Provider>
  );
}

export default function Clips(props: { giftSub: () => void }) {
  let setStreamOpen = React.useContext(SetStreamViewOpenContext);
  return (
    <div
      style={{ maxWidth: "100vmin", marginLeft: "auto", marginRight: "auto" }}
    >
      <div
        style={{
          fontSize: "170%",
          fontWeight: 600,
          marginBottom: "1em"
        }}
      >
        <span
          style={{
            color: TITLE_PURPLE_HIGHLIGHT
          }}
        >
          Clips
        </span>{" "}
        we think you'll like
      </div>
      <ClipThumb
        title="EPICJAKE CRIES ON STREAM (MENTAL BREAKDOWN)"
        image={require("../images/epic-jake.png")}
        length="1:12"
        time="3 days ago"
        viewers="5.1K views"
        clipper="blooddragon"
      ></ClipThumb>

      <ClipThumb
        title="AngelAva at the gym ( ͡° ͜ʖ ͡°)"
        length="0:46"
        time="4 days ago"
        viewers="1.3M views"
        clipper="unapologeticSIMP"
        image={require("../images/squats.png")}
      ></ClipThumb>

      <ClipThumb
        title="GAMMAGAMER SWATTED (MISSING)"
        length="0:35"
        time="Yesterday"
        viewers="2.1M views"
        clipper={SWATTING_CLIPPER}
        image={require("../images/swatted.png")}
      ></ClipThumb>

      <ClipThumb
        title="MrJOHNSTER Destroys Keyboard (RAGE QUIT)"
        image={require("../images/mr-johnster.png")}
        length="0:33"
        time="5 days ago"
        viewers="563K views"
        clipper="DerpMike"
      ></ClipThumb>

      <ClipThumb
        title="CREEPY man stalks Kitty360 during IRL stream"
        length="0:45"
        time="2 days ago"
        viewers="132K views"
        clipper="FPSPro"
        image={require("../images/kitty360.png")}
      ></ClipThumb>

      <ClipThumb
        title="TOKYOVLOGS MUGGED IN BROAD DAYLIGHT"
        length="2:31"
        time="6 days ago"
        viewers="42K views"
        clipper="asdfjkl"
        image={require("../images/tokyovlogs.png")}
      ></ClipThumb>

      <div
        style={{
          fontSize: "170%",
          fontWeight: 600,
          marginBottom: "1em"
        }}
      >
        <span
          style={{
            color: TITLE_PURPLE_HIGHLIGHT
          }}
        >
          Live channels
        </span>{" "}
        we think you'll like
      </div>

      <StreamThumb
        image={require("../images/slots.png")}
        title="[18+] Hitting the slots!"
        viewers="213K viewers"
        streamer="CarlJ"
      ></StreamThumb>

      <StreamThumb
        image={require("../images/vtuber.png")}
        title="안녕하세요!"
        viewers="1.4K viewers"
        streamer="아리 ❤️"
      ></StreamThumb>

      <StreamThumb
        image={require("../images/grace-gaming.png")}
        title="Addressing the drama..."
        viewers="3.5K viewers"
        streamer="GraceGaming"
      ></StreamThumb>

      <StreamThumb
        image={require("../images/hot-tub.png")}
        title="Hot tub stream starting soon!"
        viewers="213K viewers"
        streamer="AngelAva"
        onVisible={() => {
          props.giftSub();
        }}
      ></StreamThumb>

      <StreamThumb
        image={require("../images/asmr.png")}
        title="🌸 Relaxing ASMR 🌸"
        viewers="1.3K viewers"
        streamer="JenniferASMR"
      ></StreamThumb>

      <StreamThumb
        title="UNTITLED STREAM"
        viewers="0 viewers"
        streamer={CHANNEL_NAME}
        onClick={() => {
          sound.click();
          setStreamOpen(true);
          persistentState.advancePhase("streamstart");
        }}
      ></StreamThumb>
    </div>
  );
}
