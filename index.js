const { createAppAuth } = require("@octokit/auth-app");
const { Octokit } = require("@octokit/core");
const fetch = require('node-fetch');

const fs = require('fs');

const private_key  = fs.readFileSync('./private.key', 'utf8');
const client_secret  = fs.readFileSync('./client.secret', 'utf8');


const auth = createAppAuth({
  appId: 113362,
  privateKey: private_key,
  clientId: "Iv1.a949dc1a68396689",
  clientSecret: client_secret,
});

// Retrieve JSON Web Token (JWT) to authenticate as app
auth({ type: "app" }).then(async appAuthentication => {

  console.log(appAuthentication);

  const octokit = new Octokit({ auth: appAuthentication.token });
  const installationDetails = await octokit.request('GET /repos/{owner}/{repo}/installation', {
    owner: 'benkaiser',
    repo: 'testing-web-action-persistence',
  });
  if (installationDetails?.data?.id) {
    console.log("Installation id: " + installationDetails.data.id);

    // Retrieve installation access token
    const installationAuthentication = await auth({
      type: "installation",
      installationId: installationDetails.data.id,
    });

    console.log("Installation authentication:");
    console.log(installationAuthentication);

    fetch("https://api.github.com/repos/benkaiser/testing-web-action-persistence/dispatches", {
      method: 'POST',
      mode: 'cors',
      headers: {
        'authorization': 'Bearer '+ installationAuthentication.token
      },
      body: JSON.stringify({ event_type: 'some-event', client_payload: { data: JSON.stringify({ another: { nested: { data: 'woohoo' }}}) } })
    });
  } else {
    console.log('No installation id');
  }
})


// private_pem = File.read(YOUR_PATH_TO_PEM)
// private_key = OpenSSL::PKey::RSA.new(private_pem)

// # Generate the JWT
// payload = {
//   # issued at time, 60 seconds in the past to allow for clock drift
//   iat: Time.now.to_i - 60,
//   # JWT expiration time (10 minute maximum)
//   exp: Time.now.to_i + (10 * 60),
//   # GitHub App's identifier
//   iss: YOUR_APP_ID
// }

// jwt = JWT.encode(payload, private_key, "RS256")