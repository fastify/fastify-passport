"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Authenticator = exports.Strategy = void 0;
var Authenticator_1 = require("./Authenticator");
require("./type-extensions"); // necessary to make sure that the fastify types are augmented
var passport = new Authenticator_1.Authenticator();
// Workaround for importing fastify-passport in native ESM context
module.exports = exports = passport;
exports.default = passport;
var strategies_1 = require("./strategies");
Object.defineProperty(exports, "Strategy", { enumerable: true, get: function () { return strategies_1.Strategy; } });
var Authenticator_2 = require("./Authenticator");
Object.defineProperty(exports, "Authenticator", { enumerable: true, get: function () { return Authenticator_2.Authenticator; } });
