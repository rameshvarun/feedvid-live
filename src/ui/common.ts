import * as React from "react";

export const CHANNEL_NAME: string = "UmVkUm9vbQ==";
export const SWATTING_CLIPPER: string = "viewer598";

export const SetErrorContext: React.Context<(
  string
) => void> = React.createContext((err: string) => {});
