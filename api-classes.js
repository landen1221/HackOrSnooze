const BASE_URL = "https://hack-or-snooze-v3.herokuapp.com";

 // presents individual Story instances and has methods for fetching, adding, and removing stories

  class StoryList {
   constructor(stories) {
    this.stories = stories;
  }

 // generates a new StoryList(calls the API, builds an array of Story instances, makes a single StoryList instance out of that, returns the StoryList instance)
 // TODO: Why doesn't it make sense for getStories to be an instance method?
  
 // Static members are called without instantiating their class and cannot be called through a class instance. 
 // Static methods are often used to create utility functions for an application,
 // whereas static properties are useful for fixed-configuration, data you don't need to be replicated across instances.
 
  static async getStories() {
    // query the /stories endpoint (no auth required)
    const response = await axios.get(`${BASE_URL}/stories`);

    // turn the plain old story objects from the API into instances of the Story class
    const stories = response.data.stories.map(story => new Story(story));

    // build an instance of our own class using the new array of stories
    const storyList = new StoryList(stories);
    return storyList;
  }

  /**
   * Method to make a POST request to /stories and add the new story to the list
   * - user - the current instance of User who will post the story
   * - newStory - a new story object for the API with title, author, and url
   *
   * Returns the new story object
   */

  async addStory(user, newStory) {
    // TODO - Implement this functions!
    // this function should return the newly created story so it can be used in
    // the script.js file where it will be appended to the DOM
    const response = await axios({
      method: "POST",
      url: `${BASE_URL}/stories`,
      data: {
        token: user.loginToken,
        story: newStory,
      }
    });

    newStory = new Story(response.data.story);
    // add the story to the beginning of the list
    this.stories.unshift(newStory);
    // add the story to the beginning of the user's list
    user.ownStories.unshift(newStory);

    return newStory;
  }

  /**
   * Method to make a DELETE request to remove a particular story
   *  and also update the StoryList
   *
   * - user: the current User instance
   * - storyId: the ID of the story you want to remove
   */

  async removeStory(user, storyId) {
    await axios({
      url: `${BASE_URL}/stories/${storyId}`,
      method: "DELETE",
      data: {
        token: user.loginToken
      },
    });

    // filter out the story whose ID we are removing
    this.stories = this.stories.filter(story => story.storyId !== storyId);

    // do the same thing for the user's list of stories
    user.ownStories = user.ownStories.filter(s => s.storyId !== storyId
    );
  }
}

  
 
/*
 * The User class to primarily represent the current user.
 *  There are helper methods to signup(create), login, and getLoggedInUser
 */

class User {
  constructor(userObj) {
    this.username = userObj.username;
    this.name = userObj.name;
    this.createdAt = userObj.createdAt;
    this.updatedAt = userObj.updatedAt;

    // these are all set to defaults, not passed in by the constructor
    this.loginToken = "";
    this.favorites = [];
    this.ownStories = [];
  }

  /* singup and return a new user.
   * Makes POST request to API and returns newly-created user. 
   */

  static async create(username, password, name) {
    const response = await axios.post(`${BASE_URL}/signup`, {
      user: {
        username,
        password,
        name
      }
    });

    // build a new User instance from the API response
    const newUser = new User(response.data.user);

    // attach the token to the newUser instance for convenience
    newUser.loginToken = response.data.token;

    return newUser;
  }

  /* Login in user and return user instance.
   "token": "eyJhb...",
   "user": {"createdAt": "", "favorites": [{}], "name": "", "password": "", "stories": [{}], "updatedAt": "", "username": "hueter"}}
  */

  static async login(username, password) {
    const response = await axios.post(`${BASE_URL}/login`, {
      user: {
        username,
        password
      }
    });

    // build a new User instance from the API response
    const existingUser = new User(response.data.user);

    // instantiate Story instances for the user's favorites and ownStories
    existingUser.favorites = response.data.user.favorites.map(s => new Story(s));
    existingUser.ownStories = response.data.user.stories.map(s => new Story(s));

    // attach the token to the newUser instance for convenience
    existingUser.loginToken = response.data.token;

    return existingUser;
  }

  /** Get user instance for the logged-in-user.
   *
   * This function uses the token & username to make an API request to get details
   *   about the user. Then it creates an instance of user with that info.
   */

  static async getLoggedInUser(token, username) {
    // if we don't have user info, return null
    if (!token || !username) return null;

    // call the API (getting info about existion user)
   //{"user": {"createdAt": ..., "favorites": [{}], "name": "Michael Hueter", "password": "foo123", "stories": [{}], "username": "hueter"}}
    
   const response = await axios.get(`${BASE_URL}/users/${username}`, {
      params: {
        token
      }
    });

    // instantiate the user from the API information
    const existingUser = new User(response.data.user);

    // attach the token to the newUser instance for convenience
    existingUser.loginToken = token;

    // instantiate Story instances for the user's favorites and ownStories
    existingUser.favorites = response.data.user.favorites.map(s => new Story(s));
    existingUser.ownStories = response.data.user.stories.map(s => new Story(s));
    return existingUser;
  }


  //Add a story to the list of user favorites and update the API

  async addFavorite(storyId) {
   await axios({url: `${BASE_URL}/users/${this.username}/favorites/${storyId}`,
      method: "POST",
      data: {
        token: this.loginToken
      }
    });

    await this.retrieveDetails();
    return this;
  }
  
  // remove a story

  async removeFavorite(storyId) {
   await axios({url: `${BASE_URL}/users/${this.username}/favorites/${storyId}`,
      method: "DELETE",
      data: {
        token: this.loginToken
      }
    });

    await this.retrieveDetails();
    return this;
  }


   //get user info from the API
   // set all the appropriate instance properties from the response with the current user instance.

  async retrieveDetails() {
    const response = await axios.get(`${BASE_URL}/users/${this.username}`, {
      params: {
        token: this.loginToken
      }
    });
   
   
   // update user's properties from the API 
    this.name = response.data.user.name;
    this.createdAt = response.data.user.createdAt;
    this.updatedAt = response.data.user.updatedAt;

    // create instances of Story
    this.favorites = response.data.user.favorites.map(s => new Story(s));
    this.ownStories = response.data.user.stories.map(s => new Story(s));
    return this;
  }
  
}


// Class to represent a single story.
class Story {
  constructor(storyObj) {
    this.author = storyObj.author;
    this.title = storyObj.title;
    this.url = storyObj.url;
    this.username = storyObj.username;
    this.storyId = storyObj.storyId;
    this.createdAt = storyObj.createdAt;
    this.updatedAt = storyObj.updatedAt;
  }
}