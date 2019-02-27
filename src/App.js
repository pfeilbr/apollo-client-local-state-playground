import React, { Component } from "react";
import logo from "./logo.svg";
import { ApolloClient } from "apollo-client";
import { InMemoryCache } from "apollo-cache-inmemory";
import gql from "graphql-tag";
import { ApolloProvider, ApolloConsumer, Query, Mutation } from "react-apollo";

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

const TodoList = props => {
  return (
    <>
      <AddTodo />
      <ul>
        {props.todos.map(todo => (
          <li key={todo.id}>{todo.text}</li>
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
