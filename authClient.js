
//  implementation — of the code which checks the authentication based on the project details could be resource group details based on some logic Azure Active Directry can come into picture here
async function Get(projectId) {
  // Generate an authorization tolen 
  return {
    accessToken: 'Some-token',
    projectId: projectId,
  };
}

module.exports = Get;
