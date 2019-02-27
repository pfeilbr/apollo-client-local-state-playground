import React from "react";
import ReactDOM from "react-dom";
import App from "./App";

import {
  render,
  fireEvent,
  cleanup,
  waitForElement,
  wait
} from "react-testing-library";

afterEach(cleanup);

it("renders without crashing", () => {
  const div = document.createElement("div");
  ReactDOM.render(<App />, div);
  ReactDOM.unmountComponentAtNode(div);
});

it("contains todo item", async () => {
  expect.assertions(1);
  const { getByText } = render(<App />);
  const todoText = "get milk";
  expect(getByText(new RegExp(todoText, "i"))).toBeTruthy();
});

it("adds todo item", async () => {
  expect.assertions(1);

  const { getByText, container } = render(<App />);
  const todoText = "get gas";
  const addTodoButton = getByText(/add todo/i);
  const input = container.querySelector("#add-todo");
  input.value = todoText;
  fireEvent.click(addTodoButton);
  await wait();
  expect(getByText(todoText)).toBeTruthy();
});

it("toggles todo item", async () => {
  expect.assertions(1);
  const { getByText, container } = render(<App />);
  const checkbox = container.querySelector("input[type=checkbox]");
  fireEvent.click(checkbox);
  await wait();
  expect(checkbox.checked).toBeTruthy();
});
