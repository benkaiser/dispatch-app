const { createAppAuth } = require("@octokit/auth-app");
const { Octokit } = require("@octokit/core");
const fetch = require('node-fetch');

module.exports = async function (context, req) {
  console.log("Starting request for: ");
  console.log({
    repo: req.params.repo,
    owner: req.params.owner,
    body: req.rawBody
  });

  const auth = createAppAuth({
    appId: process.env.APP_ID,
    privateKey: process.env.PRIVATE_KEY.replace(/\|\|/g, "\n"),
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
  });

  // Retrieve JSON Web Token (JWT) to authenticate as app
  return auth({ type: "app" }).then(async appAuthentication => {

    console.log("App authenticated");

    const octokit = new Octokit({ auth: appAuthentication.token });
    const installationDetails = await octokit.request('GET /repos/{owner}/{repo}/installation', {
      owner: req.params.owner,
      repo: req.params.repo,
    });
    if (installationDetails?.data?.id) {
      console.log("Installation id: " + installationDetails.data.id);

      // Retrieve installation access token
      const installationAuthentication = await auth({
        type: "installation",
        installationId: installationDetails.data.id,
      });

      console.log("Installation authentication created");

      const fetchResponse = await fetch(`https://api.github.com/repos/${req.params.owner}/${req.params.repo}/dispatches`, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'authorization': 'Bearer ' + installationAuthentication.token
        },
        body: req.rawBody
      });
      const body = await fetchResponse.text();
      console.log("Dispatches response: " + fetchResponse.status);
      context.res = {
        status: fetchResponse.status,
        body: body
      };
    } else {
      console.log('No installation id');
    }
  });
}