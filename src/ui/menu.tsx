import * as ReactDOM from "react-dom";
import * as React from "react";

import { motion, AnimatePresence } from "framer-motion";

import { APP_BACKGROUND, DARKMODE_BG, PURPLE_HIGHLIGHT } from "./colors";
import * as sound from "../sound";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimesCircle } from "@fortawesome/free-regular-svg-icons";
import { SetRouterStateContext } from "..";
import {
  faStar,
  faArrowLeft,
  faCaretLeft,
  faExclamationCircle,
  faInfoCircle
} from "@fortawesome/free-solid-svg-icons";
import { persistentState } from "../persist";
import { SetStreamViewOpenContext } from "./streamview";

export default function Menu() {
  let navigate = React.useContext(SetRouterStateContext);
  let setStreamViewOpen = React.useContext(SetStreamViewOpenContext);

  return (
    <motion.div
      key="menu-page"
      initial={{ transform: "translateX(-100%)" }}
      animate={{ transform: "translateX(0%)" }}
      exit={{ transform: "translateX(-100%)" }}
      style={{ height: "100%" }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-evenly",
          height: "100%",
          alignItems: "center",
          backgroundColor: PURPLE_HIGHLIGHT
        }}
      >
        <img
          src={require("../assets/ui/logo.svg")}
          style={{ width: "23.5em" }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "align"
          }}
        >
          {persistentState.user ? (
            <button
              onClick={() => {
                sound.click();
                if (persistentState.user) {
                  // Either send us to the feed, or open the stream view.
                  if (persistentState.user.phase === "feed") {
                    navigate("feed");
                  } else {
                    setStreamViewOpen(true);
                  }
                }
              }}
              type="button"
              className="menu-button"
              style={{ marginTop: "1.3em" }}
            >
              CONTINUE AS {persistentState.user.username}
            </button>
          ) : (
            <></>
          )}
          <button
            onClick={() => {
              sound.click();
              navigate("signup");
            }}
            type="button"
            className="menu-button"
            style={{ marginTop: "0.5em" }}
          >
            NEW GAME
          </button>
        </div>

        <div
          style={{
            position: "absolute",
            right: "0.5em",
            bottom: "0.5em",
            fontSize: "300%",
            color: "white"
          }}
        >
          <span
            style={{ cursor: "pointer" }}
            onClick={() => {
              sound.click();
              navigate("appinfo");
            }}
          >
            <FontAwesomeIcon icon={faInfoCircle} />
          </span>
        </div>

        {persistentState.completed ? (
          <div
            style={{
              position: "absolute",
              top: "0.5em",
              right: "0.5em",
              fontSize: "300%",
              color: "white"
            }}
          >
            <FontAwesomeIcon style={{ margin: "10px" }} icon={faStar} />
          </div>
        ) : null}
      </div>
    </motion.div>
  );
}

export function Signup() {
  let navigate = React.useContext(SetRouterStateContext);

  let usernameRef = React.useRef<HTMLInputElement>(null);
  let ageRef = React.useRef<HTMLInputElement>(null);

  let [error, setError] = React.useState<string | null>(null);

  return (
    <motion.div
      key="menu-page"
      initial={{ transform: "translateX(100%)" }}
      animate={{ transform: "translateX(0%)" }}
      exit={{ transform: "translateX(100%)" }}
      style={{ height: "100%" }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-evenly",
          height: "100%",
          alignItems: "center",
          color: "white",
          backgroundColor: DARKMODE_BG
        }}
      >
        <img
          src={require("../assets/ui/logo-purple.svg")}
          style={{ width: "23.5em" }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            textAlign: "left",
            paddingLeft: "1.2em",
            paddingRight: "1.2em",
            rowGap: "1em"
          }}
        >
          <div style={{ fontSize: "130%" }}>
            <div
              style={{
                fontSize: "120%",
                fontWeight: 600,
                marginBottom: "0.25em",
                color: "white"
              }}
            >
              Username
            </div>
            <input ref={usernameRef} className="chat-text-box" type="text" />
          </div>
          <div style={{ fontSize: "130%" }}>
            <div
              style={{
                fontSize: "120%",
                fontWeight: 600,
                marginBottom: "0.25em",
                color: "white"
              }}
            >
              Age
            </div>
            <input ref={ageRef} className="chat-text-box" type="text" />
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "right"
          }}
        >
          <button
            onClick={() => {
              let username = usernameRef.current!.value.toLowerCase().trim();
              let age = parseInt(ageRef.current!.value);

              if (username.length < 2 || username.length > 12) {
                setError("Your username must be between 2 and 12 characters.");
                sound.error();
                return;
              }

              const USERNAME_REGEX = /^[a-z0-9_]+$/;
              if (username.match(USERNAME_REGEX) == null) {
                setError(
                  "Your username may only consist of letters, numbers, and underscores."
                );
                sound.error();
                return;
              }

              if (Number.isNaN(age)) {
                setError("Invalid age.");
                sound.error();
                return;
              }

              if (age < 16) {
                setError("You must be at least 16 to sign up.");
                sound.error();
                return;
              }

              persistentState.startNewGame(usernameRef.current!.value);

              sound.click();
              navigate("feed");
            }}
            type="button"
            className="menu-button"
          >
            START GAME
          </button>
        </div>

        <div
          style={{
            padding: "2em",
            textAlign: "center",
            color: "red",
            fontSize: "120%",
            visibility: error ? "visible" : "hidden",
            minHeight: "2.5em"
          }}
        >
          <FontAwesomeIcon icon={faExclamationCircle} /> {error}
        </div>

        <div
          style={{
            position: "absolute",
            top: "1.5em",
            left: "1.5em",
            color: "white"
          }}
        >
          <span
            style={{ cursor: "pointer", fontSize: "250%" }}
            onClick={() => {
              sound.click();
              navigate("home");
            }}
          >
            <FontAwesomeIcon icon={faArrowLeft} />
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export function AppInfo() {
  let navigate = React.useContext(SetRouterStateContext);

  return (
    <motion.div
      key="menu-page"
      initial={{ transform: "translateX(100%)" }}
      animate={{ transform: "translateX(0%)" }}
      exit={{ transform: "translateX(100%)" }}
      style={{ height: "100%" }}
    >
      <div
        className="scrollable-area"
        style={{
          height: "100%",
          overflowY: "scroll",
          backgroundColor: DARKMODE_BG
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            color: "white",
            paddingLeft: "2em",
            paddingRight: "2em",
            paddingTop: "4em",
            paddingBottom: "2em"
          }}
        >
          <img
            src={require("../assets/ui/logo-purple.svg")}
            style={{ width: "20.5em" }}
          />
          <div>{VERSION}</div>

          <p
            style={{
              marginTop: "10px",
              fontSize: "110%",
              marginBottom: "0.8em"
            }}
          >
            Created by Varun R.
          </p>
          <div style={{ maxWidth: "100vmin" }}>
            <div>
              <p>
                "Inter" font by Rasmus Andersson (Open Font License),
                "Twitchy.TV" font by MaxiGamer
              </p>
              <p>
                "Pumpkin Demon" by WinnieTheMoog (Filmmusic Standard License)
              </p>

              <p>Textures from textures.com</p>
              <p>VTuber model created using VRoid Studio</p>

              <p>"SWAT" model from Mixamo</p>

              <p>
                Stock images used under license from Shutterstock and iStock
              </p>

              <p>
                Text-To-Speech clips generated using Textreader Pro and
                Streamlabs voices
              </p>

              <p>
                <b>Pond5:&nbsp;</b>
                StormwaveAudio, sounddogs, NPGGPVA, TibaSound, DavidKayserMusic,
                tobydalsgaard
              </p>

              <p>
                <b>Freesound:&nbsp;</b>
                "Notification Sound" by yfjesse (CC0), "Menu Selection Click" by
                NenadSimic (CC0), "Camera Shutter, Fast, A.wav" by InspectorJ
                (CC BY 3.0), "Cash Register Purchase" by Zott820 (CC0), "Hover
                1" by plasterbrain (CC0), "toiletlid.mp3" by wrenshep098 (CC0),
                "Footsteps, Tile, Male Sneakers, Slow Pace.wav" by SpliceSound
                (CC0), "Heater" by samuelcable (CC0), "Door Open Close" by
                amholma (CC0), "Wood Footsteps" by mypantsfelldown (CC BY 3.0),
                "paving_15b_darkshoes_shuffle_tap.wav" by sturmankin (CC0),
                "ceramicCups4.wav" by kikuchiyo (CC0), "Bar stool shuffle.wav"
                by Didi0508 (CC BY-NC 3.0), "Bathroom Door Stall Lock" by
                mhtaylor67 (CC0), "Door Unlock" by angelkunev (CC BY-NC 3.0),
                "Keycard lock + code.aif" by Ubehag (CC0), "Door, Wooden, Close,
                A (H1).wav" by InspectorJ (CC BY 3.0), "Handsaw" by EminYILDIRIM
                (CC BY 3.0), "KEYPAD FAIL/OK" by PMBROWNE (CC BY 3.0), "street
                building front_door code_beeps_door open close RX .wav" by
                martian (CC0), "Wooden Box Breaking Sound Effects.wav" by
                gronnie (CC BY 3.0), "Bear Trap" by ThePriest909 (CC0), "Hard
                Breathing / Painful" by NSDAP (CC0), "Bamboo Swing, A4.wav" by
                InspectorJ (CC BY 3.0)
              </p>

              <p>
                <b>Sketchfab:&nbsp;</b>
                "Toilet" by HippoStance (CC BY 4.0), "Low Poly Screwdriver Game
                Ready" by Arthur.Zim (CC BY 4.0) "Metal door" by tboiston (CC BY
                4.0), "ApertureVR ARG - Keypad" by josephthekp (CC BY-NC 4.0),
                "Saw Tool" by TraianDumbrava (CC BY 4.0), "Nail - LowPoly" by
                Gamedirection (CC BY 4.0), "Stick With Blade" by Thunder (CC
                BY-SA 4.0), "SmartPhone" by shedmon (CC BY 4.0)
              </p>

              <p>
                <b>OpenGameArt:&nbsp;</b>
                "Rigged, textured Reptile" by thecubber (CC BY 3.0), "Low-poly
                human male + Simple IK Rig" by danm3d (CC0)
              </p>
            </div>
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            top: "1.5em",
            left: "1.5em",
            color: "white"
          }}
        >
          <span
            style={{ cursor: "pointer", fontSize: "250%" }}
            onClick={() => {
              sound.click();
              navigate("home");
            }}
          >
            <FontAwesomeIcon icon={faArrowLeft} />
          </span>
        </div>
      </div>
    </motion.div>
  );
}
