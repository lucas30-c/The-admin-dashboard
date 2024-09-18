import { error } from "console";
import { GraphQLFormattedError } from "graphql";

type Error = {
  message: string;
  statusCode: string;
};

/**
   The customFetch function is mainly designed to add or override certain properties in the original headers
 */

/*
   the access_token is used for authentication. It is typically a JWT (JSON Web Token) or some other form of token issued by an authentication service when a user logs in

   This token is then included in subsequent API requests to allow the server to authenticate the user and ensure that they have the right permissions to access certain resources or perform actions.
*/

/*
   You can think of the custom fetch as a middleware that intercepts the request before every single fetch.
*/

const customFetch = async (url: string, options: RequestInit) => {
  const accessToken = localStorage.getItem("access_token");

  const headers = options.headers as Record<string, string>;

  return await fetch(url, {
    ...options,
    headers: {
      ...headers,
      Authorization: headers?.Authorization || `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "Appollo-Require-Preflight": "true",
    },
  });
};

const getGraphQLErrors = (
  body: Record<"errors", GraphQLFormattedError[] | undefined>
): Error | null => {
  if (!body) {
    return {
      message: "Unknown error",
      statusCode: "INTERNAL_SERVER_ERROR",
    };
  }

  if ("errors" in body) {
    const errors = body?.errors;

    const messages = errors?.map((error) => error?.message).join("");
    const code = errors?.[0].extensions?.code;

    return {
      message: messages || JSON.stringify(errors),
      statusCode: code || 500,
    };
  }

  return null;
};

export const fetchWrapper = async (url: string, options: RequestInit) => {
  const response = await customFetch(url, options);
  // const body = await response.json();
  // to clone the response object so that we can read the body multiple times
  const responseClone = response.clone();
  const body = await responseClone.json();

  if (error) {
    throw error;
  }

  return response;
};
