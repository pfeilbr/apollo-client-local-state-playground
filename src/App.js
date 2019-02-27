import React, { Component } from "react";
import { ApolloClient } from "apollo-client";
import { InMemoryCache } from "apollo-cache-inmemory";
import gql from "graphql-tag";
import { ApolloProvider, Query, Mutation } from "react-apollo";

const data = {
  todos: [
    {
      id: 0,
      text: "get milk",
      completed: false,
      __typename: "todo"
    }
  ],
  visibilityFilter: "SHOW_ALL",
  networkStatus: {
    __typename: "NetworkStatus",
    isConnected: false
  }
};

const GET_TODOS = gql`
  query GetTodos {
    todos @client {
      id
      text
      completed
    }
  }
`;

const ADD_TODO = gql`
  mutation AddTodo($text: String!) {
    addTodo(text: $text) @client {
      id
      text
      completed
    }
  }
`;

const TOGGLE_TODO = gql`
  mutation ToggleTodo($id: Number!) {
    toggleTodo(id: $id) @client {
      id
      text
      completed
    }
  }
`;

const cache = new InMemoryCache();
const client = new ApolloClient({
  cache,
  resolvers: {
    Mutation: {
      addTodo: (_, { text }, { cache }) => {
        const query = GET_TODOS;

        const { todos } = cache.readQuery({ query });
        const newTodo = {
          id: todos[todos.length - 1].id + 1,
          text,
          completed: false,
          __typename: "todo"
        };
        const data = {
          todos: [...todos, newTodo]
        };

        // you can also do cache.writeData({ data }) here if you prefer
        cache.writeQuery({ query, data });
        return newTodo;
      },
      toggleTodo: (_root, variables, { cache, getCacheKey }) => {
        const id = getCacheKey({ __typename: "todo", id: variables.id });
        const fragment = gql`
          fragment completeTodo on todo {
            completed
          }
        `;
        const todo = cache.readFragment({ fragment, id });
        const data = { ...todo, completed: !todo.completed };
        cache.writeData({ id, data });
        return null;
      }
    }
  }
});

cache.writeData({ data });

client.onResetStore(() => cache.writeData({ data }));

const AddTodo = () => {
  let input;

  return (
    <Mutation mutation={ADD_TODO}>
      {(addTodo, { data }) => (
        <div>
          <form
            onSubmit={e => {
              e.preventDefault();
              addTodo({ variables: { text: input.value } });
              input.value = "";
            }}
          >
            <input
              id="add-todo"
              ref={node => {
                input = node;
              }}
            />
            <button type="submit">Add Todo</button>
          </form>
        </div>
      )}
    </Mutation>
  );
};

const Todo = ({ todo, toggleTodo }) => {
  return (
    <li>
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => {
          toggleTodo({ variables: { id: todo.id } });
        }}
      />
      <span
        style={{ textDecoration: todo.completed ? "line-through" : "none" }}
      >
        {todo.text}
      </span>
    </li>
  );
};

const TodoContainer = props => {
  return (
    <Mutation mutation={TOGGLE_TODO}>
      {(toggleTodo, { data }) => {
        return <Todo {...props} toggleTodo={toggleTodo} />;
      }}
    </Mutation>
  );
};

const TodoList = props => {
  return (
    <>
      <AddTodo />
      <ul style={{ listStyleType: "none" }}>
        {props.todos.map(todo => (
          <TodoContainer key={todo.id} todo={todo} />
        ))}
      </ul>
    </>
  );
};

const TodoListContainer = props => {
  return (
    <Query query={GET_TODOS}>
      {({ loading, error, data: { todos } }) => {
        return loading ? <span>loading ...</span> : <TodoList todos={todos} />;
      }}
    </Query>
  );
};

class App extends Component {
  render() {
    return (
      <ApolloProvider client={client}>
        <div>
          <h1>Todos</h1>
          <TodoListContainer />
        </div>
      </ApolloProvider>
    );
  }
}

export default App;
