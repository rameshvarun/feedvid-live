import { any, end, fuzzy, optional, run, search, seq, word } from "./parsing";

test("word", () => {
  expect(run(word("test"), ["test"])).toBeTruthy();
  expect(run(word("test"), ["test", "next"])).toBeTruthy();
  expect(run(word("test"), [])).toBeFalsy();
  expect(run(word("test"), ["no"])).toBeFalsy();
});

test("end", () => {
  expect(run(end, ["test"])).toBeFalsy();
  expect(run(end, [])).toBeTruthy();
});

test("seq", () => {
  expect(run(seq(word("a"), word("b")), ["a", "b", "c"])).toBeTruthy();
  expect(run(seq(word("a"), word("b"), end), ["a", "b", "c"])).toBeFalsy();
  expect(run(seq(word("a"), word("b"), end), ["a", "b"])).toBeTruthy();
  expect(run(seq(word("a"), word("b"), end), ["a", "c", "b"])).toBeFalsy();
});

test("fuzzy", () => {
  expect(run(fuzzy("toilet"), ["tiolet"])).toBeTruthy();
  expect(run(fuzzy("toilet"), ["tolet"])).toBeTruthy();
  expect(run(fuzzy("toilet"), ["tiolet"])).toBeTruthy();
  expect(run(fuzzy("toilet"), ["drain"])).toBeFalsy();

  expect(run(fuzzy("toilet"), ["tiolte"])).toBeFalsy();
  expect(run(fuzzy("toilet", 4), ["tiolte"])).toBeTruthy();
});

test("any", () => {
  expect(run(any, ["test"])).toBeTruthy();
  expect(run(any, [])).toBeFalsy();

  expect(run(seq(any, any), ["test"])).toBeFalsy();
  expect(run(seq(any, any, end), ["test", "b"])).toBeTruthy();
});

test("optional", () => {
  expect(
    run(seq(optional(word("the")), word("drain"), end), ["the", "drain"])
  ).toBeTruthy();
  expect(
    run(seq(optional(word("the")), word("drain"), end), ["drain"])
  ).toBeTruthy();

  expect(
    run(seq(optional(word("the")), word("drain"), end), ["door"])
  ).toBeFalsy();
  expect(
    run(seq(optional(word("the")), word("drain"), end), ["the", "door"])
  ).toBeFalsy();
});

test("search", () => {
  expect(run(search(end), ["a", "b", "c"])).toBeTruthy();
  expect(run(search(word("b")), ["a", "b", "c"])).toBeTruthy();
  expect(run(search(seq(word("b"), word("c"))), ["a", "b", "c"])).toBeTruthy();

  expect(run(search(word("d")), ["a", "b", "c"])).toBeFalsy();
});
