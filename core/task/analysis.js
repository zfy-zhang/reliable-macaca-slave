'use strict';

var bodyStatus = {
  SUCCESS: 2,
  FAILED: 3
};

function getRegex(word) {
  return new RegExp('\\d+ (' + word + ')');
}

var passPattern = getRegex('passing');
var failPattern = getRegex('failing');

/**
 * Analyze the logs and return the result data.
 * @param logs
 * @returns {{passing: number, failing: number, status: number}}
 */
module.exports = function(logs) {
  var passing = passPattern.exec(logs);
  var failing = failPattern.exec(logs);
  var passingNum = passing ? Number(passing[0].split(' ')[0]) : 0;
  var failingNum = failing ? Number(failing[0].split(' ')[0]) : 0;

  var status = passingNum && !failingNum ? bodyStatus.SUCCESS : bodyStatus.FAILED;

  return {
    passing: passingNum,
    failing: failingNum,
    status: status
  };
};
