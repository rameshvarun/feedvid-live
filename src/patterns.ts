import {
  alt,
  never,
  onSuccess,
  Parser,
  run,
  search,
  seq,
  word
} from "./parsing";

export const goBack: Parser = search(
  alt(seq(word("go"), word("back")), word("return"), word("back"), word("exit"))
);

export const standUp: Parser = search(word("stand"));

export function goTo(object: Parser): Parser {
  return search(
    alt(
      object,
      seq(word("go"), word("to"), object),
      seq(word("go"), object),
      seq(word("inspect"), object),
      seq(word("look"), object),
      seq(word("look"), word("at"), object),
      seq(word("see"), object)
    )
  );
}

export function takeObject(object: Parser): Parser {
  return search(
    alt(
      object,
      seq(word("take"), object),
      seq(word("get"), object),
      seq(word("grab"), object),
      seq(word("pick"), word("up"), object),
      seq(word("pick"), object)
    )
  );
}

export function useObject(object: Parser): Parser {
  return search(alt(object, seq(word("use"), object)));
}

export const take: Parser = search(
  alt(
    word("take"),
    word("get"),
    word("grab"),
    seq(word("pick"), word("up")),
    word("pick")
  )
);
