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
import { SetErrorContext } from "./common";

export class Thumbnail extends React.Component<
  {
    image?: string;
    title: string;
    subtitle: string;
    labels: any;

    onClick?: () => void;
    onVisible?: () => void;

    defaultError: string;
  },
  {}
> {
  thumbnail: React.RefObject<HTMLDivElement> = React.createRef();

  constructor(props) {
    super(props);
  }

  static contextType = SetErrorContext;

  scrollHandler?: () => void;
  isOnScreen: boolean = false;

  componentDidMount() {
    const container = document.getElementById("feed-container");

    this.scrollHandler = () => {
      let thumbnail = this.thumbnail.current;
      if (thumbnail) {
        let position = thumbnail.getBoundingClientRect();
        if (position.top < window.innerHeight && position.bottom >= 0) {
          if (!this.isOnScreen) {
            this.isOnScreen = true;
            if (this.props.onVisible) this.props.onVisible();
          }
        }
      }
    };

    if (container) {
      container.addEventListener("scroll", this.scrollHandler);
    }
  }

  componentWillUnmount() {
    const container = document.getElementById("feed-container");
    if (this.scrollHandler && container) {
      container.removeEventListener("scroll", this.scrollHandler);
    }
  }

  onClick() {
    if (this.props.onClick) {
      this.props.onClick();
    } else {
      this.context(this.props.defaultError);
    }
  }

  render() {
    return (
      <div ref={this.thumbnail} style={{ paddingBottom: "2em", width: "100%" }}>
        <div
          className="thumbnail-container"
          style={{
            backgroundColor: PURPLE_HIGHLIGHT,
            width: "100%",
            paddingTop: "56.25%",
            display: "block",
            position: "relative",
            cursor: "pointer"
          }}
          onClick={() => this.onClick()}
          onMouseEnter={() => {
            sound.clink();
          }}
        >
          <div
            className="thumbnail-popout"
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: 0,
              width: "100%",
              height: "100%",
              border: 0,
              backgroundImage: `url('${this.props.image ||
                require("../assets/ui/no-thumbnail.svg")}')`,
              backgroundSize: "cover"
            }}
          >
            {this.props.labels}
          </div>
        </div>
        <div
          className="clip-title"
          style={{
            fontSize: "160%",
            fontWeight: 600,
            marginTop: "0.3em",
            cursor: "pointer"
          }}
          onClick={() => this.onClick()}
        >
          {this.props.title}
        </div>
        <div
          style={{
            fontSize: "130%",
            marginTop: "0.3em",
            color: DARKMODE_SUBTITLE
          }}
        >
          {this.props.subtitle}
        </div>
      </div>
    );
  }
}

export function ClipThumb(props: {
  image?: string;
  title: string;
  length: string;
  time: string;
  viewers: string;
  clipper: string;

  onVisible?: () => void;
}) {
  return (
    <Thumbnail
      image={props.image}
      title={props.title}
      onVisible={props.onVisible}
      subtitle={`Clipped by ${props.clipper}`}
      defaultError={"Failed to load clip. Try again later."}
      labels={
        <>
          <div
            style={{
              position: "absolute",
              backgroundColor: "rgba(0, 0, 0, 0.8)",
              paddingTop: "0.2em",
              paddingBottom: "0.2em",
              paddingLeft: "0.4em",
              paddingRight: "0.4em",
              left: 0,
              top: 0,

              margin: "0.5em",
              zIndex: 2,
              borderRadius: "0.2em"
            }}
          >
            {props.length}
          </div>

          <div
            style={{
              position: "absolute",
              backgroundColor: "rgba(0, 0, 0, 0.8)",
              paddingTop: "0.2em",
              paddingBottom: "0.2em",
              paddingLeft: "0.4em",
              paddingRight: "0.4em",

              right: 0,
              bottom: 0,

              margin: "0.5em",
              zIndex: 2,
              borderRadius: "0.2em"
            }}
          >
            {props.time}
          </div>

          <div
            style={{
              position: "absolute",
              backgroundColor: "rgba(0, 0, 0, 0.8)",
              paddingTop: "0.2em",
              paddingBottom: "0.2em",
              paddingLeft: "0.4em",
              paddingRight: "0.4em",

              left: 0,
              bottom: 0,

              margin: "0.5em",
              zIndex: 2,
              borderRadius: "0.2em"
            }}
          >
            {props.viewers}
          </div>
        </>
      }
    />
  );
}

export function StreamThumb(props: {
  image?: string;
  title: string;
  viewers: string;
  streamer: string;
  onClick?: () => void;
  onVisible?: () => void;
}) {
  return (
    <Thumbnail
      image={props.image}
      title={props.title}
      subtitle={props.streamer}
      defaultError={"Failed to load stream. Try again later."}
      onVisible={props.onVisible}
      labels={
        <>
          <div
            style={{
              position: "absolute",
              backgroundColor: "red",
              paddingTop: "0.2em",
              paddingBottom: "0.2em",
              paddingLeft: "0.4em",
              paddingRight: "0.4em",
              left: 0,
              top: 0,

              margin: "0.5em",
              zIndex: 2,
              borderRadius: "0.4em",
              fontWeight: 600
            }}
          >
            LIVE
          </div>

          <div
            style={{
              position: "absolute",
              backgroundColor: "rgba(0, 0, 0, 0.8)",
              paddingTop: "0.2em",
              paddingBottom: "0.2em",
              paddingLeft: "0.4em",
              paddingRight: "0.4em",

              left: 0,
              bottom: 0,

              margin: "0.5em",
              zIndex: 2,
              borderRadius: "0.2em"
            }}
          >
            {props.viewers}
          </div>
        </>
      }
      onClick={props.onClick}
    />
  );
}
