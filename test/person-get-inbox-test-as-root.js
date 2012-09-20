// person-get-inbox-test-as-root.js
//
// Test getting the inbox of a remote person
//
// Copyright 2012, StatusNet Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

var assert = require("assert"),
    vows = require("vows"),
    Step = require("step"),
    http = require("http"),
    querystring = require("querystring"),
    _ = require("underscore"),
    Person = require("../lib/model/person").Person,
    databank = require("databank"),
    httputil = require("./lib/http"),
    oauthutil = require("./lib/oauth"),
    newCredentials = oauthutil.newCredentials,
    newClient = oauthutil.newClient,
    pj = httputil.postJSON,
    gj = httputil.getJSON,
    dialbackApp = require("./lib/dialback").dialbackApp,
    setupApp = oauthutil.setupApp,
    Databank = databank.Databank,
    DatabankObject = databank.DatabankObject;

var suite = vows.describe("test discovery of endpoint for a user");

suite.addBatch({
    "When we set up the app": {
        topic: function() {
            var db = Databank.get("memory", {data: {}});
            Step(
                function() {
                    db.connect({}, this);
                },
                function(err) {
                    if (err) throw err;
                    DatabankObject.bank = db;
                    setupApp(80, "social.localhost", this);
                },
                this.callback
            );
        },
        "it works": function(err, app) {
            assert.ifError(err);
        },
        teardown: function(app) {
            app.close();
        },
        "and we create an in-process Person with an Webfinger ID on an invalid domain": {
            topic: function() {
                var props = {id: "acct:derrick@social.invalid"},
                    callback = this.callback;
                Person.create(props, callback);
            },
            "it works": function(err, person) {
                assert.ifError(err);
                assert.isObject(person);
                assert.instanceOf(person, Person);
            },
            "and we try to get their inbox URL": {
                topic: function(person) {
                    var callback = this.callback;
                    person.getInbox(function(err, endpoint) {
                        if (err) {
                            callback(null);
                        } else {
                            callback(new Error("Unexpected success"));
                        }
                    });
                },
                "it fails correctly": function(err) {
                    assert.ifError(err);
                }
            }
        },
        "and we create an in-process Person with an Webfinger ID on a valid domain but nonexistent account": {
            topic: function() {
                var props = {id: "acct:mark@social.localhost"},
                    callback = this.callback;
                Person.create(props, callback);
            },
            "it works": function(err, person) {
                assert.ifError(err);
                assert.isObject(person);
                assert.instanceOf(person, Person);
            },
            "and we try to get their inbox URL": {
                topic: function(person) {
                    var callback = this.callback;
                    person.getInbox(function(err, endpoint) {
                        if (err) {
                            callback(null);
                        } else {
                            callback(new Error("Unexpected success"));
                        }
                    });
                },
                "it fails correctly": function(err) {
                    assert.ifError(err);
                }
            }
        },
        "and we get new OAuth credentials": {
            topic: function() {
                oauthutil.newClient("social.localhost", 80, this.callback);
            },
            "it works": function(err, cl) {
                assert.ifError(err);
                assert.isObject(cl);
            },
            "and we register a new user": {
                topic: function(cl) {
                    oauthutil.register(cl, "jeffmills", "m00n", "social.localhost", 80, this.callback);
                },
                "it works": function(err, user) {
                    assert.ifError(err);
                    assert.isObject(user);
                },
                "and we create an in-process Person with that ID": {
                    topic: function() {
                        var props = {id: "acct:jeffmills@social.localhost"},
                            callback = this.callback;

                        Person.create(props, function(err, person) {
                            if (err) {
                                callback(err, null);
                            } else {
                                callback(null, person);
                            }
                        });
                    },
                    "it works": function(err, person) {
                        assert.ifError(err);
                        assert.isObject(person);
                    },
                    "and we get that person's inbox": {
                        topic: function(person) {
                            person.getInbox(this.callback);
                        },
                        "it works": function(err, inbox) {
                            assert.ifError(err);
                            assert.isString(inbox);
                        },
                        "it is correct": function(err, inbox) {
                            assert.ifError(err);
                            assert.isString(inbox);
                            assert.equal(inbox, "http://social.localhost/api/user/jeffmills/inbox");
                        }
                    }
                }
            }
        }
    }
});

suite["export"](module);