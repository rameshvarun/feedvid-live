import * as ReactDOM from "react-dom";
import * as React from "react";

import * as sound from "../sound";

const velocity = require("velocity-animate");

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCog,
  faExpand,
  faSignOutAlt
} from "@fortawesome/free-solid-svg-icons";

import { ChatEntry } from "./chatentry";
import { GameView } from "../gameview";
import { Clue, Donation } from "../types";

import * as utils from "../utils";
import {
  DARKMODE_BG,
  DARKMODE_BORDER,
  DARKMODE_TEXT,
  NAVBAR_COLOR,
  PURPLE_HIGHLIGHT
} from "./colors";
import { motion } from "framer-motion";
import { SetRouterStateContext } from "..";
import { persistentState } from "../persist";

export function formatDonation(amount: number): string {
  let unformatted = Math.floor(amount).toString();
  let formatted = "";

  while (unformatted.length > 3) {
    let sliceIndex = unformatted.length - 3;
    formatted = "," + unformatted.slice(sliceIndex) + formatted;
    unformatted = unformatted.slice(0, sliceIndex);
  }

  return unformatted + formatted;
}

const CHAT_COLORS = [
  "coral",
  "dodgerblue",
  "springgreen",
  "yellowgreen",
  "green",
  "orangered",
  "red",
  "goldenrod",
  "hotpink",
  "cadetblue",
  "seagreen",
  "chocolate",
  "blueviolet",
  "firebrick"
];

function getUsernameColor(username: string) {
  return CHAT_COLORS[utils.hashString(username, CHAT_COLORS.length)];
}

export const SetStreamViewOpenContext: React.Context<(
  bool
) => void> = React.createContext(open => {});

const PORTRAIT_MODE_ASPECT_RATIO = 0.9;

export function StreamDropdown(props: {
  hints: Array<string>;
  canSignOut: boolean;
}) {
  let setStreamViewOpen = React.useContext(SetStreamViewOpenContext);
  const navigate = React.useContext(SetRouterStateContext);

  return (
    <div
      style={{
        position: "relative",
        width: "100%"
      }}
    >
      <motion.div
        key="username-dropdown"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25 }}
      >
        <div
          style={{
            boxShadow: "0px 0px 0.2em 0.1em black",
            right: "0.1em",
            position: "absolute",
            width: "15em",
            backgroundColor: NAVBAR_COLOR,
            borderRadius: "0.25em",
            zIndex: 6,
            color: "white",
            padding: "0.5em",
            display: "flex",
            flexDirection: "column",
            gap: "0.25em"
          }}
        >
          <div
            className="navbar-highlight"
            style={{
              cursor: "pointer",
              padding: "0.5em",
              borderRadius: "0.25em"
            }}
            onClick={() => utils.toggleFullscreen()}
          >
            <FontAwesomeIcon icon={faExpand} />{" "}
            <span
              style={{
                paddingLeft: "0.5em"
              }}
            >
              Toggle Fullscreen
            </span>
          </div>

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
                paddingLeft: "0.5em"
              }}
            >
              Exit to Menu
            </span>
          </div>

          <div
            style={{
              width: "100%",
              height: "0.1em",
              backgroundColor: "rgb(56, 56, 56)"
            }}
          ></div>
          <div
            className="navbar-highlight"
            style={{
              padding: "0.5em",
              borderRadius: "0.25em",
              fontSize: "80%"
            }}
          >
            Check these hints if you are stuck on a puzzle. Hints are ordered
            from most vague to most specific.
          </div>
          {props.hints.length > 0 ? (
            <>
              {props.hints.map((h, i) => {
                return (
                  <details
                    className="navbar-highlight"
                    style={{
                      padding: "0.5em",
                      borderRadius: "0.25em"
                    }}
                  >
                    <summary>Reveal Hint #{i + 1}</summary>
                    <div style={{ paddingTop: "0.5em" }}>{h}</div>
                  </details>
                );
              })}
            </>
          ) : (
            <div
              className="navbar-highlight"
              style={{
                padding: "0.5em",
                borderRadius: "0.25em"
              }}
            >
              No hints available.
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export class StreamView extends React.Component<
  {
    showCredits: () => void;
  },
  {
    aspectRatio: number;
    clues: Array<{ timestamp: number; clue: Clue }>;
    lastClueTimestamp: number;
    donation?: Donation;

    viewerCount: number;
    viewerDelta?: { value: number; timestamp: number };

    isLoaded: boolean;
    gearDropdown: boolean;
  }
> {
  canvas: React.RefObject<HTMLCanvasElement> = React.createRef();
  clueScrollable: React.RefObject<HTMLDivElement> = React.createRef();
  game: GameView | null = null;

  resizeListener: () => void;

  constructor(props) {
    super(props);

    const width = window.innerWidth;
    const height = window.innerHeight;

    this.state = {
      aspectRatio: width / height,
      clues: [],
      viewerCount: 1,
      lastClueTimestamp: 0,
      isLoaded: false,
      gearDropdown: false
    };

    this.resizeListener = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      this.setState(state => ({
        aspectRatio: width / height
      }));
    };
  }

  componentDidMount() {
    window.addEventListener("resize", this.resizeListener);

    this.game = new GameView(
      this.canvas.current!,
      clue => {
        console.log(`Clue: %o`, clue);
        this.setState(state => {
          if (clue.kind === "joined") {
            sound.joined();
            if (clue.onAdded) {
              clue.onAdded();
            }
          } else if (clue.kind === "banned") {
            sound.banned();
            if (clue.onAdded) {
              clue.onAdded();
            }
          } else if (clue.kind === "screenshot") {
            sound.snap();
          } else {
            sound.notification();
          }

          return {
            ...state,
            clues: [...state.clues, { timestamp: performance.now(), clue }],
            lastClueTimestamp: performance.now()
          };
        });
      },
      donation => {
        console.log(`Donation: %o`, donation);
        sound.donation();
        setTimeout(() => {
          if (donation.sound) {
            donation.sound.play();
          }
        }, 1000);

        this.setState(state => {
          return { ...state, donation };
        });
      },
      count => {
        this.setState(state => {
          if (
            utils.readableNumber(count) !==
            utils.readableNumber(state.viewerCount)
          ) {
            const viewerCountContainer = document.getElementById(
              "viewer-count-container"
            )!;
            velocity(
              viewerCountContainer,
              { scaleX: "1.4", scaleY: "1.4" },
              { duration: 80 }
            );
            velocity(
              viewerCountContainer,
              { scaleX: "1", scaleY: "1" },
              { duration: 80 }
            );

            return {
              ...state,
              viewerCount: count,
              viewerDelta: {
                value: count - state.viewerCount,
                timestamp: performance.now()
              }
            };
          }

          return state;
        });
      },
      () => {
        this.setState(state => {
          return { ...state, isLoaded: true };
        });
      },
      this.props.showCredits
    );
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.resizeListener);
    if (this.game) {
      this.game.stop();
    }
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (
      this.clueScrollable.current &&
      this.state.lastClueTimestamp > prevState.lastClueTimestamp
    ) {
      this.clueScrollable.current.scrollTop = this.clueScrollable.current.scrollHeight;
    }
  }

  render() {
    let portrait = this.state.aspectRatio < PORTRAIT_MODE_ASPECT_RATIO;

    return (
      <div
        className="stream-view-container"
        style={{
          position: "absolute",
          top: "0px",
          left: "0px",
          width: "100%",
          height: "100%",
          overflow: "hidden",
          backgroundColor: "black",
          display: "flex",
          flexDirection: portrait ? "column" : "row",
          alignItems: "stretch",
          justifyContent: "stretch",
          zIndex: 10
        }}
      >
        <div
          style={
            portrait
              ? { width: "100%", position: "relative", height: "56.25vw" }
              : {
                  flexGrow: 3,
                  height: "100%",
                  position: "relative",
                  fontSize: "1.6vw"
                }
          }
        >
          <div
            style={{
              display: "flex",
              height: "100%",
              flexDirection: "column",
              justifyContent: "center"
            }}
          >
            <div
              style={{
                paddingBottom: "56.25%",
                height: "0px",
                position: "relative"
              }}
            >
              <canvas
                style={{
                  width: "100%",
                  height: "100%",
                  position: "absolute",
                  top: "0px",
                  left: "0px"
                }}
                ref={this.canvas}
              ></canvas>
            </div>
          </div>

          {this.state.donation ? (
            <div
              style={{
                color: "white",
                position: "absolute",
                left: "50%",
                top: "50%",

                textAlign: "center",
                transform: "translate(-50%, -50%)"
              }}
              className="donation-animation"
              key={this.state.donation.username}
            >
              <div style={{ fontSize: "125%", fontWeight: 800 }}>
                <span style={{ color: PURPLE_HIGHLIGHT }}>
                  {this.state.donation.username}
                </span>
                &nbsp; has donated &nbsp;
                <span style={{ color: PURPLE_HIGHLIGHT }}>
                  ${formatDonation(this.state.donation.amount)}
                </span>
                !
              </div>
              {this.state.donation.message ? (
                <div style={{ fontSize: "87%", marginTop: "1em" }}>
                  "{this.state.donation.message}"
                </div>
              ) : (
                <></>
              )}
            </div>
          ) : (
            <></>
          )}

          {this.state.isLoaded ? (
            <>
              <div
                style={{
                  right: "1em",
                  top: "1em",
                  position: "absolute",
                  backgroundColor: "red",
                  color: "white",
                  paddingLeft: "0.35em",
                  paddingRight: "0.35em",
                  paddingTop: "0.15em",
                  paddingBottom: "0.15em",
                  fontWeight: 600,
                  borderRadius: "0.25em"
                }}
              >
                LIVE
              </div>

              <div
                id="viewer-count-container"
                style={{
                  left: "1em",
                  top: "1em",
                  position: "absolute",
                  color: "white",
                  paddingLeft: "0.35em",
                  paddingRight: "0.35em",
                  paddingTop: "0.15em",
                  paddingBottom: "0.15em",
                  fontWeight: 600,
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center"
                }}
              >
                <img
                  src={require("../assets/ui/eye.svg")}
                  style={{ height: "0.8em", paddingRight: "0.5em" }}
                ></img>
                <span>{utils.readableNumber(this.state.viewerCount)}</span>
              </div>

              {this.state.viewerDelta ? (
                <div
                  key={`viewer-delta-${this.state.viewerDelta.timestamp}`}
                  id="viewer-delta-container"
                  style={{
                    left: "2.8em",
                    top: "1.5em",
                    position: "absolute",
                    color: "white",
                    paddingLeft: "0.35em",
                    paddingRight: "0.35em",
                    paddingTop: "0.15em",
                    paddingBottom: "0.15em",
                    fontWeight: 600,
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center"
                  }}
                >
                  <span>
                    {this.state.viewerDelta.value > 0 ? "+" : "-"}
                    {utils.readableNumber(
                      Math.abs(this.state.viewerDelta.value)
                    )}
                  </span>
                </div>
              ) : (
                <></>
              )}
            </>
          ) : (
            <>
              {" "}
              <div
                id="loading-spinner"
                className="loader"
                style={{ position: "absolute", top: "50%", left: "50%" }}
              >
                Loading...
              </div>
            </>
          )}
        </div>

        <div
          id="sidebar"
          className={portrait ? "portrait-sidebar" : "landscape-sidebar"}
          style={{
            backgroundColor: DARKMODE_BG,
            display: "flex",
            flexDirection: "column",

            color: DARKMODE_TEXT,
            borderLeft: `1px solid ${DARKMODE_BORDER}`
          }}
        >
          <div
            id="subscriber-chat-container"
            style={{
              display: "flex",
              flexDirection: "column",
              height: "100%"
            }}
          >
            <div
              style={{
                backgroundColor: PURPLE_HIGHLIGHT,
                color: "white",
                padding: "0.25em",
                textAlign: "center",
                fontWeight: 700,
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between"
              }}
            >
              <div
                style={{
                  padding: "0.25em",
                  visibility: "hidden"
                }}
              >
                <FontAwesomeIcon icon={faCog} />
              </div>
              <div>SUBSCRIBER CHAT</div>
              <div
                className={"stream-gear"}
                style={{
                  padding: "0.25em",
                  borderRadius: "0.25em",
                  cursor: "pointer"
                }}
                onClick={() => {
                  this.setState(state => ({
                    gearDropdown: !state.gearDropdown
                  }));
                }}
              >
                <FontAwesomeIcon icon={faCog} />
              </div>
            </div>
            {this.state.gearDropdown ? (
              <StreamDropdown
                hints={this.game?.getHints() || []}
                canSignOut={this.game?.canSignOut() || false}
              />
            ) : (
              <></>
            )}
            <div
              style={{
                flexGrow: 1,
                overflowY: "scroll",
                paddingLeft: "0.6em",
                paddingRight: "0.6em",
                paddingTop: "0.3em",
                paddingBottom: "0.3em"
              }}
              ref={this.clueScrollable}
              className="scrollable-area"
            >
              {this.state.clues.map(({ timestamp, clue }) => {
                if (clue.kind === "joined") {
                  return (
                    <div key={timestamp} className="chat-entry">
                      <span
                        className="username"
                        style={{ color: getUsernameColor(clue.username) }}
                      >
                        {clue.username}
                      </span>
                      <span>&nbsp;joined.</span>
                    </div>
                  );
                }

                if (clue.kind === "banned") {
                  return (
                    <div key={timestamp} className="chat-entry">
                      <span
                        className="username"
                        style={{ color: getUsernameColor(clue.username) }}
                      >
                        {clue.username}
                      </span>
                      <span>&nbsp;was banned.</span>
                    </div>
                  );
                }

                if (clue.kind === "message") {
                  return (
                    <div key={timestamp} className="chat-entry">
                      <span
                        className="username"
                        style={{ color: getUsernameColor(clue.username) }}
                      >
                        {clue.username}
                      </span>
                      <span>:&nbsp;</span>
                      <span
                        dangerouslySetInnerHTML={{ __html: clue.message }}
                      ></span>
                    </div>
                  );
                }

                if (clue.kind === "easter-egg") {
                  return (
                    <div
                      key={timestamp}
                      className="chat-entry"
                      style={{
                        color: "rgb(150, 150, 150)"
                      }}
                    >
                      {"> "}
                      <span
                        dangerouslySetInnerHTML={{ __html: clue.message }}
                      ></span>
                    </div>
                  );
                }

                if (clue.kind === "screenshot") {
                  return (
                    <div key={timestamp} className="chat-entry">
                      <div>
                        {" "}
                        <span
                          className="username"
                          style={{ color: getUsernameColor(clue.username) }}
                        >
                          {clue.username}
                        </span>{" "}
                        clipped a screenshot.
                      </div>
                      <img
                        src={clue.image}
                        style={{
                          marginTop: "0.5em",
                          width: "100%",
                          borderRadius: "5px"
                        }}
                      ></img>
                    </div>
                  );
                }

                if (clue.kind === "player-message") {
                  return (
                    <div key={timestamp} className="chat-entry">
                      <span
                        className="username"
                        style={{
                          color: getUsernameColor(
                            persistentState.user?.username || "USERNAME"
                          )
                        }}
                      >
                        {persistentState.user?.username || "USERNAME"}
                      </span>
                      <span>:&nbsp;</span>
                      <span
                        dangerouslySetInnerHTML={{ __html: clue.message }}
                      ></span>
                    </div>
                  );
                }
              })}
            </div>

            <div
              style={{
                borderTop: `1px solid ${DARKMODE_BORDER}`,
                paddingTop: "0.5em",
                paddingBottom: "0.5em",
                paddingLeft: "0.5em",
                paddingRight: "0.5em"
              }}
            >
              <ChatEntry
                onSubmit={text => {
                  this.setState(state => {
                    sound.notification();
                    let clues: Array<{ timestamp: number; clue: Clue }> = [
                      ...state.clues,
                      {
                        timestamp: performance.now(),
                        clue: { kind: "player-message", message: text }
                      }
                    ];

                    const MAX_PLAYER_MESSAGES = 20;
                    const numPlayerMsgs = clues.filter(
                      c => c.clue.kind === "player-message"
                    ).length;
                    if (numPlayerMsgs > MAX_PLAYER_MESSAGES) {
                      const firstPlayerMsgIndex = clues.findIndex(
                        c => c.clue.kind === "player-message"
                      );
                      clues.splice(firstPlayerMsgIndex, 1);
                    }

                    return {
                      ...state,
                      clues: clues,
                      lastClueTimestamp: performance.now()
                    };
                  });
                  this.game!.parse(text);
                }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
}
