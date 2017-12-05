var assert = require("chai").assert;
var join = require("path").join;
var ConfigurationBase = require("../config").ConfigurationBase;
var PathUtils = require("../utils").PathUtils;

describe("test configuration", function() {
    it("should create new configuration", function() {
    const config = new ConfigurationBase(PathUtils.join(__dirname,"config"));
    assert.equal(config.getConfigurationPath(), join(__dirname,"config"));
});

it("should use ConfigurationBase.setSourceAt", function() {
    const config = new ConfigurationBase(PathUtils.join(__dirname,"config"));
    config.setSourceAt("settings/groupA/settingA", true);
    assert.equal(config.getSourceAt("settings/groupA/settingA"), true);
    assert.notEqual(config.getSourceAt("settings/groupA/settingA"), false);
    });
});