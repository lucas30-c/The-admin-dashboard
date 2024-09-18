import type { AuthProvider } from "@refinedev/core";

import { API_URL, dataProvider } from "./data";
import { access } from "fs";

// For demo purposes and to make it easier to test the app, you can use the following crendentials:

const authCredentials = {
  email: "finn.ryu1@gmail.com",
  password: "demodemo",
};

export const authProvider: AuthProvider = {
  login: async ({ email }) => {
    try {
      // call the login mutation
      // dataProvider.custom is used to make a custom request to the GraphQL API
      // this will call dataProvider which will go through the fetchWrapper function

      const { data } = await dataProvider.custom({
        url: API_URL,
        method: "post",
        headers: {
          // Add necessary headers here
        },
        meta: {
          variables: { email },
          // pass the email to see if the user exists and if so, return the accessToken
          rawQuery: `
          mutation Login($email: String!) {
            login(loginInput: { email: $email }) {
              accessToken
            }
          }
        `,
        },
      });

      // save the accessToken to the local storage
      localStorage.setItem("access_token", data?.login?.accessToken);

      // Handle the response data (accessToken can be used here)
      return {
        success: true,
        redirectTo: "/",
      };
    } catch (e) {
      // Handle errors here, like invalid email or request failure
      const error = e as Error;

      return {
        success: false,
        error: {
          message: "message" in error ? error.message : "Login failed",
          name: "name" in error ? error.name : "Invalid email or password",
        },
      };
    }
  },

  // simply remove the accessToken form local storage
  logout: async () => {
    localStorage.removeItem("access_token");

    return {
      success: true,
      redirectTo: "/login",
    };
  },

  onError: async (error) => {
    // a check to see if the error is an authentication error
    // if so, set logout to true
    /*
      ...error: The rest of the error object (error) is spread into the return value, which provides additional context about the error (e.g., status code, message). This can be useful for debugging or showing a relevant message to the user.
    */
    if (error.statusCode === "UNAUTHENTICATED") {
      return { logout: true, ...error };
    }
  },

  check: async () => {
    // check if the user is authenticated by checking if the accessToken is in the local storage
    const accessToken = localStorage.getItem("access_token");

    try {
      //  get the identity of the user
      //  this is to know if the user is authenticated or not
      await dataProvider.custom({
        url: API_URL,
        method: "post",
        headers: {
          // Add necessary headers here
        },
        meta: {
          rawQuery: `
          query Me {
            me {
              name
            }
          }
        `,
        },
      });

      // if the user is authenticated, redirect to the home page
      return {
        authenticated: true,
        redirectTo: "/",
      };
    } catch (error) {
      // for any other error, redirect to the login page
      return {
        authenticated: false,
        redirectTo: "/login",
      };
    }
  },

  // get the user information
  getIdentity: async () => {
    const accessToken = localStorage.getItem("access_token");

    try {
      //  Call the GraphQL API to get the user information
      // we are using me:any because the GraphQL API does not have a type for the me query yet
      //  We will add some queries and mutations later and change this to User which will be genrated by codegen.

      const { data } = await dataProvider.custom<{ me: any }>({
        url: API_URL,
        method: "post",
        headers: accessToken
          ? {
              // send the acessToken in the Authorization header
              Authorization: `Bearer ${accessToken}`,
            }
          : {},
        meta: {
          // get the user information such as name, email, etc.
          rawQuery: `
          query Me {
            me {
              id
              name
              email
              avatar
            }
          }
        `,
        },
      });

      return data?.me;
    } catch (e) {
      return undefined;
    }
  },
};
