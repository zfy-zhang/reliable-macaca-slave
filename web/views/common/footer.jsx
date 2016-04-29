'use strict';

const React = require('react');

class Footer extends React.Component {
  render() {
    return (
      <footer>
        <div className="text-center">
          &copy;{new Date().getFullYear()}
          &nbsp;
          <a href={this.props.pkg.homepage} target="_blank">{this.props.pkg.name}</a>
        </div>
      </footer>
    );
  }
}

module.exports = Footer;
