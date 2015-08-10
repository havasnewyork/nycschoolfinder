# NYC School Finder

## Watson Hackathon Entry from Havas Worldwide New York - 4-5 May, 2015

### Links

* [Hackathon entries][hackathon]
* [Application Demo][demo]

### Technical overview

1. NYC Open Data datasets used for our school listings. We pulled multiple data sets on NYC high schools from their APIs, cached them into Cloudant, Took the basic data + school performance + SAT scores, safety, etc.

2. This School data is then analyzed for personality insights, and that is cached into Cloudant as well.

3. When you submit sample text, it's sent to **personality insights** on the fly. We have some autobiographical writing samples as well for you all to try out.

4. The student's profile is then compared with every single school in the database, and the best matches are displayed in this interactive visualization.

5. The matches are additionally fed into **tradeoff analytics** leveraged to further refine based on not only the personality match score, but also SAT scores, graduation and college rates, much more data available.

6. Uses personality insights to generate suggested careers based on existing personality to career research

## Running locally
  The application uses [Node.js](http://nodejs.org/) and [npm](https://www.npmjs.com/) so you will have to download and install them as part of the steps below.

1. Copy the credentials from your `VCAP_SERVICES` service in Bluemix to `VCAP_SERVICES.json`, you can see the credentials using:

    ```sh
    $ cf env <application-name>
    ```
    Example output:
    ```sh
    System-Provided:
    {
    "VCAP_SERVICES": {
      "personality_insights": [{
          "credentials": {
            "url": "<url>",
            "password": "<password>",
            "username": "<username>"
          },
        "label": "personality_insights",
        "name": "personality-insights-service",
        "plan": "IBM Watson Personality Insights Monthly Plan"
     }]
    }
    }
    ```

    You need to copy the credentials for Personality Insights, Tradeoff Analytics and Cloudant.

2. Install [Node.js](http://nodejs.org/)
3. Go to the project folder in a terminal and run:
4. Install the dependencies
    ```
    $ npm install
    ```


5. Go to https://cloudant.com/ and use the credentials from the `VCAP_SERVICES` to create two databases: `schools` and `tradeoffs`.

6. Popule the databases with school information
   ```
   $ run node app.js analyze
   $ run node app.js mergePerformance
   ```
     That will populate the schools database.

6. Start the application
   ```
   $ run node app.js
   ```

7. Go to `http://localhost:3000`

## Team

* Jeronimo De Leon
* Kevin Haggerty
* Kenny Lam
* Angus Lo

### HOW TO WIN HACKATHONS

1. Make sure your demo is FAST. If any processing is too slow, CACHE IT.  
2. Make a rad intro video.

[hackathon]: http://ibmwatsonhackathon.challengepost.com
[demo]: http://nycschoolfinder.mybluemix.net
