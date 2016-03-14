/* ================================================================
 * reliable-slave by xdf(xudafeng[at]126.com)
 *
 * first created at : Tue Mar 17 2015 00:16:10 GMT+0800 (CST)
 *
 * ================================================================
 * Copyright xdf
 *
 * Licensed under the MIT License
 * You may not use this file except in compliance with the License.
 *
 * ================================================================ */

'use strict';

const React = require('react');
const Layout = require('../common/layout');
const _ = require('../../../common/helper');

class Home extends React.Component {

  renderItems() {
    return _.map(this.props.global.sysInfo, (value, name) => {
      return (
        <tr>
          <td>{name}</td>
          <td>{JSON.stringify(value)}</td>
        </tr>
      );
    });
  }

  render() {
    return (
      <Layout {...this.props}>
        <div className="container">
          <table className="table table-condensed table-bordered">
            <tr>
              <td>status</td>
              <td>{this.props.global.__task_status}</td>
            </tr>
            {this.renderItems()}
          </table>
        </div>
      </Layout>
    );
  }
}

module.exports = Home;
