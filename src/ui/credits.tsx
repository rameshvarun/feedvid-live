import * as ReactDOM from "react-dom";
import * as React from "react";
import * as sound from "../sound";
import { SetStreamViewOpenContext } from "./streamview";
import { SetRouterStateContext } from "..";
const velocity = require("velocity-animate");

export const SetCreditsViewOpenContext: React.Context<(
  bool
) => void> = React.createContext(open => {});

export class Credits extends React.Component<
  { mobile: boolean },
  { canExit: boolean }
> {
  constructor(props) {
    super(props);

    this.state = { canExit: false };
  }

  componentDidMount() {
    setTimeout(() => {
      velocity(
        document.getElementById("credits-container")!,
        { opacity: 1.0 },
        { duration: 5 * 1000 }
      );
    }, 0);

    // Fade out breathing earlier.
    sound.painfulBreathing.fadeOut();

    setTimeout(() => {
      sound.fadeOutBreathing();
      sound.fadeOutAmbience();
      sound.stopBinauralSounds();
      sound.fadeOutFootsteps();
    }, 6 * 1000);

    const MUSIC_START = 11;
    const CUE1 = MUSIC_START + 0.948;
    const CUE2 = MUSIC_START + 1.88;

    setTimeout(() => {
      sound.startCreditsMusic();
      document.getElementById("credits-container")!.style.backgroundColor =
        "black";
    }, MUSIC_START * 1000);

    setTimeout(() => {
      document.getElementById("credits-logo")!.style.opacity = "1";
    }, CUE1 * 1000);

    setTimeout(() => {
      document.getElementById("created-by")!.style.opacity = "1";
      document.getElementById("created-by-name")!.style.opacity = "1";
    }, CUE2 * 1000);

    setTimeout(() => {
      this.setState({ canExit: true });
      velocity(
        document.getElementById("return-to-menu")!,
        { opacity: 1.0 },
        { duration: 5 * 1000 }
      );
    }, (MUSIC_START + 9.374) * 1000);
  }

  componentWillUnmount() {
    sound.stopCreditsMusic();
  }

  render() {
    return (
      <SetRouterStateContext.Consumer>
        {navigate => (
          <SetStreamViewOpenContext.Consumer>
            {setStreamViewOpen => (
              <SetCreditsViewOpenContext.Consumer>
                {setCreditsViewOpen => (
                  <div
                    id="credits-container"
                    style={{
                      position: "absolute",
                      top: "0px",
                      left: "0px",
                      width: "100%",
                      height: "100%",
                      overflow: "hidden",
                      backgroundColor: "white",
                      zIndex: 20,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      opacity: "0"
                    }}
                  >
                    <img
                      id="credits-logo"
                      src={require("../assets/ui/logo-purple.svg")}
                      style={{
                        width: this.props.mobile ? "80vmin" : "25%",
                        opacity: "0"
                      }}
                    />
                    <div
                      style={{
                        marginTop: "0.6em",
                        fontSize: this.props.mobile ? "5vmin" : "1.5vw",
                        marginBottom: "1.2em"
                      }}
                    >
                      <span id="created-by" style={{ opacity: "0" }}>
                        Created by
                      </span>
                      &nbsp;
                      <span id="created-by-name" style={{ opacity: "0" }}>
                        Varun R.
                      </span>
                    </div>

                    <div
                      style={{
                        fontSize: this.props.mobile ? "3vmin" : "1vw",
                        opacity: "0",
                        cursor: this.state.canExit ? "pointer" : "inherit"
                      }}
                      id="return-to-menu"
                    >
                      <span
                        onClick={() => {
                          if (this.state.canExit) {
                            sound.click();
                            window.location.reload();
                          }
                        }}
                      >
                        [Return to Menu]
                      </span>
                    </div>
                  </div>
                )}
              </SetCreditsViewOpenContext.Consumer>
            )}
          </SetStreamViewOpenContext.Consumer>
        )}
      </SetRouterStateContext.Consumer>
    );
  }
}
