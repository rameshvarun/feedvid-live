import * as ReactDOM from "react-dom";
import * as React from "react";

export class ChatEntry extends React.Component<
  { onSubmit: (text: string) => void },
  {}
> {
  input: React.RefObject<HTMLInputElement> = React.createRef();

  constructor(props) {
    super(props);
  }

  sendMessage() {
    let value = this.input.current!.value.trim();
    if (value === "") return;

    this.input.current!.value = "";
    this.props.onSubmit(value);
  }

  render() {
    return (
      <div style={{ display: "flex", flexDirection: "row" }}>
        <input
          type="text"
          ref={this.input}
          className="chat-text-box"
          placeholder="Send a message..."
          style={{ flexGrow: 1, marginRight: "0.6em" }}
          onKeyUp={e => {
            if (e.keyCode === 13) {
              this.sendMessage();
            }
          }}
        />
        <button className="chat-button" onClick={() => this.sendMessage()}>
          Chat
        </button>
      </div>
    );
  }
}
