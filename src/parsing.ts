const levenshtein = require("js-levenshtein");

interface Success {
  kind: "success";
  index: number;
}

interface Failure {
  kind: "failure";
}

export function Success(index: number): Success {
  return { kind: "success", index };
}

export function Failure(): Failure {
  return { kind: "failure" };
}

type ParserResult = Success | Failure;

export type Parser = (tokens: string[], position: number) => ParserResult;

/** Matches one token exactly. */
export function word(w: string): Parser {
  return (stream, i) => {
    if (i >= stream.length) return Failure();
    else if (stream[i] === w) return Success(i + 1);
    else return Failure();
  };
}

/** Matches any token. */
export const any: Parser = (stream, i) => {
  if (i >= stream.length) return Failure();
  else return Success(i + 1);
};

/** Fuzzy match a token with a given edit distance tolerance. */
export function fuzzy(w: string, tolerance: number = 2): Parser {
  return (stream, i) => {
    if (i >= stream.length) return Failure();
    else {
      const distance = levenshtein(w, stream[i]);
      if (distance <= tolerance) {
        return Success(i + 1);
      } else {
        return Failure();
      }
    }
  };
}

/** Never parser always fails. */
export var never: Parser = (stream, i) => {
  return Failure();
};

/** Always parser always succeeds, but doesn't eat any tokens. */
export var always: Parser = (stream, i) => {
  return Success(i);
};

/** Matches the end of a stream. */
export var end: Parser = (stream, i) => {
  if (i >= stream.length) return Success(i);
  else return Failure();
};

/** Sequnce parser that only succeeds if it can match all provided parsers in sequence. */
export function seq(...parsers: Parser[]): Parser {
  return (stream, i) => {
    for (let parser of parsers) {
      let result = parser(stream, i);
      if (result.kind == "failure") return Failure();
      i = result.index;
    }
    return Success(i);
  };
}

/** Tries to apply a parser. If it succeeds, the parse continues. If it fails, the parse still continues, but without eating any tokens. */
export function optional(parser: Parser): Parser {
  return (stream, i) => {
    let result = parser(stream, i);
    if (result.kind == "success") return result;
    return Success(i);
  };
}

/**
 * Try applying a given parser at each point in the stream ahead of the current point.
 * Succeeds if the parser applies at any point. Fails if the parser cannot be applied anywhere.
 */
export function search(parser: Parser): Parser {
  return (stream, i) => {
    while (i <= stream.length) {
      let result = parser(stream, i);
      if (result.kind == "success") return result;
      ++i;
    }
    return Failure();
  };
}

/** Alt parser that succeeds if any of the parsers (tested in order) match. */
export function alt(...parsers: Parser[]): Parser {
  return (stream, i) => {
    for (let parser of parsers) {
      let result = parser(stream, i);
      if (result.kind == "success") return result;
    }
    return Failure();
  };
}

/** Invoke a callback if a parser succeeds. */
export function onSuccess(parser: Parser, action: () => void): Parser {
  return (stream, i) => {
    let result = parser(stream, i);
    if (result.kind === "success") action();
    return result;
  };
}

/** Invoke a callback if a parser fails. */
export function onFail(parser: Parser, action: () => void): Parser {
  return (stream, i) => {
    let result = parser(stream, i);
    if (result.kind === "failure") action();
    return result;
  };
}

export function run(parser: Parser, stream: string[]): boolean {
  let result = parser(stream, 0);
  return result.kind === "success";
}
