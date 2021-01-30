import React, { useState, useEffect } from "react";
import mockUser from "./mockData.js/mockUser";
import mockRepos from "./mockData.js/mockRepos";
import mockFollowers from "./mockData.js/mockFollowers";
import axios from "axios";

const rootUrl = "https://api.github.com";

const GithubContext = React.createContext();

// Provider , Consumer - GithubContext.Provider

const GithubProvider = ({ children }) => {
  const [githubUser, setGithubUser] = useState(mockUser);
  const [repos, setRepos] = useState(mockRepos);
  const [followers, setFollowers] = useState(mockFollowers);
  // request loading
  const [request, setRequest] = useState(0);
  const [loading, setLoading] = useState(false);
  // error
  const [error, setError] = useState({ show: false, msg: "" });

  const searchGithubUser = async (user) => {
    totggleError();
    setLoading(true);
    const response = await axios(`${rootUrl}/users/${user}`).catch((err) => {
      console.log(err);
    });
    if (response) {
      setGithubUser(response.data);
      const { login } = response.data;
      await Promise.allSettled([
        axios(`${rootUrl}/users/${login}/repos?per_page=100`),
        axios(`${rootUrl}/users/${login}/followers?per_page=100`),
      ])
        .then((result) => {
          const [repos, followers] = result;
          const status = "fulfilled";
          if (repos.status === status) {
            setRepos(repos.value.data);
          }

          if (followers.status === status) {
            setFollowers(followers.value.data);
          }
        })
        .catch((err) => console.log(err));
    } else {
      totggleError(true, "There is no user with this username ");
    }
    cheekRequest();
    setLoading(false);
  };

  // check rate
  const cheekRequest = () => {
    axios(`${rootUrl}/rate_limit`)
      .then(({ data }) => {
        let {
          rate: { remaining },
        } = data;
        setRequest(remaining);
        if (remaining === 0) {
          totggleError(true, "Sorry, You are exeeded yiur hourly rate limit");
        }
      })
      .catch((err) => console.log(err));
  };
  // error
  function totggleError(show = false, msg = "") {
    setError({ show, msg });
  }

  useEffect(cheekRequest, []);

  return (
    <GithubContext.Provider
      value={{
        githubUser,
        repos,
        followers,
        request,
        error,
        searchGithubUser,
        loading,
      }}
    >
      {children}
    </GithubContext.Provider>
  );
};

export { GithubProvider, GithubContext };
