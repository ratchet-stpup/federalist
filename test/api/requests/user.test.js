var crypto = require("crypto")
var expect = require("chai").expect
var nock = require("nock")
var Promise = require("bluebird")
var request = require("supertest-as-promised")
var sinon = require("sinon")

var factory = require("../support/factory")
var githubAPINocks = require("../support/githubAPINocks")
var session = require("../support/session")

describe("User API", () => {
  var userResponseExpectations = (response, user) => {
    expect(response).to.have.property("id", user.id)
    expect(response).to.have.property("username", user.username)
    expect(response).to.have.property("email", user.email)
    expect(response).to.have.property("sites")
    expect(response).to.have.property("builds")
  }

  describe("GET /v0/me", () => {
    it("should require authentication", done => {
      factory(User).then(user => {
        return request("http://localhost:1337")
          .get("/v0/me")
          .expect(403)
      }).then(response => {
        expect(response.body).to.be.empty
        done()
      })
    })

    it("should render the current user with their GitHub user data", done => {
      var user

      factory(User).then(model => {
        user = model
        return session(user)
      }).then(cookie => {
        return request("http://localhost:1337")
          .get("/v0/me")
          .set("Cookie", cookie)
          .expect(200)
      }).then(response => {
        userResponseExpectations(response.body, user)
        expect(response.body).to.have.property("githubAccessToken", user.githubAccessToken)
        expect(response.body).to.have.property("githubUserId", user.githubUserId)
        done()
      })
    })
  })

  describe("GET /v0/user/:id", () => {
    it("should require authentication", done => {
      factory(User).then(user => {
        return request("http://localhost:1337")
          .get(`/v0/user/${user.id}`)
          .expect(403)
      }).then(response => {
        expect(response.body).to.be.empty
        done()
      })
    })

    it("should show a JSON representation of the current user if the id matches theirs", done => {
      var user

      factory(User).then(model => {
        user = model
        return session(user)
      }).then(cookie => {
        return request("http://localhost:1337")
          .get(`/v0/user/${user.id}`)
          .set("Cookie", cookie)
          .expect(200)
      }).then(response => {
        userResponseExpectations(response.body, user)
        done()
      })
    })

    it("should not include GitHub user data", done => {
      factory(User).then(model => {
        user = model
        return session(user)
      }).then(cookie => {
        return request("http://localhost:1337")
          .get(`/v0/user/${user.id}`)
          .set("Cookie", cookie)
          .expect(200)
      }).then(response => {
        expect(response.body).not.to.have.property("githubAccessToken")
        expect(response.body).not.to.have.property("githubUserId")
        done()
      })
    })

    it("should respond with a 403 if the requested user does not match the current user", done => {
      var user

      factory(User).then(model => {
        user = model
        return session()
      }).then(cookie => {
        return request("http://localhost:1337")
          .get(`/v0/user/${user.id}`)
          .set("Cookie", cookie)
          .expect(403)
      }).then(response => {
        expect(response.body).to.be.empty
        done()
      })
    })
  })

  describe("POST /v0/user/add-site", () => {
    beforeEach(() => {
      githubAPINocks.webhook()
      githubAPINocks.repo()
    })

    afterEach(() => {
      nock.cleanAll()
    })

    it("should require authentication", done => {
      factory(User).then(user => {
        return request("http://localhost:1337")
          .post(`/v0/user/add-site`)
          .send({
            owner: "example-org",
            repository: "example-repo",
            engine: "jekyll",
            defaultBranch: "master",
            users: [user.id]
          })
          .expect(403)
      }).then(response => {
        expect(response.body).to.be.empty
        done()
      })
    })

    it("should create a new site for a remote repository", done => {
      var user
      var siteOwner = crypto.randomBytes(3).toString("hex")
      var siteRepository = crypto.randomBytes(3).toString("hex")

      factory(User).then(model => {
        user = model
        return session(user)
      }).then(cookie => {
        return request("http://localhost:1337")
          .post("/v0/user/add-site")
          .send({
            owner: siteOwner,
            repository: siteRepository,
            engine: "jekyll",
            defaultBranch: "18f-pages",
            users: [user.id]
          })
          .set("Cookie", cookie)
          .expect(200)
      }).then(response => {
        return Site.findOne({ id: response.body.id }).populate("users")
      }).then(site => {
        expect(site).to.have.property("owner", siteOwner)
        expect(site).to.have.property("repository", siteRepository)
        expect(site).to.have.property("defaultBranch", "18f-pages")
        expect(site).to.have.property("engine", "jekyll")
        expect(site.users.map(user => user.id)).to.deep.equal([user.id])
        done()
      })
    })

    it("should add a user to a site if a site already exists for the remote repository", done => {
      var user, site
      var siteOwner = crypto.randomBytes(3).toString("hex")
      var siteRepository = crypto.randomBytes(3).toString("hex")

      factory(User).then(model => {
        user = model
        return factory(Site, { owner: siteOwner, repository: siteRepository })
      }).then(model => {
        site = model
        return session(user)
      }).then(cookie => {
        return request("http://localhost:1337")
          .post("/v0/user/add-site")
          .send({
            owner: siteOwner,
            repository: siteRepository,
            engine: "jekyll",
            defaultBranch: "18f-pages",
            users: [user.id]
          })
          .set("Cookie", cookie)
          .expect(200)
      }).then(response => {
        expect(response.body).to.have.property("id", site.id)
        return Site.findOne({ id: site.id }).populate("users")
      }).then(site => {
        expect(site.users).to.have.length(2)
        expect(site.users.map(user => user.id)).to.contain(user.id)
        done()
      })
    })

    it("should create a webhook for the site", done => {
      var user, webhookNock
      var siteOwner = crypto.randomBytes(3).toString("hex")
      var siteRepository = crypto.randomBytes(3).toString("hex")

      factory(User).then(model => {
        user = model
        return session(user)
      }).then(cookie => {
        nock.cleanAll()
        githubAPINocks.repo()
        webhookNock = githubAPINocks.webhook({
          accessToken: user.githubAccessToken,
          owner: siteOwner,
          repo: siteRepository,
        })

        return request("http://localhost:1337")
          .post("/v0/user/add-site")
          .send({
            owner: siteOwner,
            repository: siteRepository,
            engine: "jekyll",
            defaultBranch: "18f-pages",
            users: [user.id]
          })
          .set("Cookie", cookie)
          .expect(200)
      }).then(response => {
        expect(webhookNock.isDone()).to.equal(true)
        done()
      })
    })

    it("should respond with a 400 if no owner or repo is specified and not create a site", done => {
      var user

      factory(User).then(model => {
        user = model
        return session(user)
      }).then(cookie => {
        return request("http://localhost:1337")
          .post("/v0/user/add-site")
          .send({
            engine: "jekyll",
            defaultBranch: "18f-pages",
            users: [user.id]
          })
          .set("Cookie", cookie)
          .expect(400)
      }).then(response => {
        return Site.find({ user: user.id })
      }).then(sites => {
        expect(sites).to.have.length(0)
        done()
      })
    })

    it("should render a 400 if the user does not have write access to the repository and not create a site", done => {
      var user, repoNock
      var siteOwner = crypto.randomBytes(3).toString("hex")
      var siteRepository = crypto.randomBytes(3).toString("hex")

      factory(User).then(model => {
        user = model
        return session(user)
      }).then(cookie => {
        nock.cleanAll()
        githubAPINocks.webhook()
        repoNock = githubAPINocks.repo({
          response: [200, { permissions: { push: false } }],
          owner: siteOwner,
          repo: siteRepository,
          accessToken: user.githubAccessToken,
        })

        return request("http://localhost:1337")
          .post("/v0/user/add-site")
          .send({
            owner: siteOwner,
            repository: siteRepository,
            engine: "jekyll",
            defaultBranch: "18f-pages",
            users: [user.id]
          })
          .set("Cookie", cookie)
          .expect(400)
      }).then(response => {
        return Site.find({ user: user.id })
      }).then(sites => {
        expect(sites).to.have.length(0)
        expect(repoNock.isDone()).to.equal(true)
        done()
      })
    })

    it("should not allow users to create sites for other users", done => {
      var currentUser, otherUser
      var siteOwner = crypto.randomBytes(3).toString("hex")
      var siteRepository = crypto.randomBytes(3).toString("hex")

      Promise.all([factory(User), factory(User)]).then(users => {
        currentUser = users[0]
        otherUser = users[1]
        return session(currentUser)
      }).then(cookie => {
        return request("http://localhost:1337")
          .post("/v0/user/add-site")
          .send({
            owner: siteOwner,
            repository: siteRepository,
            engine: "jekyll",
            defaultBranch: "18f-pages",
            users: [otherUser.id]
          })
          .set("Cookie", cookie)
          .expect(200)
      }).then(response => {
        return Site.findOne({ id: response.body.id }).populate("users")
      }).then(site => {
        expect(site.users).to.have.length(1)
        expect(site.users[0]).to.have.property("id", currentUser.id)
        return User.findOne({ id: otherUser.id }).populate("sites")
      }).then(otherUser => {
        expect(otherUser.sites).to.have.length(0)
        done()
      })
    })


    it("should not allow users to remove sites for other users", done => {
      var user, site

      factory(Site).then(model => {
        site = model
        return factory(User)
      }).then(model => {
        user = model
        return session(user)
      }).then(cookie => {
        return request("http://localhost:1337")
          .post("/v0/user/add-site")
          .send({
            owner: site.owner,
            repository: site.repository,
            engine: "jekyll",
            defaultBranch: "18f-pages",
            users: [user.id]
          })
          .set("Cookie", cookie)
          .expect(200)
      }).then(response => {
        return Site.findOne({ id: site.id }).populate("users")
      }).then(site => {
        expect(site.users).to.have.length(2)
        expect(site.users.map(user => user.id)).to.contain(user.id)
        done()
      })
    })
  })
})
