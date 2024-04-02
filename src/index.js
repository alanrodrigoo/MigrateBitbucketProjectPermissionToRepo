const request = require('./request');
const env = require('./config');

(async () => {

  var projects = await getProjects(env);
  const cookie = ''
  //const cookie = `${projects.headers['set-cookie'][1].split(';')[0]}; ${projects.headers['set-cookie'][2].split(';')[0]}; ${projects.headers['set-cookie'][3].split(';')[0]}`
  var projectsWithUserPermitions = await getProjectUserPermission(env, projects.data)
  var projectsWithGroupPermitions = await getProjectGroupPermission(env, projectsWithUserPermitions)
  await setReposPermissions(env, projectsWithGroupPermitions)
  await deleteProjectPermissions(env, projectsWithGroupPermitions)

})()

async function getProjects(env, extraHeaders) {

  try {
    const url = `https://${env.bitbucketurl}/rest/api/latest/projects/?limit=10000`
    res = await request(url, env.token, 'get')
    if (res.status == 200) {
      // test for status you want, etc
      return res
    }
  }
  catch (err) {
    console.error(err);
  }

}

async function setReposPermissions(env, projectList) {
  await Promise.all(projectList.values.map(async (project) => {

    var url = `http://${env.bitbucketurl}/rest/api/latest/projects/${project.key}/repos/?limit=10000`
    res = await request(url, env.token, 'get')

    if (res.status == 200) {

      res.data.values.forEach(async repo => {

        project.permission.forEach(async permission => {

          var url = `http://${env.bitbucketurl}/rest/api/latest/projects/${project.key}/repos/${repo.slug}/permissions/${permission.type}?name=${permission.name}&permission=${permission.level.replace('PROJECT', 'REPO')}`
          resPer = await request(url, env.token, 'put')
          if (resPer.status == 204) {
            console.log(`ACESS GRANTED TO '${permission.name}' ON '${project.key}/${repo.slug}' WITH '${permission.type}/${permission.level.replace('PROJECT', 'REPO')}'`)

            var url = `http://${env.bitbucketurl}/rest/api/latest/projects/${project.key}/permissions/${permission.type}?name=${permission.name}`
            resPer = await request(url, env.token, 'delete')
            if (resPer.status == 204) {
              console.log(`ACESS DELETED TO '${permission.name}' FROM '${project.key}'`)
            }

          }

        });

      });

    }

  }));
}


async function getProjectUserPermission(env, projectList) {

  await Promise.all(projectList.values.map(async (element) => {

    const url = `https://${env.bitbucketurl}/rest/api/latest/projects/${element.key}/permissions/users`
    res = await request(url, env.token, 'get')

    if (res.status == 200) {
      element.permission = []
      res.data.values.forEach(async obj => {
        element.permission.push({
          type: 'users',
          name: obj.user.name,
          level: obj.permission
        })
      });
    }

  }));

  return projectList

}

async function getProjectGroupPermission(env, projectList) {

  await Promise.all(projectList.values.map(async (element) => {

    const url = `https://${env.bitbucketurl}/rest/api/latest/projects/${element.key}/permissions/groups`
    res = await request(url, env.token, 'get')

    if (res.status == 200) {
      res.data.values.forEach(async obj => {

        element.permission.push({
          type: 'groups',
          name: obj.group.name,
          level: obj.permission
        })
      });
    }

  }));

  return projectList

}
