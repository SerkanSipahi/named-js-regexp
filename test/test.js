var expect = require("chai").expect;
var namedRegexp = require("../lib/named-js-regexp");

describe("NamedRegExp must", function () {
	var regex = namedRegexp("(?<hours>\\d\\d?):(?<minutes>\\d\\d?):(?<seconds>\\d\\d?)");
	it("be instance of RegExp.", function () { expect(regex).to.be.instanceof(RegExp); });
	it("have execGroups function.", function () { expect(regex.execGroups).to.be.a("function"); });
	it("have groupsIndices dictionary.", function () { expect(regex.groupsIndices).to.be.an("object"); });
});

describe("Result from exec() must be", function () {
	var regex = namedRegexp("(?<hours>\\d\\d?):(?<minutes>\\d\\d?):(?<seconds>\\d\\d?)");
	var result = regex.exec("1:2:33");
	it("valid Array.", function () { expect(result).to.be.an("array"); });
	it("have group(name,all) function.", function () { expect(result.group).to.be.a("function"); });
	it("have groups(all) function.", function () { expect(result.groups).to.be.a("function"); });
});

describe("Check", function () {
	it("that invalide expression throws an error.", function () { expect(function () { namedRegexp("?") }).to.throw(Error); });
	it("that missing end '>' throws an error.", function () { expect(function () { namedRegexp("(?<hours<abc)") }).to.throw(/missing in named group/); });
	it("that '\)' is correctly escaped.", function () { expect(namedRegexp("\\((?<foo>\\d\\d)").execGroups("(12").foo).to.be.equal("12"); });
	it("that matched expression with no named groups returns groups={}.", function () { expect(namedRegexp("(\\d\\d)|(\\w)").execGroups("a")).to.be.deep.equal({}); });
	it("deep expression nesting.", function () { expect(namedRegexp("(((((((?<a>\\d\\d\\d)))-((?<b>\\d\\d))))-((((?<c>\\d))))))").execGroups("123-45-6")).to.be.deep.equal({ a: "123", b: "45", c: "6" }); });
	var urlRegexp = namedRegexp("^((?<schema>http[s]?|ftp):\\\/)?\\\/?(?<domain>[^:\\\/\\s]+)(?<path>(\\\/\\w+)*\\\/)(?<file>[\\w\\-\\.]+[^#?\\s]+)(?<query>.*)?$");
	var urlParts = urlRegexp.execGroups("https://www.google.com/some/path/search.html?a=0&b=1");
	it("url parsing.", function () { expect(urlParts).to.be.deep.equal({ schema: "https", domain: "www.google.com", path: "/some/path/", file: "search.html", query: "?a=0&b=1" }); });
});

describe("User group name ", function () {
	it("should start with ':$_a-zA-Z' .", function () { expect(function () { namedRegexp("(?<$>.)"); namedRegexp("(?<$>.)"); namedRegexp("(?<A>.)"); namedRegexp("(?<A>.)"); }).to.not.throw(); });
	it("should not star with '.' .", function () { expect(function () { namedRegexp("(?<.>.)"); }).to.throw(/Invalide group name/); });
	it("should not star with '1' .", function () { expect(function () { namedRegexp("(?<1>.)"); }).to.throw(/Invalide group name/); });
	it("should not be empty '1' .", function () { expect(function () { namedRegexp("(?<>.)"); }).to.throw(/Invalide group name/); });
});

describe("Using regexp with exec function", function () {
	var regex = namedRegexp("(?<hours>\\d\\d?):(?<minutes>\\d\\d?):(?<seconds>\\d\\d?)");
	var result = regex.exec("1:2:33");
	it("check groups() result.", function () { expect(result.groups()).to.be.deep.equal({ hours: "1", minutes: "2", seconds: "33" }); });
	it("check group() with valid group name.", function () { expect(result.group("hours")).to.be.equal("1"); });
	it("check group() with invalide group name.", function () { expect(result.group("hours1")).to.be.undefined; });
});

describe("Using regexp with execGroups function", function () {
	var regex = namedRegexp("(?<hours>\\d\\d?):(?<minutes>\\d\\d?)(:(?<seconds>\\d\\d?))?");
	it("check result", function () { expect(regex.execGroups("1:2:33")).to.be.deep.equal({ hours: "1", minutes: "2", seconds: "33" }); });
	it("group with unmatched name should be undefined.", function () { expect(regex.execGroups("1:2")).to.be.deep.equal({ hours: "1", minutes: "2", seconds: undefined }); });
	it("if check fails, null should be returned.", function () { expect(regex.execGroups("1")).to.be.null; });
});

describe("Using regexp with groupsIndices property", function () {
	var regex = namedRegexp("(?<hours>\\d\\d?):(?<minutes>\\d\\d?)(:(?<seconds>\\d\\d?))?");
	var matches = "1:2".match(regex);
	it("check hours.", function () { expect(matches[regex.groupsIndices["hours"]]).to.be.equal("1"); });
	it("check minutes.", function () { expect(matches[regex.groupsIndices["minutes"]]).to.be.equal("2"); });
	it("group with unmatched name should be undefined.", function () { expect(matches[regex.groupsIndices["seconds"]]).to.be.undefined; });
	it("using invalide group name should be undefined.", function () { expect(matches[regex.groupsIndices["foo"]]).to.be.undefined; });
});

describe("NamedRegExp should bahave just like normal RegExp", function () {
	var regex = namedRegexp("^((\\d\\d?):(\\d\\d?))$");
	it("with test function", function () { expect(regex.test("1:2:33")).to.be.false; });
	it("with test function", function () { expect(regex.test("1:2")).to.be.true; });
	var result = regex.exec("1:3");
	it("with exec function", function () { expect(result[2]).to.be.equal("1"); });
	it("with exec function", function () { expect(result[3]).to.be.equal("3"); });
});

describe("Group names duplication", function () {
	var regex0 = namedRegexp("^(?<first>\\d)(?<second>\\d)((?<first>\\d)(?<first>\\d))$");
	it("should return array of indices for duplicated group name .", function () { expect(regex0.groupsIndices).to.be.deep.equal({ first: [1, 4, 5], second: 2 }); });

	var regex1 = namedRegexp("^(?<first>\\d)(?<first>\\d)$");
	var res1 = regex1.exec("12");
	it("should return first group value.", function () { expect(res1.groups().first).to.be.equal("1"); });
	it("second call should return first group value from cache.", function () { expect(res1.groups().first).to.be.equal("1"); });
	it("should return array if all is set to true.", function () { expect(res1.groups(true).first).to.be.deep.equal(["1", "2"]); });
	it("second call should should return array if all is set to true from cache.", function () { expect(res1.groups(true).first).to.be.deep.equal(["1", "2"]); });

	var regex2 = namedRegexp("(?<digit>((?<a>\\d):(?<b>\\d)))|(?<char>((?<a>\\w):(?<b>\\w)))");
	var res21 = regex2.exec("a:b");
	it("with nested named groups.", function () { expect(res21.groups()).to.be.deep.equal({ a: "a", b: "b", digit: undefined, char: "a:b" }); });
	it("with nested named groups (from cache).", function () { expect(res21.groups()).to.be.deep.equal({ a: "a", b: "b", digit: undefined, char: "a:b" }); });
	it("with nested named groups.", function () { expect(regex2.execGroups("1:2")).to.be.deep.equal({ a: "1", b: "2", digit: "1:2", char: undefined }); });
	it("with nested named groups (from cache).", function () { expect(regex2.execGroups("1:2")).to.be.deep.equal({ a: "1", b: "2", digit: "1:2", char: undefined }); });

	it("with nested named groups.", function () { expect(res21.groups(true)).to.be.deep.equal({ a: [undefined, "a"], b: [undefined, "b"], digit: undefined, char: "a:b" }); });
	it("with nested named groups (from cache).", function () { expect(res21.groups(true)).to.be.deep.equal({ a: [undefined, "a"], b: [undefined, "b"], digit: undefined, char: "a:b" }); });
	it("with nested named groups.", function () { expect(regex2.execGroups("1:2", true)).to.be.deep.equal({ a: ["1", undefined], b: ["2", undefined], digit: "1:2", char: undefined }); });
	it("with nested named groups (from cache).", function () { expect(regex2.execGroups("1:2", true)).to.be.deep.equal({ a: ["1", undefined], b: ["2", undefined], digit: "1:2", char: undefined }); });

	it("with group(name,all).", function () { expect(res21.group("a")).to.be.equal("a"); });
	it("with group(name,all).", function () { expect(res21.group("a", true)).to.be.deep.equal([undefined, "a"]); });
	it("with group(name,all).", function () { expect(res21.group("char")).to.be.deep.equal("a:b"); });
	it("with group(name,all).", function () { expect(res21.group("char", true)).to.be.deep.equal("a:b"); });
});


describe("Successive matched", function () {
	var regex = namedRegexp("(?<x>\\d)(?<y>\\w)", "g");
	it("for first match.", function () { expect(regex.exec("1a2b").groups()).to.be.deep.equal({ x: "1", y: "a" }); });
	it("for second match.", function () { expect(regex.exec("1a2b").groups()).to.be.deep.equal({ x: "2", y: "b" }); });
	it("and null for last.", function () { expect(regex.exec("1a2b")).to.be.null; });
});


