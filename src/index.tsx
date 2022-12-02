import * as ReactDOM from "react-dom";
import * as React from "react";

import * as utils from "./utils";

import "normalize.css";

import "./inter.scss";
import "./styles.scss";

import { PURPLE_HIGHLIGHT } from "./ui/colors";

import Menu, { AppInfo, Signup } from "./ui/menu";
import { AppContent } from "./ui/feed";
import { StreamView, SetStreamViewOpenContext } from "./ui/streamview";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faExclamationTriangle,
  faExpand,
  faHeadphones
} from "@fortawesome/free-solid-svg-icons";
import { Credits, SetCreditsViewOpenContext } from "./ui/credits";
import { DETECTIONS } from "./detections";

const velocity = require("velocity-animate");

// The aspect ratio of the simulated phone when in "desktop mode".
const PHONE_ASPECT_RATIO = 9.0 / 16.0;

// When the aspect ratio of the whole screen is less than this, switch to mobile mode.
const MOBILE_MODE_ASPECT_RATIO = 11.0 / 16.0;

class Warnings extends React.Component<
  {},
  { phase: "visible" | "fading" | "gone" }
> {
  constructor(props) {
    super(props);
    this.state = { phase: "visible" };
  }

  componentDidMount() {
    const contentWarning = document.getElementById("content-warning")!;
    const headphoneWarning = document.getElementById("headphone-warning")!;

    (async () => {
      velocity(contentWarning, { opacity: 1 }, { duration: 1000 });
      await utils.wait(4000);
      velocity(contentWarning, { opacity: 0 }, { duration: 1000 });

      await utils.wait(1000);
      velocity(headphoneWarning, { opacity: 1 }, { duration: 1000 });
      await utils.wait(4000);
      velocity(headphoneWarning, { opacity: 0 }, { duration: 1000 });
      await utils.wait(1000);

      this.startFade();
    })();
  }

  startFade() {
    if (this.state.phase === "visible") {
      this.setState({ phase: "fading" });

      const warningContainer = document.getElementById("warning-container")!;
      velocity(warningContainer, { opacity: 0 }, { duration: 1000 });

      setTimeout(() => {
        this.setState({ phase: "gone" });
      }, 2000);
    }
  }

  render() {
    if (this.state.phase !== "gone") {
      return (
        <div
          id="warning-container"
          style={{
            width: "100%",
            height: "100%",
            left: "0px",
            top: "0px",
            backgroundColor: "black",
            position: "absolute",
            zIndex: 20,

            color: "white",

            pointerEvents: this.state.phase === "visible" ? "inherit" : "none"
          }}
          onClick={() => {
            this.startFade();
          }}
        >
          <div
            id="content-warning"
            style={{
              zIndex: 21,

              width: "100%",
              height: "100%",
              left: "0px",
              top: "0px",
              position: "absolute",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",

              display: "flex",

              opacity: 0
            }}
          >
            <div style={{ fontSize: "15vmin" }}>
              <FontAwesomeIcon
                style={{ margin: "10px" }}
                icon={faExclamationTriangle}
              />
            </div>
            <div
              style={{
                fontSize: "4vmin",
                textAlign: "center",
                paddingLeft: "10vmin",
                paddingRight: "10vmin",
                marginTop: "2vmin"
              }}
            >
              This game contains content that may be distressing to some
              players.
            </div>
          </div>

          <div
            id="headphone-warning"
            style={{
              zIndex: 21,

              width: "100%",
              height: "100%",
              left: "0px",
              top: "0px",
              position: "absolute",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",

              display: "flex",

              opacity: 0
            }}
          >
            <div style={{ fontSize: "15vmin" }}>
              <FontAwesomeIcon style={{ margin: "10px" }} icon={faHeadphones} />
            </div>
            <div
              style={{
                fontSize: "4vmin",
                textAlign: "center",
                paddingLeft: "10vmin",
                paddingRight: "10vmin",
                marginTop: "2vmin"
              }}
            >
              Headphones are recommended.
            </div>
          </div>
        </div>
      );
    }
    return <></>;
  }
}

export function FullscreenToggle(props: { mobile: boolean }) {
  return (
    <div
      style={{
        position: "fixed",
        right: "20px",
        bottom: "20px",
        fontSize: "40px",
        zIndex: 1,
        color: "white",
        display: props.mobile ? "none" : "inherit"
      }}
    >
      <span
        style={{
          cursor: "pointer"
        }}
        onClick={() => utils.toggleFullscreen()}
      >
        <FontAwesomeIcon icon={faExpand} />
      </span>
    </div>
  );
}

type RouterState = "home" | "signup" | "feed" | "appinfo";
export const SetRouterStateContext: React.Context<(
  state: RouterState
) => void> = React.createContext(state => {});

class App extends React.Component<
  {},
  {
    routerState: RouterState;
    aspectRatio: number;
    streamOpen: boolean;
    creditsOpen: boolean;
  }
> {
  constructor(props) {
    super(props);

    const width = window.innerWidth;
    const height = window.innerHeight;

    this.state = {
      routerState: "home",
      aspectRatio: width / height,
      streamOpen: false,
      creditsOpen: false
    };

    window.onresize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      this.setState(state => ({
        aspectRatio: width / height
      }));
    };
  }

  componentDidMount() {
    const root = document.getElementById("root")!;
    root.style.background = `url('${require("./images/background.png")}') no-repeat center center`;
    root.style.backgroundSize = "cover";
  }

  render() {
    let mobileMode =
      this.state.aspectRatio < MOBILE_MODE_ASPECT_RATIO ||
      (DETECTIONS.mobile && !DETECTIONS.iPad);

    const router = (
      <>
        {this.state.routerState === "home" && <Menu />}
        {this.state.routerState === "signup" && <Signup />}
        {this.state.routerState === "appinfo" && <AppInfo />}
        {this.state.routerState === "feed" && <AppContent />}
      </>
    );

    let appView: React.ReactElement | null = null;
    if (mobileMode) {
      appView = (
        <div
          key="app-view-container"
          style={{
            height: "100%",
            width: "100%"
          }}
        >
          <div
            key="app-view"
            id="app-view"
            className="app-background scrollable-area"
            style={{
              overflowY: "scroll",
              scrollbarWidth: "none",
              overflowX: "hidden",
              height: "100%",
              fontSize:
                Math.ceil(
                  Math.min(window.innerWidth, window.innerHeight) / 30
                ) + "px",
              zIndex: 0,
              backgroundColor: PURPLE_HIGHLIGHT
            }}
          >
            {router}
          </div>
        </div>
      );
    } else {
      const height = window.innerHeight;
      const width = height * PHONE_ASPECT_RATIO;
      appView = (
        <div
          key="app-view-container"
          style={{
            filter: "drop-shadow(0px 0px 1em black)",
            fontSize: Math.ceil(width / 30) + "px"
          }}
        >
          <img
            style={{
              right: window.innerWidth / 2 - width / 2 + width + "px",
              position: "absolute",
              height: height + "px",
              zIndex: 1
            }}
            src={require("./images/left-border.png")}
          ></img>

          <img
            style={{
              left: window.innerWidth / 2 - width / 2 + width + "px",
              position: "absolute",
              height: height + "px",
              zIndex: 1
            }}
            src={require("./images/right-border.png")}
          ></img>

          <div
            key="app-view"
            id="app-view"
            className="app-background"
            style={{
              left: window.innerWidth / 2 - width / 2 + "px",
              overflowY: "hidden",
              overflowX: "hidden",
              position: "absolute",
              height: height + "px",
              width: width + "px",
              zIndex: 0,
              backgroundColor: "black"
            }}
          >
            {router}
          </div>
        </div>
      );
    }

    return (
      <SetRouterStateContext.Provider
        value={(state: RouterState) => {
          this.setState({ routerState: state });
        }}
      >
        <SetStreamViewOpenContext.Provider
          value={(open: boolean) => {
            this.setState({ streamOpen: open });
          }}
        >
          <SetCreditsViewOpenContext.Provider
            value={(open: boolean) => {
              this.setState({ creditsOpen: open });
            }}
          >
            <Warnings />
            {this.state.streamOpen ? (
              <StreamView
                showCredits={() => {
                  this.setState({ creditsOpen: true });
                }}
              />
            ) : (
              <></>
            )}
            {this.state.creditsOpen ? <Credits mobile={mobileMode} /> : <></>}
            {appView}

            <FullscreenToggle mobile={mobileMode} />
          </SetCreditsViewOpenContext.Provider>
        </SetStreamViewOpenContext.Provider>
      </SetRouterStateContext.Provider>
    );
  }
}

ReactDOM.render(<App />, document.getElementById("root"));
