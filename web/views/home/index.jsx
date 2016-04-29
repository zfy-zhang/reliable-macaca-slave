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
